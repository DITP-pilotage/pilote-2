# Design — Initialisation de mb-api (backend Marque Blanche)

Date : 2026-04-23
Mise à jour : 2026-04-28 — pivot architecture suite revue PR #2093
Statut : Proposition validée, à implémenter

## 1. Contexte

PILOTE (actuellement `apps/pilote-ppg`) est un outil de pilotage territorial pour les Politiques Prioritaires du Gouvernement (PPG). Chaque ministère porte des chantiers qui contiennent des indicateurs dont on collecte des valeurs pour calculer des taux d'avancement.

L'évolution souhaitée, `pilote-mb` ("Marque Blanche"), vise une version **générique et paramétrable** de cet outil :
- Plus de concept de "chantier" figé — remplacé par des **entités** paramétrables
- Les entités contiennent des **indicateurs de différents types**
- L'objectif est qu'elle puisse être déployée par différents clients avec leur propre paramétrage métier

Ce document décrit l'**initialisation du backend** (`mb-api`), premier composant de l'app. Le frontend (`pilote-mb-webapp`, Vite + React + TanStack Query) viendra dans un ticket séparé.

## 2. Objectifs de l'init

1. Mettre en place le squelette du backend avec une architecture pragmatique, sans sur-design
2. Livrer un premier endpoint `GET /health` fonctionnel
3. Figer les conventions d'architecture dans un CLAUDE.md et un ADR
4. Préparer l'intégration future avec un agent IA satellite consommant l'API
5. Préparer les fondations de l'authentification (API Keys complètes + scaffolding user/ProConnect)

## 3. Vocabulaire

| Terme | Définition |
|---|---|
| pilote-mb / Marque Blanche | Version générique paramétrable de pilote-ppg |
| mb-api | Backend Hono de pilote-mb |
| pilote-mb-webapp | Futur front Vite + React (hors scope de ce ticket) |
| PPG | Politique Prioritaire du Gouvernement (vocabulaire pilote-ppg) |
| Entity | Nouvelle entité générique de pilote-mb (remplace "chantier") |
| Indicateur | Mesure associée à une Entity |
| ProConnect | IdP gouvernemental (ex-AgentConnect) pour les users humains |
| Module | Unité de découpage de l'app (`authentication`, `healthcheck`, …) — granularité Awilix `defineModule`. Pas un bounded context. |
| Functional core / Imperative shell | Cœur métier = fonctions pures sur des types ; bord = use cases qui orchestrent I/O |
| ApiModel | Forme JSON exposée par l'API (published language entre back et front), réutilisée pour l'inférence end-to-end type-safe |

## 4. Stack technique

### Runtime et outillage
- Node 24.9 (aligné pilote-ppg)
- pnpm 10
- TypeScript strict, module resolution NodeNext

### HTTP et API
- **Hono** comme framework HTTP
- **@hono/zod-openapi** pour routes typées + génération OpenAPI 3.1
- **@hono/swagger-ui** pour Swagger UI embarqué (exposé en prod aussi — objectif produit)

### Persistence
- **Prisma 6** avec PostgreSQL
- Multi-schéma optionnel (on commence avec un seul schéma `public`)

### Domaine et logique applicative
- **Awilix** pour Dependency Injection (mode ProxyInjection, tout singleton)
- **Zod** pour validation
- **neverthrow** pour `Result<T, E>` et `ResultAsync<T, E>` — orchestration en railway oriented programming, pas d'`isErr` partout

### Observabilité
- **pino** pour le logging via pattern de sinks composables
- Logs persistés en DB initialement (pas d'APM disponible) via un sink dédié, remplaçable sans refacto du code métier

### Authentification
- **API Keys** en DB pour les agents/services machine-to-machine (impl complète), hashées en **SHA-256 déterministe** (lookup par index, cf. section 9.2)
- **ProConnect OIDC** pour les users humains (scaffolding dans ce ticket, intégration dans un ticket suivant)
- **jsonwebtoken** pour le JWT interne (HS256, TTL 8h)
- **openid-client** pour le flow OIDC (à intégrer dans le ticket suivant)
- **AsyncLocalStorage** pour porter l'identité authentifiée à travers la pile async (`requireUser()` accessible depuis les use cases sans la passer en argument)
- Pas de bcrypt — aucun password n'est stocké côté backend (auth users exclusivement via ProConnect)

### Tests
- **Vitest** (backend et futur front)
- `test.sequence.concurrent: true` — parallélisme max par défaut
- `withTestTransaction` — chaque test dans sa propre transaction, rollback automatique
- Pyramide explicite : functional core unit, use cases (commands/queries) en intégration

---

## 5. Architecture

### 5.1 Posture architecturale : CQS lite + functional core / imperative shell

mb-api démarre **sans DDD by the book** : pas d'aggregate roots, pas de domain events, pas de bounded contexts ni de context map. La justification est pragmatique :

- **L'app est neuve, le scope produit n'est pas encore stabilisé** : on ne connaît ni les invariants métier (probablement peu : c'est principalement CRUD + quelques calculs), ni les frontières naturelles entre sous-domaines, ni la roadmap au-delà des pages "indicateur" et "collection".
- **TS full-stack avec types partagés back/front** : modéliser les entités via des classes (AggregateRoot, ValueObject) introduit un coût de sérialisation et empêche de partager simplement les types entre `mb-api` et `pilote-mb-webapp`. Des types nus + factory functions sont strictement plus simples et plus partageables.
- **Une seule équipe, pas de problème de communication inter-équipes** : le context mapping DDD résout des frictions humaines qu'on n'a pas. Importé prématurément, il ajoute de l'indirection sans bénéfice.

On adopte donc :

1. **CQS lite** — séparation explicite des `commands/` (écriture, change l'état) et `queries/` (lecture, retourne des vues dédiées). Même base, pas d'event sourcing, pas de read model dédié à ce stade.
2. **Functional core / imperative shell** — le cœur métier est constitué de **types** + **fonctions pures** (factory functions, transformations, calculs) ; les use cases (commands/queries) sont l'imperative shell qui orchestre les I/O.
3. **Modules** — l'app est découpée en modules Awilix (`framework`, `authentication`, `healthcheck`). Ce sont des unités d'**organisation et d'injection**, pas des bounded contexts. Chaque module est autonome côté code, mais un seul modèle métier traverse l'app (pas de traduction inter-modules).
4. **Une contrainte forte d'architecture** — les modules ne piochent **jamais** dans les tables Prisma d'un autre module. La communication cross-module passe par des **ports** (interfaces métier) exposés par le module source dans son `public/`. Côté queries, on s'autorise plus de souplesse (cf. 5.5) : un module peut exposer une fonction de query, ou plus rarement laisser un autre module l'appeler directement, tant qu'on ne reproduit pas l'anti-pattern pilote-ppg du `prisma.autreContexte` partout.

**Ce qu'on ne fait PAS à l'init :**
- Pas d'`AggregateRoot`, pas de `ValueObject` base class, pas de `DomainEvent`, pas d'event bus métier
- Pas de classes pour les modèles métier — uniquement des **types** et des **factory functions**
- Pas de bounded contexts ni de context map (un seul modèle, pas de Published Language au sens DDD)
- Pas d'Anti-Corruption Layer (rien à traduire entre modules)
- Pas de `shared-kernel` — voir 5.4 sur le renommage en `framework`

**Ce qu'on garde du DDD :**
- Le **vocabulaire métier** dans le code (entités en français : `Indicateur`, `Entity`, `Utilisateur`)
- La discipline d'**isoler les I/O** (ports & adapters côté écriture)
- Des **fonctions de domaine pures** testables sans mock ni DB

### 5.2 Modules de l'init

| Module | Type | Rôle | Présent à l'init |
|---|---|---|---|
| `framework` | tech | Plateforme technique transverse : Prisma, HTTP, logging, container, result, auth context, clock | ✅ |
| `authentication` | métier | API Keys + scaffolding utilisateurs ProConnect | ✅ |
| `healthcheck` | tech/util | Endpoint `GET /health` | ✅ |

Le module `framework` regroupe **tout ce qui est technique et transverse** : il remplace l'ancien découpage `shared-kernel` + `platform`. On évite le terme "shared-kernel" qui en DDD désigne un BC métier partagé — ici ce n'est pas un BC, c'est notre tuyauterie. Le terme `framework` (ou `platform`) est plus juste : on y trouve le `module-system` Awilix, le wrapper Prisma, le logger, le mapping d'erreurs HTTP, le port `Clock`, l'`AuthContext` AsyncLocalStorage, etc.

Modules à venir (tickets ultérieurs) — listés ici pour fixer le vocabulaire, pas pour figer un découpage stratégique :
- `pilotage` — entities paramétrables, indicateurs, collecte
- `parametrage` — méta-modèle Marque Blanche
- `territorialisation` — hiérarchie territoriale
- `rapport` — bilans, exports
- `notification` — emails (Brevo)
- `audit` — historique consolidé (probablement consommateur de logs structurés, pas d'events)

À l'init, on a **deux modules métier-ish** (`authentication`, `healthcheck`) et **un module technique** (`framework`). Ils servent de template concret pour les futurs modules.

### 5.3 Pas de context map

Conséquence de 5.1 : on ne documente pas de Context Map DDD. Il n'y a pas plusieurs équipes, pas plusieurs modèles à réconcilier. Les relations entre modules sont des dépendances de code classiques :

- `framework` est sans dépendance (racine du graphe Awilix)
- `authentication` dépend de `framework`
- `healthcheck` dépend de `framework`
- Plus tard, `pilotage` dépendra de `framework` et consommera des **ports** exposés par `authentication` (ex: `RequireUtilisateur`, `VerifyApiKey`) et — quand ce module existera — `territorialisation`

La règle architecturale unique qui se substitue au Context Map est dans 5.5 : **pas d'accès direct aux tables Prisma d'un autre module**.

### 5.4 Structure des dossiers

```
apps/mb-api/
├── src/
│   ├── framework/                              # tech transverse (pas un module métier)
│   │   ├── persistence/prisma/
│   │   │   ├── prisma-transaction.ts           # AsyncLocalStorage + txStore + PrismaTransaction
│   │   │   └── prisma-pilote.ts                # wrapper injectable
│   │   ├── http/
│   │   │   ├── app.ts                          # buildApp (assemble routes des modules)
│   │   │   ├── middlewares/
│   │   │   │   ├── request-id.middleware.ts
│   │   │   │   ├── logger.middleware.ts
│   │   │   │   ├── auth-context.middleware.ts  # alimente AsyncLocalStorage authentifié
│   │   │   │   ├── auth.middleware.ts          # consomme la facade authentication
│   │   │   │   ├── require-scope.middleware.ts
│   │   │   │   └── error-handler.middleware.ts
│   │   │   ├── schemas/
│   │   │   │   ├── error.schema.ts
│   │   │   │   └── pagination.schema.ts
│   │   │   ├── error-mapping.ts                # ErrorKind → HTTP status
│   │   │   └── respond-with-result.ts
│   │   ├── auth-context/
│   │   │   ├── auth-context.ts                 # AsyncLocalStorage<Auth>
│   │   │   ├── current-auth.ts                 # currentAuth(), requireUser(), requireApiKey()
│   │   │   └── errors.ts                       # UnauthenticatedError, ForbiddenError
│   │   ├── result/
│   │   │   └── index.ts                        # re-export ok/err/Result/ResultAsync de neverthrow
│   │   ├── errors/
│   │   │   ├── app-error.ts                    # base + ErrorKind
│   │   │   └── kinds.ts
│   │   ├── logging/
│   │   │   ├── logger.ts                       # interface Logger
│   │   │   ├── composite-logger.ts
│   │   │   └── sinks/
│   │   │       ├── pino-stdout.sink.ts
│   │   │       └── database.sink.ts
│   │   ├── clock/
│   │   │   ├── clock.ts                        # interface Clock
│   │   │   └── system-clock.ts                 # adapter (Date natif ou Luxon — cf. 6.5)
│   │   ├── module-system/                      # adapté de pilote-ppg
│   │   │   ├── define-module.ts
│   │   │   ├── boot-modules.ts
│   │   │   └── module-names.ts
│   │   ├── container/
│   │   │   └── build-app-container.ts          # bootstrap : assemble tous les modules
│   │   └── framework.module.ts                 # cradle : prisma, transaction, logger, clock, …
│   │
│   ├── authentication/                         # module métier
│   │   ├── model/                              # functional core : types, factories pures, ports (interfaces)
│   │   │   ├── apiKey.ts                       # type ApiKey + createApiKey() + revokeApiKey()
│   │   │   ├── apiKey.test.ts                  # unit
│   │   │   ├── apiKeyId.ts                     # branded type ApiKeyId
│   │   │   ├── scope.ts                        # branded type Scope ("resource:action")
│   │   │   ├── utilisateur.ts                  # type Utilisateur + factory + transitions
│   │   │   ├── utilisateurId.ts
│   │   │   ├── email.ts                        # branded type Email + parseEmail()
│   │   │   ├── statutAcces.ts                  # enum / union de littéraux
│   │   │   ├── apiKeyHasher.ts                 # port (interface)
│   │   │   ├── tokenGenerator.ts               # port
│   │   │   ├── tokenSigner.ts                  # port
│   │   │   ├── apiKeyRepository.ts             # port
│   │   │   └── utilisateurRepository.ts        # port
│   │   ├── commands/                           # use cases d'écriture (imperative shell)
│   │   │   ├── createSession/
│   │   │   │   ├── createSession.ts            # ResultAsync, scaffolding
│   │   │   │   └── createSession.test.ts
│   │   │   └── revokeApiKey/                   # ticket suivant — exemple de structure
│   │   ├── queries/                            # use cases lecture
│   │   │   ├── verifyApiKey/
│   │   │   │   ├── verifyApiKey.ts
│   │   │   │   └── verifyApiKey.test.ts
│   │   │   └── verifyJwt/
│   │   │       ├── verifyJwt.ts
│   │   │       └── verifyJwt.test.ts
│   │   ├── routes/                             # routes Hono (un fichier = une route)
│   │   │   └── createSession.ts
│   │   ├── infrastructure/                     # adapters concrets non-HTTP
│   │   │   ├── persistence/
│   │   │   │   ├── apiKeyMapper.ts
│   │   │   │   ├── apiKeyPrismaRepository.ts
│   │   │   │   ├── utilisateurMapper.ts
│   │   │   │   └── utilisateurPrismaRepository.ts
│   │   │   ├── crypto/
│   │   │   │   ├── sha256ApiKeyHasher.ts
│   │   │   │   ├── cryptoTokenGenerator.ts
│   │   │   │   └── jsonwebtokenTokenSigner.ts
│   │   │   ├── proconnect/
│   │   │   │   └── proconnectClient.ts         # scaffolding (ticket suivant)
│   │   │   └── scripts/
│   │   │       └── createApiKey.ts             # CLI
│   │   ├── public/                             # exports cross-module
│   │   │   ├── authenticationFacade.ts         # interface des opérations exposées
│   │   │   ├── apiKeyApiModel.ts               # types ApiModel partagés (front/back)
│   │   │   └── utilisateurApiModel.ts
│   │   └── authentication.module.ts            # cradle + exports
│   │
│   ├── healthcheck/                            # module minimal
│   │   ├── queries/
│   │   │   ├── getHealth.ts
│   │   │   └── getHealth.test.ts
│   │   ├── routes/
│   │   │   └── health.ts
│   │   └── healthcheck.module.ts
│   │
│   ├── test/                                   # helpers transverses (pas un module)
│   │   ├── vitest.setup.ts
│   │   ├── with-test-transaction.ts
│   │   ├── test-context.ts
│   │   ├── fake-clock.ts
│   │   └── fixtures/
│   │       ├── api-key.fixture.ts
│   │       └── utilisateur.fixture.ts
│   │
│   ├── config.ts                               # Config Zod-validée
│   └── index.ts                                # bootstrap
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   └── architecture/
│       └── decisions/
│           ├── 0001-record-architecture-decisions.md
│           └── 0002-architecture-init-mb-api.md
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .dependency-cruiser.cjs
├── .eslintrc.cjs
├── .prettierrc
└── CLAUDE.md
```

Tests co-localisés : `foo.ts` + `foo.test.ts` côte-à-côte.

**Convention de nommage :** un fichier exporte une chose, et **le nom du fichier = le nom de la chose exportée** (ex: `getHealth.ts` exporte `getHealth`, `health.ts` exporte `health`). Pas de suffixe redondant avec le dossier (`routes/health.ts`, pas `routes/health.route.ts`).

**Points clés :**
- **Un dossier racine par module** — `framework/`, `authentication/`, `healthcheck/`
- **`framework/`** : tuyauterie technique, importable de partout, sans dépendance vers les modules métier
- **`model/`** : functional core d'un module — types, factories pures, **et ports (interfaces)** consommés par les use cases. **Aucun I/O.**
- **`commands/`** + **`queries/`** : imperative shell — use cases qui orchestrent I/O
- **`routes/`** : routes HTTP (Hono) du module, à la racine du module (pas sous `infrastructure/`)
- **`infrastructure/`** : adapters concrets non-HTTP (Prisma, crypto, scripts CLI, clients externes)
- **`public/`** : la **seule** porte d'entrée pour les autres modules — facade + ApiModels partagés

### 5.5 Règles de dépendances

**Règle cardinale (côté écriture) :** un module ne touche **jamais** les tables Prisma d'un autre module en écriture. Les opérations d'écriture cross-module passent par une fonction exposée dans le `public/` du module propriétaire (port métier, pas requête SQL).

**Règle souple (côté lecture) :** les queries peuvent être plus libres. Trois options par ordre de préférence :
1. La query vit dans le module propriétaire et est appelée via la facade `public/`
2. Le module consommateur a une fonction privée dans ses queries qui lit de manière ciblée — acceptable tant que c'est un read et qu'on ne reproduit pas l'anti-pattern "spaghetti SQL inter-modules"
3. Une query transverse exposée par un module dédié (ex: `rapport`) — plus tard quand le besoin émerge

Concrètement à l'init, **rien ne traverse les frontières de modules** sauf le module HTTP qui assemble tout. Mais la règle est figée pour les tickets suivants.

**Imports interdits par dependency-cruiser :**
- `@/<moduleA>/{model,commands,queries,routes,infrastructure}` depuis `<moduleB>` (sauf `framework` qui est libre)
- Import d'un fichier `<module>.module.ts` depuis un autre module (seul `framework/container/build-app-container.ts` y a droit)
- Import d'un module métier depuis `framework/` (le framework reste neutre)
- Import d'`infrastructure/`, `routes/`, `commands/` ou `queries/` depuis `model/` (le functional core reste pur)

```ts
// ❌ INTERDIT — import direct du modèle d'un autre module
import { Utilisateur } from '@/authentication/model/utilisateur'

// ✅ AUTORISÉ — import du public/
import type { UtilisateurApiModel } from '@/authentication/public/utilisateur.api-model'
import type { AuthenticationFacade } from '@/authentication/public/authentication.facade'
```

**Outillage obligatoire dès l'init :**
1. **`dependency-cruiser`** (run en CI) — applique les règles ci-dessus
2. **ESLint `no-restricted-syntax`** — interdit `export default` (sauf whitelist), interdit `new Date()` dans `model/`, `commands/`, `queries/` (force le `Clock`)
3. **Convention no-barrel** documentée dans CLAUDE.md (sauf `public/` qui peut exposer via des fichiers nommés explicites, jamais `index.ts`)

### 5.6 Published language : ApiModel

On n'a pas de Published Language au sens DDD (pas de BC à frontières strictes), mais on a un besoin réel : **partager des types entre `mb-api` et `pilote-mb-webapp`** pour profiter de l'inférence end-to-end.

La forme partagée s'appelle **`ApiModel`**. Convention :

- **`<Entity>ApiModel`** = la forme JSON exposée par les endpoints `/<entity>` de l'API
- Vit dans `<module>/public/<entity>.api-model.ts`
- Construite à partir d'un schéma Zod nommé via `.openapi('<Entity>ApiModel')` pour apparaître proprement dans le contrat OpenAPI
- Le type TS est dérivé : `export type UtilisateurApiModel = z.infer<typeof UtilisateurApiModelSchema>`
- Importable par n'importe quel module **et** par le webapp (via un package partagé ou par référence directe au repo selon le packaging final)

```ts
// src/authentication/public/utilisateur.api-model.ts
import { z } from '@hono/zod-openapi'

export const UtilisateurApiModelSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nomComplet: z.string(),
}).openapi('UtilisateurApiModel')

export type UtilisateurApiModel = z.infer<typeof UtilisateurApiModelSchema>
```

L'ApiModel est volontairement **pauvre** par rapport au modèle interne : pas de `statutAcces`, pas de `tokenVersion`, pas de `subProconnect` — concepts internes au module `authentication`, qui n'ont pas à fuiter dans l'API publique. Si un autre module a besoin d'une vue plus riche, il appelle la facade dédiée (cf. 5.7).

Différence vs DTO classique : un ApiModel **est** la représentation publique stable, on ne le mappe pas vers un autre type interne — il est lu directement en sortie de query, et écrit en entrée de command via Zod.

### 5.7 Facade module

Chaque module métier expose une **facade** dans son `public/` : une interface listant les opérations cross-module disponibles. Elle est résolvable via Awilix par les autres modules qui l'importent.

```ts
// src/authentication/public/authentication.facade.ts
import type { ResultAsync } from '@/framework/result'
import type { ApiKeyApiModel, UtilisateurApiModel } from '.'
import type { AuthError } from './errors'

export interface AuthenticationFacade {
  verifyApiKey(rawToken: string): ResultAsync<ApiKeyApiModel, AuthError>
  verifyJwt(rawJwt: string): ResultAsync<UtilisateurApiModel, AuthError>
  getUtilisateurParId(utilisateurId: string): ResultAsync<UtilisateurApiModel | null, AuthError>
}
```

L'implémentation vit dans `authentication/infrastructure/` (ou directement composée dans `authentication.module.ts` à partir des handlers existants — selon ce qui est plus lisible).

**Pour la lecture, deux options acceptables :**
1. La facade expose la query (`getUtilisateurParId`) — recommandé quand le consommateur la veut "telle quelle"
2. Le consommateur écrit sa propre query privée qui lit la table — toléré quand le besoin est très spécifique et le SQL clair, à condition de respecter la règle écriture (5.5)

À l'init, seul le cas (1) est mobilisé via le middleware d'auth qui consomme `authenticationFacade.verifyApiKey()` / `verifyJwt()`.

### 5.8 Modèles : types + factory functions, pas de classes

Les modèles métier sont des **types TS** + des **factory functions pures** qui valident et construisent. Aucune classe, aucun héritage, aucun mutateur d'état caché.

```ts
// src/authentication/model/api-key-id.ts
export type ApiKeyId = string & { readonly __brand: 'ApiKeyId' }

export const apiKeyId = (raw: string): Result<ApiKeyId, InvalidApiKeyIdError> => {
  if (!isUuid(raw)) return err(new InvalidApiKeyIdError(raw))
  return ok(raw as ApiKeyId)
}
```

```ts
// src/authentication/model/api-key.ts
export type ApiKey = {
  readonly id: ApiKeyId
  readonly nom: string
  readonly keyHash: string
  readonly keyPrefix: string
  readonly scopes: ReadonlyArray<Scope>
  readonly active: boolean
  readonly dateCreation: Date
}

export type CreateApiKeyParams = {
  nom: string
  scopes: Scope[]
  environment: 'live' | 'test'
  hasher: ApiKeyHasher
  tokenGenerator: TokenGenerator
  clock: Clock
}

export const createApiKey = (
  params: CreateApiKeyParams,
): Result<{ apiKey: ApiKey; rawToken: string }, CreateApiKeyError> => {
  if (params.nom.trim() === '') return err(new InvalidApiKeyNameError())
  if (params.scopes.length === 0) return err(new ApiKeyScopesRequiredError())

  const prefix = params.environment === 'live' ? 'pmb_live_' : 'pmb_test_'
  const rawToken = params.tokenGenerator.generate(prefix)
  const keyHash = params.hasher.hash(rawToken)
  const keyPrefix = rawToken.slice(0, 12)

  const apiKey: ApiKey = {
    id: ApiKeyId.generate(),
    nom: params.nom,
    keyHash,
    keyPrefix,
    scopes: params.scopes,
    active: true,
    dateCreation: params.clock.now(),
  }
  return ok({ apiKey, rawToken })
}

export const revokeApiKey = (apiKey: ApiKey): Result<ApiKey, ApiKeyAlreadyRevokedError> => {
  if (!apiKey.active) return err(new ApiKeyAlreadyRevokedError())
  return ok({ ...apiKey, active: false })
}
```

**Conséquences :**
- Les transitions sont des fonctions pures (`(state, params) => Result<state', error>`)
- Les modèles sont **immuables** par construction (`readonly`, on retourne un nouvel objet à chaque transition)
- Sérialisation triviale (objet JSON pur), partage front/back natif
- Tests unitaires sans mock ni DB — on appelle la factory, on assert sur le retour

**Branded types** pour les IDs et VOs courts (Email, Scope) : sécurité de typage sans le coût d'une classe. Une fonction `parseEmail(raw): Result<Email, …>` valide à la frontière, ensuite on travaille sur le type `Email`.

**Pas de Domain Events** à l'init. Si on a un jour besoin de réagir à des transitions (audit, notification), on le fait par :
- Logging structuré dans le use case (pour l'audit lisible)
- Appel explicite à un autre module via sa facade
- Mécanisme dédié quand un cas concret apparaît (probablement pas un event bus interne)

### 5.9 Repositories : ports & adapters côté écriture

Pour respecter la contrainte 5.5, **toutes les écritures DB d'un module passent par un port repository**. Le port (interface) vit dans `model/` du module. L'adapter Prisma vit dans `infrastructure/persistence/`.

```ts
// src/authentication/model/apiKeyRepository.ts
export interface ApiKeyRepository {
  save(apiKey: ApiKey): ResultAsync<void, RepositoryError>
  findByKeyHash(keyHash: string): ResultAsync<ApiKey | null, RepositoryError>
  findById(id: ApiKeyId): ResultAsync<ApiKey | null, RepositoryError>
}
```

```ts
// src/authentication/infrastructure/persistence/api-key.prisma-repository.ts
export class ApiKeyPrismaRepository implements ApiKeyRepository {
  constructor(private readonly deps: Inject<'prisma'>) {}

  save(apiKey: ApiKey): ResultAsync<void, RepositoryError> {
    const data = apiKeyToPersistence(apiKey)
    return ResultAsync.fromPromise(
      this.deps.prisma.getInstance().api_key.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      }).then(() => undefined),
      (cause) => new RepositoryError('save api_key failed', { cause }),
    )
  }

  findByKeyHash(keyHash: string): ResultAsync<ApiKey | null, RepositoryError> {
    return ResultAsync.fromPromise(
      this.deps.prisma.getInstance().api_key.findUnique({ where: { key_hash: keyHash } }),
      (cause) => new RepositoryError('findByKeyHash failed', { cause }),
    ).map((row) => row ? apiKeyFromPersistence(row) : null)
  }
}
```

Les **mappers** sont des fonctions pures (`toPersistence(model)`, `fromPersistence(row)`) — pas de classe.

### 5.10 Use cases : commands et queries

#### Commands (écriture)

Une command est une **classe handler** instanciée par Awilix avec ses dépendances. Le métier est dans son `executer()` qui retourne un `ResultAsync<T, E>`. Le code privilégie le **railway oriented programming** (`andThen`, `map`, `mapErr`) plutôt qu'un labyrinthe de `if (result.isErr)`.

```ts
// src/authentication/commands/create-session/create-session.handler.ts
export class CreateSessionHandler {
  constructor(
    private readonly deps: Inject<
      'utilisateurRepository' | 'tokenSigner' | 'transaction' | 'logger' | 'clock'
    >,
  ) {}

  executer(command: CreateSessionCommand): ResultAsync<Session, CreateSessionError> {
    if (!command.idToken) return errAsync(new MissingIdTokenError())
    return errAsync(new NotImplementedError('ProConnect — voir ticket suivant'))
    // À l'arrivée du ticket ProConnect :
    // return validateIdToken(command.idToken, this.deps.proconnectClient)
    //   .andThen((claims) => upsertUtilisateur(claims, this.deps.utilisateurRepository, this.deps.clock))
    //   .andThen((utilisateur) => signSession(utilisateur, this.deps.tokenSigner, this.deps.clock))
  }
}
```

Throws réservés aux erreurs **techniques inattendues** (DB down, config invalide). Tout le métier passe par `Result`/`ResultAsync`.

#### Queries (lecture)

Même forme (`*.handler.ts` avec `executer()`), retournent généralement directement la donnée ou un `Result` selon la richesse d'erreurs métier (souvent un simple `Promise<T | null>` suffit pour une query ; `ResultAsync` quand on veut typer les erreurs de validation/permission).

```ts
// src/authentication/queries/verify-api-key/verify-api-key.handler.ts
export class VerifyApiKeyHandler {
  constructor(private readonly deps: Inject<'apiKeyRepository' | 'apiKeyHasher' | 'clock'>) {}

  executer(rawToken: string): ResultAsync<ApiKey | null, VerifyApiKeyError> {
    const keyHash = this.deps.apiKeyHasher.hash(rawToken)
    return this.deps.apiKeyRepository.findByKeyHash(keyHash)
      .map((apiKey) => apiKey?.active ? apiKey : null)
  }
}
```

Une query peut aussi être une **fonction pure exportée** (pas de classe) si elle n'a pas besoin d'état d'instance — c'est OK tant que la DI passe les deps à l'appel. À l'init, on garde la forme classe pour cohérence avec les commands.

### 5.11 Pas d'AggregateRoot, pas de Domain Events

À l'init, **aucun events** ni **AggregateRoot**. Les "root entities" (`ApiKey`, `Utilisateur`) sont des types — on les traite **comme des agrégats côté repository** (un repo par root entity, le repo charge/sauve l'objet entier) sans hériter d'une base class ni publier d'events.

Si plus tard un cas nécessite events ou invariants complexes, on l'introduira sur **le modèle concerné**, pas comme primitive globale.

### 5.12 Domain services / fonctions transverses

Pas de "Domain Service" formalisé. Les calculs transverses (ex: agrégation de plusieurs indicateurs pour une collection, à venir dans `pilotage`) seront des **fonctions pures** dans `model/` (ou un sous-dossier `model/services/` si la lisibilité l'exige).

À l'init : zéro fonction transverse — on a uniquement `createApiKey`, `revokeApiKey`, `parseEmail` et factories utilisateur stubées.

### 5.13 Clock injectable

Tous les timestamps passent par un port `Clock` injecté, jamais `new Date()` direct dans `model/`, `commands/`, `queries/`. Permet :
- Tests déterministes via `FakeClock`
- Centralisation du format temporel (passage à Luxon facilité — cf. 6.5)

```ts
// src/framework/clock/clock.ts
export interface Clock { now(): Date }
```

Règle ESLint : interdit `new Date()` dans `model/`, `commands/`, `queries/`.

---

## 6. Patterns fondamentaux

### 6.1 Dependency Injection — module-system Awilix (copié/adapté de pilote-ppg)

mb-api reprend le **module-system** mis en place sur pilote-ppg. Trois bénéfices :
- **Découpage par module** : chaque module Awilix correspond à un module applicatif et déclare son propre cradle typé
- **Graphe de dépendances explicite** via `imports` / `exports` — seules les facades des `exports` fuient
- **Typage fort** via `Inject<K>` — chaque classe déclare précisément les dépendances qu'elle consomme

> **Note terminologique :** un module applicatif = un module Awilix `defineModule`. Ce n'est **pas** un bounded context DDD. Le module `framework` est l'exception : c'est de la tech transverse, pas un domaine.

#### Structure du framework

Le framework vit dans `src/framework/module-system/` :
- `define-module.ts` — factory curryfiée `defineModule<TExports, TCradle>()({...})`
- `boot-modules.ts` — orchestrateur en 2 phases :
  - Phase 1 : container racine pour `framework` (sans imports), puis un scope par autre module
  - Phase 2 : résout eagerly les exports de chaque module et les ré-enregistre comme `asValue` dans le container consommateur (évite les boucles de résolution Awilix)
- `module-names.ts` — liste canonique typée

Adaptations vs pilote-ppg :
- Renommage en **camelCase / anglais** (sauf entités métier) pour respecter la convention de pilote-mb
- `PROXY` + `strict: true` sur le container racine (identique)

#### Module `framework` (racine, infra technique transverse)

```ts
// src/framework/framework.module.ts
type FrameworkCradle = {
  prisma: PrismaPilote
  transaction: Transaction
  logger: Logger
  config: Config
  clock: Clock
  authContext: AuthContext
}

export const frameworkModule = defineModule<NoExports, FrameworkCradle>()({
  name: 'framework',
  imports: [],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      prisma:       asModuleFunction(() => new PrismaPilote()).singleton(),
      transaction:  asModuleFunction(() => new PrismaTransaction()).singleton(),
      logger:       asModuleFunction(() => buildLogger(config)).singleton(),
      config:       asModuleFunction(() => config).singleton(),
      clock:        asModuleClass(SystemClock).singleton(),
      authContext:  asModuleClass(AsyncLocalStorageAuthContext).singleton(),
    } satisfies VerifyCradle<FrameworkCradle>)
  },
})
```

`framework` remplace l'ancien découpage `shared` + `platform` en un seul module. Les services liés à un module métier (ex: `TokenSigner`, `ApiKeyHasher`) vivent dans le cradle de leur module (`authentication`).

#### Module métier consommateur

```ts
// src/authentication/authentication.module.ts
type AuthenticationCradle = {
  apiKeyHasher: ApiKeyHasher
  tokenGenerator: TokenGenerator
  tokenSigner: TokenSigner
  apiKeyRepository: ApiKeyRepository
  utilisateurRepository: UtilisateurRepository
  verifyApiKeyHandler: VerifyApiKeyHandler
  verifyJwtHandler: VerifyJwtHandler
  createSessionHandler: CreateSessionHandler
  authenticationFacade: AuthenticationFacade
}

type AuthenticationExports = {
  authenticationFacade: AuthenticationFacade
}

export const authenticationModule = defineModule<AuthenticationExports, AuthenticationCradle>()({
  name: 'authentication',
  imports: ['framework'],
  exports: ['authenticationFacade'],
  register: (container, { asModuleClass }) => {
    container.register({
      apiKeyHasher:          asModuleClass(Sha256ApiKeyHasher).singleton(),
      tokenGenerator:        asModuleClass(CryptoTokenGenerator).singleton(),
      tokenSigner:           asModuleClass(JsonwebtokenTokenSigner).singleton(),
      apiKeyRepository:      asModuleClass(ApiKeyPrismaRepository).singleton(),
      utilisateurRepository: asModuleClass(UtilisateurPrismaRepository).singleton(),
      verifyApiKeyHandler:   asModuleClass(VerifyApiKeyHandler).singleton(),
      verifyJwtHandler:      asModuleClass(VerifyJwtHandler).singleton(),
      createSessionHandler:  asModuleClass(CreateSessionHandler).singleton(),
      authenticationFacade:  asModuleClass(AuthenticationFacadeImpl).singleton(),
    } satisfies VerifyCradle<AuthenticationCradle>)
  },
})

type Scope = ExtractScope<typeof authenticationModule>
export type Inject<K extends keyof Scope> = Pick<Scope, K>
```

#### Bootstrap

```ts
// src/framework/container/build-app-container.ts
export function buildAppContainer() {
  return bootModules([
    frameworkModule,
    authenticationModule,
    healthcheckModule,
  ])
}
```

#### Liste des modules de l'init

```ts
// src/framework/module-system/module-names.ts
export const moduleNames = [
  'framework',
  'authentication',
  'healthcheck',
] as const

export type ModuleName = (typeof moduleNames)[number]
```

#### Convention de vie des dépendances

- **Tout en singleton** — les transactions et l'auth context passent par `AsyncLocalStorage`, pas par des scopes Awilix par requête
- **Mode Proxy Injection** — un seul argument objet dans le constructeur, déstructuré via `Inject<K>`

### 6.2 Transactions — AsyncLocalStorage via `PrismaPilote` injecté

Pattern repris de pilote-ppg : un `AsyncLocalStorage<PilotePrismaClient>` porte la transaction courante à travers la chaîne async, et un wrapper `PrismaPilote` injecté résout "tx courante OR client racine". Les repositories ne touchent jamais à `PrismaClient` ni à `getPrisma()` directement.

```ts
// src/framework/persistence/prisma/prisma-transaction.ts
export type PilotePrismaClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
export const txStore = new AsyncLocalStorage<PilotePrismaClient>()

export class PrismaTransaction implements Transaction {
  async run<T>(scope: () => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => txStore.run(tx, scope))
  }
}
```

```ts
// src/framework/persistence/prisma/prisma-pilote.ts
export class PrismaPilote {
  private instance: PrismaClient | null = null

  getInstance(): PilotePrismaClient {
    if (!this.instance) this.instance = new PrismaClient()
    return txStore.getStore() ?? this.instance
  }
}
```

Un handler qui veut une transaction injecte `Transaction` et appelle `transaction.run(async () => { ... })`. Toute la chaîne async dans le callback hérite automatiquement de la tx via l'ALS — les repos appellent `prisma.getInstance()` et obtiennent la tx sans le savoir.

### 6.3 Auth context — AsyncLocalStorage

Le pattern transaction est généralisé à l'**identité authentifiée**. Un middleware Hono pose l'identité dans un `AuthContext` (ALS), puis n'importe quel use case en aval peut appeler `requireUser()` ou `requireApiKey()` sans que l'identité circule comme paramètre explicite.

**Compatibilité Hono** : Hono est un framework Node.js (et bun/deno), `AsyncLocalStorage` est natif Node 18+. Le `c.set('auth', ...)` Hono est utile pour les middlewares qui veulent un accès local, mais pour propager l'identité **profondément** dans la pile async (handlers, repos pour audit, services), un `AsyncLocalStorage` est strictement supérieur — pas de prop drilling, pas de couplage à `Context` Hono dans le métier. Pattern validé sur Express/Fastify, fonctionne identiquement avec Hono.

```ts
// src/framework/auth-context/auth-context.ts
export type Auth =
  | { kind: 'api-key'; apiKey: ApiKeyApiModel }
  | { kind: 'user'; utilisateur: UtilisateurApiModel }

const authStore = new AsyncLocalStorage<Auth>()

export interface AuthContext {
  run<T>(auth: Auth, scope: () => Promise<T>): Promise<T>
  current(): Auth | undefined
}

export class AsyncLocalStorageAuthContext implements AuthContext {
  run<T>(auth: Auth, scope: () => Promise<T>): Promise<T> {
    return authStore.run(auth, scope)
  }
  current(): Auth | undefined {
    return authStore.getStore()
  }
}
```

```ts
// src/framework/auth-context/current-auth.ts
export const currentAuth = (): Auth | undefined => authStore.getStore()

export const requireUser = (): UtilisateurApiModel => {
  const auth = currentAuth()
  if (auth?.kind !== 'user') throw new UnauthenticatedError('user required')
  return auth.utilisateur
}

export const requireApiKey = (): ApiKeyApiModel => {
  const auth = currentAuth()
  if (auth?.kind !== 'api-key') throw new UnauthenticatedError('api-key required')
  return auth.apiKey
}
```

**Middleware HTTP qui alimente l'ALS :**

```ts
// src/framework/http/middlewares/auth-context.middleware.ts
export function authContextMiddleware(deps: { authContext: AuthContext }) {
  return async (context: Context, next: Next) => {
    const auth = context.get('auth') as Auth | undefined
    if (!auth) return next()
    await deps.authContext.run(auth, () => next())
  }
}
```

`UnauthenticatedError`/`ForbiddenError` sont des `AppError` — catchées par le middleware d'erreur global qui répond 401/403. Aucune gymnastique dans les use cases : `requireUser()` lance, le système répond proprement.

**Trade-off vs `c.get('auth')` Hono uniquement :** l'ALS coûte un peu plus en mémoire (stockage par chaîne async). Bénéfice : on découpe le métier de Hono (le métier ne connaît pas `Context`). On garde aussi le `c.set('auth')` pour les middlewares qui restent dans la couche HTTP.

### 6.4 Result type — neverthrow + ResultAsync (railway oriented)

Les handlers ne throw pas pour les erreurs métier — ils retournent `Result` ou `ResultAsync`. Le code privilégie le chaînage railway (`andThen`, `map`, `mapErr`, `orElse`) plutôt que des arbres `if (result.isErr)`.

```ts
// Mauvais : isErr partout
const apiKeyResult = await this.deps.apiKeyRepository.findByKeyHash(hash)
if (apiKeyResult.isErr()) return err(apiKeyResult.error)
const apiKey = apiKeyResult.value
if (!apiKey) return err(new NotFoundError())
if (!apiKey.active) return err(new RevokedError())
return ok(apiKey)

// Bon : railway
return this.deps.apiKeyRepository
  .findByKeyHash(hash)
  .andThen((apiKey) => apiKey ? ok(apiKey) : err(new NotFoundError()))
  .andThen((apiKey) => apiKey.active ? ok(apiKey) : err(new RevokedError()))
```

Throws réservés aux **erreurs techniques inattendues** (DB down, config invalide, port HTTP indisponible). Ils remontent au middleware d'erreur global (cf. section 16) qui loggue et répond 500.

`UnauthenticatedError` et `ForbiddenError` levées par `requireUser()` font exception : elles sont throwées délibérément (pour permettre l'API ergonomique de `requireUser()`) et catchées par le middleware d'erreur. C'est un cas isolé, documenté.

Re-export centralisé :
```ts
// src/framework/result/index.ts
export { ok, err, okAsync, errAsync, Result, ResultAsync, type Err, type Ok } from 'neverthrow'
```

### 6.5 Logger — sinks composables

Port `Logger` dans `framework/logging/logger.ts`, implémenté par `CompositeLogger` qui dispatch vers N sinks.

```ts
// src/framework/logging/logger.ts
export interface Logger {
  info(context: Record<string, unknown>, message: string): void
  warn(context: Record<string, unknown>, message: string): void
  error(context: Record<string, unknown>, message: string): void
  debug(context: Record<string, unknown>, message: string): void
}
```

```ts
// src/framework/logging/composite-logger.ts
export class CompositeLogger implements Logger {
  constructor(private readonly sinks: LogSink[]) {}
  info(context, message)  { this.emit('info',  context, message) }
  warn(context, message)  { this.emit('warn',  context, message) }
  error(context, message) { this.emit('error', context, message) }
  debug(context, message) { this.emit('debug', context, message) }
  private emit(level, context, message) {
    const entry = { level, timestamp: new Date(), message, context }
    for (const sink of this.sinks) sink.write(entry)
  }
}
```

**Sinks initiaux :**
- `PinoStdoutSink` — pino vers stdout (JSON en prod, pretty en dev)
- `DatabaseSink` — insert dans `application_log`, best-effort (jamais crash)

**Wiring** : factory `buildLogger(config)` qui compose les sinks selon `config.LOG_TO_DATABASE`.

**Évolution future** : ajouter un sink APM/HTTP = nouvelle ligne dans `buildLogger`. Zéro refacto métier.

### 6.6 Dates — Date natif à l'init, Luxon en option différée

À l'init, `Clock.now()` retourne une `Date` native. Cela suffit pour les besoins actuels (timestamps DB, JWT iat/exp, dates de création/révocation API keys).

**Luxon** sera introduit dès qu'un module manipule sérieusement des dates (formats FR, périodes, timezones, calculs de jalons) — probablement `pilotage` ou `rapport`. Deux options à ce moment :
1. **Luxon en complément** — `Clock` reste sur `Date`, on convertit en `DateTime` aux endroits ciblés
2. **Migration `Clock`** — `Clock.now(): DateTime`, on assume Luxon partout

Le choix se prendra dans le ticket concerné. Le port `Clock` sert de point de bascule unique. La règle ESLint qui interdit `new Date()` reste en place et capture `DateTime.now()` si on bascule.

### 6.7 Config — Zod validée au boot

```ts
// src/config.ts
const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_TO_DATABASE: z.coerce.boolean().default(true),
  JWT_SECRET: z.string().min(32),
  JWT_TTL_HOURS: z.coerce.number().int().positive().default(8),
  // Prévus pour le ticket ProConnect :
  PROCONNECT_ISSUER_URL: z.string().url().optional(),
  PROCONNECT_CLIENT_ID: z.string().optional(),
  PROCONNECT_CLIENT_SECRET: z.string().optional(),
  PROCONNECT_REDIRECT_URI: z.string().url().optional(),
})

export const config = ConfigSchema.parse(process.env)
export type Config = typeof config
```

Crash dur au démarrage si variable manquante ou invalide.

### 6.8 Pattern d'injection `Inject<K>`

Chaque module expose un alias `Inject<K>` typé construit depuis son `ExtractScope`. Les classes consomment uniquement les clés dont elles ont besoin — précisément typées.

```ts
// Dans authentication.module.ts
type Scope = ExtractScope<typeof authenticationModule>
export type Inject<K extends keyof Scope> = Pick<Scope, K>
```

**Usage :**
```ts
export class CreateSessionHandler {
  constructor(
    private readonly deps: Inject<'utilisateurRepository' | 'tokenSigner' | 'transaction' | 'logger'>,
  ) {}
}
```

**Règles à figer :**
- Toute classe instanciée par Awilix (`asModuleClass`) déclare ses deps via `Inject<K>`, jamais via un type ad-hoc
- Une classe ne peut consommer que des clés de son propre scope (ses `imports` + son cradle)
- **Pas d'abus** : `Inject<'a' | 'b' | 'c' | 'd' | 'e' | 'f'>` signale qu'une classe fait trop — à découper

---

## 7. Conventions de code

### 7.1 Nommage
- **Verbes et termes techniques en anglais**, noms d'**entités métier en français**
- Exemples :
  - ✅ `getIndicateurById`, `createEntity`, `saveChantier`, `listIndicateursByEntity`
  - ✅ `CreateEntityHandler`, `GetUtilisateurByIdHandler`
  - ❌ `recupererIndicateurParId` (style pilote-ppg, pas pilote-mb)

### 7.2 Exports
- **Pas d'`export default`** — que des exports nommés, sauf obligation tierce (`vite.config.ts`, etc.)
- **Pas de barrel files** (fichiers `index.ts` qui re-exportent) — sauf point d'entrée obligatoire d'une lib publiée

### 7.3 Commentaires
- Pas de commentaire inutile — bons noms > commentaires
- Dans les tests : **Given / When / Then** comme commentaires de structure uniquement, plus des commentaires spécifiques lorsque c'est nécessaire pour marquer une donnée de test essentielle
- Les ADR sont écrits en **français**

### 7.4 Variables et types
- Pas de variables à 1 ou 2 caractères (`error` et non `e`, `event` et non `ev`)
- Préférer `$Enums` de Prisma pour les enums DB
- `expect(result).toEqual([{...}])` plutôt que `toHaveLength + index access`

### 7.5 Modèles
- **Pas de classes** pour les modèles métier — types + factory functions pures
- **Branded types** pour les identifiants et VOs simples (`type ApiKeyId = string & { __brand: 'ApiKeyId' }`)
- Validation à la frontière via `parseEmail`, `apiKeyId`, etc., qui retournent `Result`
- Immutabilité par `readonly` ; transitions = `(state, params) => Result<state', error>`

---

## 8. API design — règles "agent-ready"

L'API sera consommée par un **agent IA satellite** (et plus tard par le webapp). Chaque endpoint = "tool potentiel" pour un LLM.

### 8.1 Règles non-négociables

1. **Atomicité** — un endpoint, une responsabilité.
2. **Descriptions riches** — `.describe()` obligatoire sur chaque champ Zod. `summary` + `description` ≥ 1 phrase obligatoires sur chaque route.
3. **Outputs structurés** — JSON plat, pas de string multilignes, pas de HATEOAS.
4. **Filtres combinables** — un endpoint de listing, plusieurs filtres combinables.
5. **Convention REST stricte** :
   ```
   GET    /entities              # list
   GET    /entities/{id}         # get one
   POST   /entities              # create
   PATCH  /entities/{id}         # update partial
   DELETE /entities/{id}         # delete
   GET    /entities/{id}/indicateurs
   GET    /entities/recherche    # queries spécifiques si vraiment besoin
   ```
6. **Erreurs structurées** — `ErrorSchema { code: string, message: string, details?: unknown }`. `code` = enum stable (ex: `ENTITY_NOT_FOUND`). `message` en français pour UI humaine.
7. **Idempotence** — `PUT` plutôt que `POST /…/duplicate`. Header `Idempotency-Key` plus tard.
8. **Pas d'`_output_instructions`** — l'agent satellite gère ses propres instructions côté lui.

### 8.2 Organisation OpenAPI
- **1 tag = 1 entité** (`Entity`, `Indicateur`, `Territoire`, `Health`, `Authentication`…)
- **Schémas ApiModel** dans `<module>/public/<entity>.api-model.ts` — nommés via `.openapi('<Entity>ApiModel')`
- Schémas locaux aux routes pour les inputs/outputs spécifiques (ex: `CreateEntityInput`)
- `/api/openapi.json` et `/api/docs` **accessibles en prod aussi** (objectif produit)

### 8.3 Pattern d'une route

```ts
// src/authentication/routes/createSession.ts
const CreateSessionInputSchema = z.object({
  id_token: z.string().describe("id_token OIDC émis par ProConnect"),
}).openapi('CreateSessionInput')

const SessionApiModelSchema = z.object({
  jwt: z.string(),
  utilisateur: UtilisateurApiModelSchema,
}).openapi('SessionApiModel')

const createSessionRoute = createRoute({
  method: 'post',
  path: '/auth/sessions',
  tags: ['Authentication'],
  summary: "Échange un id_token ProConnect contre un JWT interne",
  description: "Valide la signature de l'id_token via JWKS ProConnect, upsert l'utilisateur, et retourne un JWT interne HS256.",
  request: { body: { content: { 'application/json': { schema: CreateSessionInputSchema } } } },
  responses: {
    201: { description: 'Session créée', content: { 'application/json': { schema: SessionApiModelSchema } } },
    400: { description: 'id_token invalide', content: { 'application/json': { schema: ErrorSchema } } },
    501: { description: 'Non implémenté (scaffolding)', content: { 'application/json': { schema: ErrorSchema } } },
  },
})

export function registerCreateSessionRoute(app: OpenAPIHono, container: AwilixContainer) {
  app.openapi(createSessionRoute, async (context) => {
    const body = context.req.valid('json')
    const handler = container.resolve<CreateSessionHandler>('createSessionHandler')
    const result = await handler.executer({ idToken: body.id_token })

    return respondWithResult(context, result, (session) =>
      context.json(sessionToApiModel(session), 201),
    )
  })
}
```

Pour le scaffolding, le handler retourne `errAsync(new NotImplementedError(...))` (kind `'not-implemented'` → 501 via la table de mapping HTTP).

---

## 9. Authentification

### 9.1 Deux stratégies parallèles, middleware unifié

Un seul middleware `auth.middleware.ts` détecte le format du Bearer token et délègue à la bonne stratégie :
- Token préfixé `pmb_live_` ou `pmb_test_` → **API Key**. Le préfixe est purement informatif (identifie l'environnement). Le middleware traite les deux strictement pareil — **aucune vérification de cohérence préfixe / NODE_ENV** (un même token peut être utilisé pour tester prod en bouchon local).
- Token JWT (3 segments séparés par `.`) → **session user**

Le middleware :
1. Pose `c.set('auth', { kind: 'api-key', apiKey })` ou `{ kind: 'user', utilisateur }`
2. Le middleware suivant (`authContextMiddleware`) lit `c.get('auth')` et alimente l'ALS — les use cases en aval peuvent appeler `requireUser()` ou `requireApiKey()`

### 9.2 API Keys (impl complète dans ce ticket)

**Convention du préfixe :**
- `pmb_live_*` — production
- `pmb_test_*` — dev, staging, test, CI

Le préfixe est purement informatif. Le CLI `create-api-key` prend `--env live|test`.

**Choix du hash : SHA-256, pas bcrypt**

Les API keys sont **hashées avec SHA-256 déterministe**. Raison :
- bcrypt est non-déterministe (salt unique par hash) → impossible de faire `WHERE key_hash = X`. Il faudrait un `findMany` + `bcrypt.compare` sur chaque row : inacceptable en perf.
- Les API keys ont une **haute entropie** (256 bits via `crypto.randomBytes`) → SHA-256 sans salt est suffisamment sécurisé.
- Lookup `WHERE key_hash = sha256(token)` + index B-tree = O(1).

bcrypt serait pertinent pour des passwords (faible entropie) ; on n'en a pas (auth users = ProConnect).

**Table Prisma :**
```prisma
model api_key {
  id                        String    @id @default(uuid())
  nom                       String
  key_hash                  String    @unique
  key_prefix                String
  scopes                    String[]
  active                    Boolean   @default(true)
  date_creation             DateTime  @default(now())
  date_derniere_utilisation DateTime?
}
```

**Ports dans `authentication/model/` :**
```ts
export interface ApiKeyHasher {
  hash(token: string): string
}

export interface TokenGenerator {
  generate(prefix: 'pmb_live_' | 'pmb_test_'): string
}
```

**Adapters dans `authentication/infrastructure/crypto/` :**
```ts
export class Sha256ApiKeyHasher implements ApiKeyHasher {
  hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}

export class CryptoTokenGenerator implements TokenGenerator {
  generate(prefix: 'pmb_live_' | 'pmb_test_'): string {
    return `${prefix}${crypto.randomBytes(32).toString('hex')}`
  }
}
```

**Modèle `ApiKey` dans `authentication/model/api-key.ts` :** voir 5.8 (factory `createApiKey`, transition `revokeApiKey`).

**Flow de vérification (middleware auth) :**
1. Le client envoie `Authorization: Bearer pmb_live_xxxxxxxx...`
2. Le middleware appelle `authenticationFacade.verifyApiKey(token)` qui délègue à `VerifyApiKeyHandler`
3. Le handler hash le token, lookup via `ApiKeyRepository.findByKeyHash()`, vérifie `active`, retourne un `ApiKeyApiModel` ou null
4. Le middleware pose `c.set('auth', { kind: 'api-key', apiKey })` (ou répond 401 via `app.onError`)

**Création via CLI :**
```bash
pnpm create-api-key --nom "agent-satellite-prod" --env live --scopes "entities:read,indicateurs:read"
# Le script :
#   1. Résout authenticationModule + frameworkModule via buildAppContainer()
#   2. Appelle createApiKey(...) avec les deps injectées
#   3. Appelle apiKeyRepository.save(apiKey)
#   4. Affiche rawToken UNE SEULE FOIS en stdout
```

### 9.3 Authentification user — ProConnect (scaffolding seul)

**Décision stratégique** : pas de login intégré (pas de table password, pas de `POST /auth/login`). L'authentification user passe exclusivement par **ProConnect**. Le backend valide les id_token émis par ProConnect et ré-émet son propre JWT interne.

**Pourquoi ré-émettre un JWT interne ?**
- Notre JWT porte **nos rôles + notre `statut_acces`** — concepts applicatifs que ProConnect ne connaît pas
- Révocation côté backend (via `token_version`)
- Performance : pas d'appel ProConnect à chaque requête (JWKS cached)

**Flow complet (à implémenter dans le ticket ProConnect) :**
```
1. User clique "Se connecter avec ProConnect"
2. Webapp redirige vers ProConnect (OAuth Authorization Code Flow + PKCE)
3. ProConnect authentifie, redirige vers webapp avec ?code=xxx
4. Webapp échange le code contre un id_token
5. Webapp → POST /auth/sessions { id_token }
6. mb-api :
   a. Valide signature id_token via JWKS ProConnect (cached)
   b. Extrait sub, email, given_name, family_name
   c. Upsert utilisateur (clé : sub_proconnect)
      - si nouveau : statut_acces = 'EN_ATTENTE_ACCES'
   d. Émet un JWT interne HS256 (utilisateur_id, statut_acces, roles, token_version)
   e. Retourne { jwt, utilisateur }
```

**Page "Demander l'accès"** : un user `EN_ATTENTE_ACCES` reçoit un JWT mais les routes métier sont bloquées par un middleware de statut. Le front route vers une page de justification. Un admin approuve via `PATCH /auth/utilisateurs/{id}/acces`.

**Table Prisma :**
```prisma
model utilisateur {
  id                      String            @id @default(uuid())
  sub_proconnect          String            @unique
  email                   String            @unique
  nom                     String
  prenom                  String
  statut_acces            statut_acces_enum @default(EN_ATTENTE_ACCES)
  roles                   String[]
  token_version           Int               @default(1)
  date_creation           DateTime          @default(now())
  date_derniere_connexion DateTime?
}

enum statut_acces_enum {
  EN_ATTENTE_ACCES
  ACTIF
  REFUSE
  DESACTIVE
}
```

**Livré dans ce ticket (scaffolding) :**
- Table `utilisateur` + enum
- Modèle `Utilisateur` (type + factory + transitions stubées)
- `UtilisateurPrismaRepository`
- Port `TokenSigner` + adapter `JsonwebtokenTokenSigner` (vérif/émission JWT **fonctionnels**, testés)
- Middleware `auth.middleware.ts` avec dispatch API Key / JWT (la branche JWT valide signature, résout l'utilisateur via repository — testée avec tokens signés manuellement)
- `CreateSessionHandler` avec structure complète, `executer()` retourne `errAsync(new NotImplementedError(...))`
- Route `POST /auth/sessions` retourne 501 avec message clair pointant le ticket suivant

**Hors scope (ticket suivant) :**
- Intégration `openid-client` + JWKS ProConnect
- Upsert utilisateur depuis claims
- `GET /auth/me`, `POST /auth/acces/demande`, `PATCH /auth/utilisateurs/{id}/acces`
- Middleware de blocage `EN_ATTENTE_ACCES`
- Page "Demander l'accès" côté webapp

### 9.4 Routes publiques (exemptées d'auth)
- `GET /health`
- `GET /api/openapi.json`
- `GET /api/docs`

---

## 10. Tests

### 10.1 Pyramide explicite

| Couche | Type de test | Outils |
|---|---|---|
| `model/` (functional core) | **Unit** purs (pas de DB, pas de mock) | Vitest |
| `commands/` + `queries/` (use cases) | **Intégration** (vraie DB via `withTestTransaction`) | Vitest + Prisma + container |
| Repositories Prisma | **Intégration** (côté implicite via use cases ; tests directs si logique non triviale) | Vitest + Prisma |
| Routes HTTP | **Intégration** (Hono `app.request()` end-to-end) | Vitest + Hono test client |

Pas de séparation artificielle unit vs integration : un test qui hit la DB est OK tant qu'il est dans `withTestTransaction`. La discrimination utile est **pure vs avec I/O**.

### 10.2 Configuration Vitest

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    sequence: { concurrent: true },
    pool: 'threads',
    poolOptions: { threads: { maxThreads: 10 } },
    testTimeout: 30_000,
    setupFiles: ['src/test/vitest.setup.ts'],
  },
})
```

### 10.3 withTestTransaction

Le helper initialise le container applicatif via `buildAppContainer()` (singleton partagé), ouvre une transaction Prisma, pose la tx dans le `txStore` ALS, exécute le test, force un rollback.

```ts
// src/test/with-test-transaction.ts
import { buildAppContainer } from '@/framework/container/build-app-container'
import { txStore } from '@/framework/persistence/prisma/prisma-transaction'
import { PrismaPilote } from '@/framework/persistence/prisma/prisma-pilote'
import { TestContext } from './test-context'

class RollbackSignal extends Error {}

let cachedContainer: ReturnType<typeof buildAppContainer> | null = null
function getTestContainer() {
  if (!cachedContainer) cachedContainer = buildAppContainer()
  return cachedContainer
}

export function withTestTransaction(
  runTest: (testContext: TestContext) => Promise<void>,
): () => Promise<void> {
  return async () => {
    const { getContainer } = getTestContainer()
    const frameworkContainer = getContainer('framework')
    const prismaPilote = frameworkContainer.resolve<PrismaPilote>('prisma')
    const prismaClient = prismaPilote.getInstance()

    try {
      await prismaClient.$transaction(async (tx) => {
        await txStore.run(tx, async () => {
          const testContext = new TestContext(getContainer)
          await runTest(testContext)
          throw new RollbackSignal()
        })
      })
    } catch (error) {
      if (!(error instanceof RollbackSignal)) throw error
    }
  }
}
```

### 10.4 Tests du functional core (unit purs)

```ts
// src/authentication/model/api-key.test.ts
describe('createApiKey', () => {
  it('refuse un nom vide', () => {
    // Given
    const params = makeParams({ nom: '   ' })
    // When
    const result = createApiKey(params)
    // Then
    expect(result.isErr()).toBe(true)
    expect(result.error).toBeInstanceOf(InvalidApiKeyNameError)
  })

  it('génère un token préfixé selon environment', () => {
    // Given
    const params = makeParams({ environment: 'live' })
    // When
    const result = createApiKey(params)
    // Then
    expect(result.value.rawToken).toMatch(/^pmb_live_/)
  })
})
```

Pas de container, pas de DB, pas de mock — `makeParams()` retourne directement les ports stubbés (`hasher`, `tokenGenerator`, `clock`).

### 10.5 Tests use cases (intégration)

```ts
// src/authentication/queries/verify-api-key/verify-api-key.handler.test.ts
describe('VerifyApiKeyHandler', () => {
  it('retourne null si la clé est révoquée', withTestTransaction(async (testContext) => {
    // Given
    await createApiKeyFixture({ active: false })
    const handler = testContext.resolveHandler<VerifyApiKeyHandler>('authentication', 'verifyApiKeyHandler')
    // When
    const result = await handler.executer('pmb_test_revoked_token_xxxx')
    // Then
    expect(result.isOk()).toBe(true)
    expect(result.value).toBeNull()
  }))
})
```

`TestContext` :
```ts
// src/test/test-context.ts
export class TestContext {
  constructor(private readonly getContainer: ReturnType<typeof buildAppContainer>['getContainer']) {}
  resolveHandler<T>(moduleName: ModuleName, key: string): T {
    return this.getContainer(moduleName).resolve<T>(key)
  }
  resolveRepository<T>(moduleName: ModuleName, key: string): T {
    return this.getContainer(moduleName).resolve<T>(key)
  }
}
```

### 10.6 Factories

Un fichier par entité dans `src/test/fixtures/`. Fonctions utilitaires (pas de classes Awilix).

**Exception documentée à la règle 5.5** : les fixtures peuvent utiliser `getPrisma()` directement. Raison : pas de DI, on évite le boilerplate. `getPrisma()` retourne automatiquement la transaction courante (celle de `withTestTransaction`).

```ts
// src/test/fixtures/api-key.fixture.ts
import { getPrisma } from '@/framework/persistence/prisma/prisma-transaction'
import { randomUUID, createHash, randomBytes } from 'node:crypto'

export async function createApiKeyFixture(
  overrides: Partial<Prisma.api_keyUncheckedCreateInput> = {},
) {
  const rawToken = overrides.key_hash
    ? undefined
    : `pmb_test_${randomBytes(32).toString('hex')}`
  const keyHash = overrides.key_hash ?? createHash('sha256').update(rawToken!).digest('hex')
  const keyPrefix = rawToken ? rawToken.slice(0, 12) : (overrides.key_prefix ?? 'pmb_test_xxx')

  return getPrisma().api_key.create({
    data: {
      id: randomUUID(),
      nom: `test-key-${randomUUID().slice(0, 6)}`,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes: [],
      active: true,
      ...overrides,
    },
  })
}
```

### 10.7 Règles non-négociables de test

- ❌ Pas de mutation DB dans `beforeAll` / `afterAll`
- ❌ Pas d'override des timeouts Prisma par défaut (5s tx / 2s maxWait)
- ✅ Chaque test crée ses propres données via factories dans sa tx
- ✅ `connection_limit` Prisma aligné avec `maxThreads` Vitest
- ✅ Postgres de test lancé avec `max_connections=500 -c shared_buffers=256MB`

---

## 11. Infrastructure

### 11.1 Docker-compose

Basé sur `apps/pilote-ppg/docker-compose.yml`, adapté :
- 2 bases PostgreSQL : `postgres` (local dev, port 5434) et `postgres_test` (port 5435) — ports distincts de pilote-ppg (5432/5433) pour parallélisme
- Postgres test démarré avec `max_connections=500 -c shared_buffers=256MB`
- Pas de traefik initial
- Volume persisté sur `postgres` uniquement

### 11.2 Prisma schema initial

Tables minimales pour healthcheck + auth :

- **`api_key`** — section 9.2
- **`utilisateur`** + enum `statut_acces_enum` — section 9.3
- **`application_log`** — destination du `DatabaseSink` :

```prisma
model application_log {
  id         BigInt                     @id @default(autoincrement())
  level      application_log_level_enum
  categorie  String                     @default("systeme")
  message    String
  contexte   Json?
  source     String?
  duree_ms   Int?
  request_id String?
  date       DateTime                   @default(now())

  @@index([date])
  @@index([level, date])
  @@index([request_id])
}

enum application_log_level_enum {
  ERROR
  WARN
  INFO
  DEBUG
}
```

Première migration `0001_init` crée ces tables.

### 11.3 TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/framework/*": ["src/framework/*"],
      "@/authentication/*": ["src/authentication/*"],
      "@/healthcheck/*": ["src/healthcheck/*"],
      "@/test/*": ["src/test/*"],
      "@/config": ["src/config"]
    }
  }
}
```

### 11.4 ESLint + dependency-cruiser

**ESLint — règles clés :**
- `no-restricted-syntax` interdisant `export default` (whitelist pour configs tierces)
- `no-restricted-syntax` interdisant `new Date()` dans `src/**/model/**`, `src/**/commands/**`, `src/**/queries/**`
- `no-restricted-imports` interdisant `import { PrismaClient }` hors `framework/persistence/`
- Règles TypeScript strict standard

**dependency-cruiser — règles d'architecture :**

Fichier `.dependency-cruiser.cjs` :

1. **Cross-module internals interdits** :
   ```js
   {
     name: 'no-cross-module-internals',
     severity: 'error',
     from: { path: '^src/(?!framework|test)(?<source>[^/]+)/' },
     to: {
       path: '^src/(?!framework|test)(?<target>[^/]+)/',
       pathNot: [
         '^src/$1/',                          // même module autorisé
         '^src/[^/]+/public/',                // public/ des autres modules autorisé
       ],
     },
   }
   ```

2. **Imports de `<module>.module.ts` cross-module interdits** (seul `build-app-container.ts` y a droit)

3. **`framework/` ne dépend d'aucun module métier**

4. **`model/` ne dépend pas d'`infrastructure/` ni de `commands|queries|http`** (functional core pur)

5. **`<module>/public/` ne dépend que de `framework/`** (pas de fuite d'interne)

`dependency-cruiser` est appelé dans le script `lint`.

### 11.5 Scripts package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts | pino-pretty",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src && tsc --noEmit && depcruise --config .dependency-cruiser.cjs src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "database:init": "prisma migrate reset --force",
    "database:migration": "prisma migrate dev",
    "create-api-key": "tsx src/authentication/infrastructure/scripts/create-api-key.ts"
  }
}
```

---

## 12. CI / GitHub Actions

### 12.1 Convention du monorepo

Les workflows vivent dans `.github/workflows/`. Deux éléments réutilisés :
- **Workflow unique `testAndLint.yml`** — détecte les apps impactées via `dorny/paths-filter`
- **Action composite `.github/actions/setupNodeAndPackages`** — pnpm + Node + install cached

### 12.2 Ajouts à `testAndLint.yml`

**Étendre la détection :**
```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      pilote-ppg: ${{ steps.filter.outputs.pilote-ppg }}
      pilote-ppg-data-management: ${{ steps.filter.outputs.pilote-ppg-data-management }}
      mb-api: ${{ steps.filter.outputs.mb-api }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            pilote-ppg:
              - 'apps/pilote-ppg/**'
              - 'package.json'
              - 'pnpm-lock.yaml'
            pilote-ppg-data-management:
              - 'apps/pilote-ppg-data-management/**'
            mb-api:
              - 'apps/mb-api/**'
              - 'package.json'
              - 'pnpm-lock.yaml'
```

**Deux jobs pour mb-api :**

```yaml
  test-mb-core:
    name: Run tests (mb-api)
    needs: changes
    if: needs.changes.outputs['mb-api'] == 'true'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16.6-alpine
        env:
          POSTGRES_DB: postgres
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5435:5432
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5435/postgres?connection_limit=50
      JWT_SECRET: ci-jwt-secret-at-least-32-characters-long-placeholder
      NODE_ENV: test
      LOG_TO_DATABASE: 'false'
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setupNodeAndPackages
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Apply Prisma migrations
        run: pnpm -F @pilote/mb-api prisma migrate deploy
      - name: Run tests
        run: pnpm -F @pilote/mb-api test

  lint-mb-core:
    name: Run linters (mb-api)
    needs: changes
    if: needs.changes.outputs['mb-api'] == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setupNodeAndPackages
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Run lint
        run: pnpm -F @pilote/mb-api lint
```

### 12.3 Points importants

- **Service Postgres en port 5435** (cohérent avec `postgres_test` local). User/password `postgres/postgres` — distinct de la DB de dev, pas un secret.
- **`LOG_TO_DATABASE: false` en CI** — évite que `DatabaseSink` écrive en DB pendant les tests.
- **`prisma migrate deploy`** avant `pnpm test`.
- **Pas de job E2E** (pas de front).

### 12.4 Required status checks

Configurer `test-mb-core` et `lint-mb-core` comme required sur `dev` (et `main` si applicable) — étape manuelle côté settings.

---

## 13. Scope précis de ce ticket

### Livrables

**Fondations projet :**
1. `apps/mb-api/` enregistré dans le monorepo (`pnpm-workspace.yaml`)
2. Configs : `package.json`, `tsconfig.json`, `vitest.config.ts`, `.eslintrc.cjs`, `.prettierrc`, `.dependency-cruiser.cjs`, `docker-compose.yml`
3. Schema Prisma + migration `0001_init` (`api_key`, `utilisateur`, `application_log`)
4. Config Zod-validée (`src/config.ts`)

**Module `framework` :**
5. **Module-system** adapté de pilote-ppg (`define-module`, `boot-modules`, `module-names`) + `frameworkModule` + `build-app-container`
6. **`PrismaPilote` wrapper** + `PrismaTransaction` + `txStore` AsyncLocalStorage
7. Logger sinks composables : `CompositeLogger` + `PinoStdoutSink` + `DatabaseSink`
8. Clock : interface + `SystemClock`
9. **Auth context** : `AsyncLocalStorageAuthContext` + `requireUser()` / `requireApiKey()` / `currentAuth()`
10. **Result** : re-exports neverthrow (`ok`, `err`, `okAsync`, `errAsync`, `Result`, `ResultAsync`)
11. **AppError** + `ErrorKind` (avec `'not-implemented'`, `'unauthenticated'`, `'forbidden'`)
12. Middlewares HTTP : `request-id`, `logger`, `auth-context`, `auth`, `require-scope`, `error-handler`
13. **Error handling** : mapping `kind → HTTP status`, `app.onError` + `app.notFound`, helper `respondWithResult`, `ErrorSchema` partagé
14. **App Hono** : `buildApp` + Swagger UI (`/api/docs`) + JSON (`/api/openapi.json`)

**Module `authentication` :**
15. **Functional core `model/`** :
    - Types + branded types : `ApiKey`, `ApiKeyId`, `Scope`, `Utilisateur`, `UtilisateurId`, `Email`, `StatutAcces`
    - Factory functions pures : `createApiKey`, `revokeApiKey`, `parseEmail`, `apiKeyId`, factories `Utilisateur` (stubées)
    - 3 erreurs API key (`InvalidApiKeyNameError`, `ApiKeyScopesRequiredError`, `ApiKeyAlreadyRevokedError`)
    - Tests unit purs sur les factories
16. **Ports (dans `model/`)** : `ApiKeyHasher`, `TokenGenerator`, `TokenSigner`, `ApiKeyRepository`, `UtilisateurRepository`
17. **Infrastructure** : `ApiKeyPrismaRepository` + mapper, `UtilisateurPrismaRepository` + mapper, adapters `Sha256ApiKeyHasher` / `CryptoTokenGenerator` / `JsonwebtokenTokenSigner`, scaffolding `ProconnectClient`, CLI `create-api-key.ts`
18. **Commands** : `CreateSessionHandler` (stub `errAsync(NotImplementedError)`)
19. **Queries** : `VerifyApiKeyHandler`, `VerifyJwtHandler` (fonctionnels, testés)
20. **Public** : `AuthenticationFacade` interface + `AuthenticationFacadeImpl`, `ApiKeyApiModelSchema` + `UtilisateurApiModelSchema`
21. Route HTTP `POST /auth/sessions` (retourne 501)
22. `authentication.module.ts` avec cradle typé + export de `authenticationFacade`

**Module `healthcheck` :**
23. `CheckHealthHandler` (ping DB via `SELECT 1`), route `GET /health` (publique)
24. `healthcheck.module.ts`

**Tests & helpers :**
25. `vitest.setup.ts`, `withTestTransaction`, `TestContext`, `FakeClock`
26. Fixtures : `api-key.fixture.ts`, `utilisateur.fixture.ts`

**Documentation :**
27. CLAUDE.md du projet
28. `docs/architecture/decisions/0001-record-architecture-decisions.md`
29. `docs/architecture/decisions/0002-architecture-init-mb-api.md` (synthèse de ce design)

**CI :**
30. Mise à jour de `.github/workflows/testAndLint.yml`

---

### Hors scope (tickets suivants)

**Modules à créer :**
- `pilotage` : `Entity` paramétrable, `Indicateur`, collecte
- `parametrage` : méta-modèle Marque Blanche
- `territorialisation` : hiérarchie territoriale
- `rapport` : bilans, exports CSV/XLSX
- `notification` : emails via Brevo
- `audit` : historique consolidé

**Complétions du module `authentication` :**
- **Intégration ProConnect** (flow OIDC complet, JWKS, upsert user)
- Endpoints `GET /auth/me`, `POST /auth/acces/demande`, `PATCH /auth/utilisateurs/{id}/acces`
- Middleware de blocage `EN_ATTENTE_ACCES`
- Refresh tokens (si nécessaire)

**Autres :**
- Front `pilote-mb-webapp`
- CI/CD (déploiement)
- Monitoring/APM
- Page "Demander l'accès"
- RBAC fine-grained

---

## 14. Questions ouvertes / décisions différées

- **Nom du schéma Postgres** : on reste sur `public`. Multi-tenant = ticket dédié si pertinent.
- **Refresh tokens** : pas nécessaire pour le MVP, TTL 8h.
- **Idempotency-Key header** : convention prête, pas implémentée tant qu'on n'a pas de mutation critique.
- **Luxon différé** : Date native à l'init (cf. 6.6). Bascule au premier module qui manipule beaucoup de dates.
- **ProConnect en maintenance** : ticket d'intégration lancé dès le retour du service.
- **Facade write vs query** : on garde une seule `AuthenticationFacade` (combine les deux). Si la facade grossit, on séparera `AuthenticationCommandFacade` / `AuthenticationQueryFacade`. Question repoussée.
- **Migration vers fonctions pures pour les use cases** : à l'init on garde des classes (`*Handler`) pour la cohérence Awilix. Si on observe que les classes n'ajoutent rien de plus que `function executer(deps, command)`, on bascule sur des fonctions pures + factory de handler. À ré-évaluer après 2-3 modules métier.

---

## 15. Critères de succès de l'init

- ✅ `pnpm dev` lance le serveur avec logs pretty
- ✅ `curl http://localhost:3000/health` retourne 200 avec body JSON
- ✅ `curl http://localhost:3000/api/openapi.json` retourne un OpenAPI 3.1 valide
- ✅ `http://localhost:3000/api/docs` affiche Swagger UI
- ✅ `curl -X POST http://localhost:3000/auth/sessions ...` retourne 501 avec message explicite
- ✅ Une requête sur une route protégée sans Bearer → 401 via `app.onError`
- ✅ Une requête avec un `pmb_live_*` valide → 200 (si scope OK)
- ✅ Une route qui throw → 500 via `app.onError`, stack loggué jamais exposé
- ✅ Une route inexistante → 404 avec `ErrorSchema { code: 'ROUTE_NOT_FOUND', ... }`
- ✅ Toutes les réponses d'erreur suivent `ErrorSchema { code, message, details? }`
- ✅ Les tests passent en parallèle (functional core unit + use cases integration)
- ✅ `pnpm lint` passe (eslint + tsc + dependency-cruiser)
- ✅ CLAUDE.md et ADR 0002 en place
- ✅ Les jobs CI `test-mb-core` et `lint-mb-core` passent vert sur la PR

**Critères architecturaux spécifiques :**
- ✅ Tester `createApiKey()` se fait sans container, sans DB, en pur unit
- ✅ Importer `ApiKeyRepository` depuis en dehors du module `authentication` **échoue à `depcruise`**
- ✅ Importer `UtilisateurApiModel` depuis `@/authentication/public/utilisateur.api-model` **fonctionne** depuis n'importe quel module
- ✅ Dans un test, remplacer `Clock` par `FakeClock` permet de figer les timestamps
- ✅ Un use case peut appeler `requireUser()` sans recevoir l'identité en paramètre — résolue via l'ALS
- ✅ Une command qui crée une API key utilise `transaction.run()` ; tous les repos appelés en aval voient automatiquement la tx via l'ALS

---

## 16. Gestion des erreurs

L'erreur doit remonter du fonctionnel core à l'utilisateur avec un format stable, un statut HTTP cohérent, et un logging adapté.

### 16.1 Niveau 1 — `AppError` typée (dans `framework/errors/`)

Base abstraite portée par toutes les erreurs métier ou techniques typées. Chaque sous-classe déclare un `code` stable et un `kind` pour le mapping HTTP.

```ts
// src/framework/errors/kinds.ts
export type ErrorKind =
  | 'not-found'
  | 'validation'
  | 'conflict'
  | 'forbidden'
  | 'unauthenticated'
  | 'not-implemented'
  | 'internal'
```

```ts
// src/framework/errors/app-error.ts
export abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly kind: ErrorKind
  readonly details?: Record<string, unknown>

  constructor(message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.details = details
  }
}

// Exemples concrets dans les modules
export class EntityNotFoundError extends AppError {
  readonly code = 'ENTITY_NOT_FOUND'
  readonly kind = 'not-found' as const
}

export class InvalidApiKeyNameError extends AppError {
  readonly code = 'INVALID_API_KEY_NAME'
  readonly kind = 'validation' as const
}

export class UnauthenticatedError extends AppError {
  readonly code = 'UNAUTHENTICATED'
  readonly kind = 'unauthenticated' as const
}

export class NotImplementedError extends AppError {
  readonly code = 'NOT_IMPLEMENTED'
  readonly kind = 'not-implemented' as const
}
```

**Règle** : toute erreur métier = une classe dédiée. Jamais de `throw new Error('...')` dans `model/`, `commands/`, `queries/`.

### 16.2 Niveau 2 — Mapping `kind` → HTTP status

```ts
// src/framework/http/error-mapping.ts
const KIND_TO_STATUS: Record<ErrorKind, number> = {
  'not-found':       404,
  'validation':      400,
  'conflict':        409,
  'forbidden':       403,
  'unauthenticated': 401,
  'not-implemented': 501,
  'internal':        500,
}

export const mapAppErrorToHttpStatus = (error: AppError): number =>
  KIND_TO_STATUS[error.kind]
```

### 16.3 Niveau 3 — Error boundary global via `app.onError`

```ts
// src/framework/http/middlewares/error-handler.middleware.ts
export function registerErrorHandler(app: OpenAPIHono, container: AwilixContainer) {
  const logger = container.resolve<Logger>('logger')

  app.onError((error, context) => {
    const requestId = context.get('requestId') ?? undefined
    const url = context.req.url
    const method = context.req.method

    if (error instanceof AppError) {
      const status = mapAppErrorToHttpStatus(error)
      const level = status >= 500 ? 'error' : 'warn'
      logger[level]({ code: error.code, url, method, requestId }, error.message)
      return context.json({
        code: error.code,
        message: error.message,
        details: error.details,
      }, status)
    }

    if (error instanceof HTTPException) {
      logger.warn({ url, method, requestId, status: error.status }, error.message)
      return context.json({
        code: error.status === 401 ? 'UNAUTHENTICATED'
            : error.status === 403 ? 'FORBIDDEN'
            : 'HTTP_EXCEPTION',
        message: error.message,
      }, error.status)
    }

    if (error instanceof ZodError) {
      logger.warn({ url, method, requestId, issues: error.issues }, 'Validation error')
      return context.json({
        code: 'VALIDATION_ERROR',
        message: 'Les données fournies sont invalides',
        details: { issues: error.issues },
      }, 400)
    }

    logger.error(
      { url, method, requestId, stack: error.stack, name: error.name },
      `Unhandled error: ${error.message}`,
    )
    return context.json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Une erreur interne est survenue',
    }, 500)
  })

  app.notFound((context) => context.json({
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${context.req.method} ${context.req.url} introuvable`,
  }, 404))
}
```

**Règles non-négociables :**
- **Jamais de stack trace dans la réponse HTTP**
- **Réponse prod identique à la réponse staging**
- **Tout est loggué** (warn pour 4xx, error pour 5xx)
- **`requestId`** posé par un middleware en amont, propagé dans tous les logs

### 16.4 Niveau 4 — Helper `respondWithResult` pour les routes

```ts
// src/framework/http/respond-with-result.ts
export async function respondWithResult<TValue, TError extends AppError, TResponse>(
  context: Context,
  result: Result<TValue, TError> | ResultAsync<TValue, TError>,
  onSuccess: (value: TValue) => TResponse,
): Promise<TResponse | Response> {
  const resolved = 'isErr' in result ? result : await result
  if (resolved.isErr()) {
    const error = resolved.error
    return context.json({
      code: error.code,
      message: error.message,
      details: error.details,
    }, mapAppErrorToHttpStatus(error))
  }
  return onSuccess(resolved.value)
}
```

**Usage :**
```ts
app.openapi(createEntityRoute, async (context) => {
  const body = context.req.valid('json')
  const handler = container.resolve<CreateEntityHandler>('createEntityHandler')
  const result = handler.executer({ nom: body.nom })

  return respondWithResult(context, result, (entity) =>
    context.json({ id: entity.id, nom: entity.nom }, 201),
  )
})
```

### 16.5 Conventions à figer

- ❗ Toute erreur métier ou typée = classe héritée d'`AppError` avec `code` stable + `kind`
- ❗ Tout handler retourne `Result<T, E>` ou `ResultAsync<T, E>` — pas de throw métier
- ❗ Toute route utilise `respondWithResult`
- ❗ Les throws techniques remontent à `app.onError` qui loggue et renvoie une réponse `ErrorSchema`
- ❗ Pas de stack trace exposée côté HTTP
- ❗ `requestId` présent dans tous les logs liés à une requête
- ❗ `requireUser()` / `requireApiKey()` throw `UnauthenticatedError` — c'est l'unique exception au "pas de throw métier", justifiée par l'ergonomie d'API (catché par `app.onError`, mappé sur 401)
