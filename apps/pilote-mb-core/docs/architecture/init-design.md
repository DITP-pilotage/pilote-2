# Design — Initialisation de pilote-mb-core (backend Marque Blanche)

Date : 2026-04-23
Statut : Proposition validée, à implémenter

## 1. Contexte

PILOTE (actuellement `apps/pilote-ppg`) est un outil de pilotage territorial pour les Politiques Prioritaires du Gouvernement (PPG). Chaque ministère porte des chantiers qui contiennent des indicateurs dont on collecte des valeurs pour calculer des taux d'avancement.

L'évolution souhaitée, `pilote-mb` ("Marque Blanche"), vise une version **générique et paramétrable** de cet outil :
- Plus de concept de "chantier" figé — remplacé par des **entités** paramétrables
- Les entités contiennent des **indicateurs de différents types**
- L'objectif est qu'elle puisse être déployée par différents clients avec leur propre paramétrage métier

Ce document décrit l'**initialisation du backend** (`pilote-mb-core`), premier composant de l'app. Le frontend (`pilote-mb-webapp`, Vite + React + TanStack Query) viendra dans un ticket séparé.

## 2. Objectifs de l'init

1. Mettre en place le squelette du backend avec une architecture propre dès le départ
2. Livrer un premier endpoint `GET /health` fonctionnel
3. Figer les conventions d'architecture dans un CLAUDE.md et un ADR
4. Préparer l'intégration future avec un agent IA satellite consommant l'API
5. Préparer les fondations de l'authentification (API Keys complètes + scaffolding user/ProConnect)

## 3. Vocabulaire

| Terme | Définition |
|---|---|
| pilote-mb / Marque Blanche | Version générique paramétrable de pilote-ppg |
| pilote-mb-core | Backend Hono de pilote-mb |
| pilote-mb-webapp | Futur front Vite + React (hors scope de ce ticket) |
| PPG | Politique Prioritaire du Gouvernement (vocabulaire pilote-ppg) |
| Entity | Nouvelle entité générique de pilote-mb (remplace "chantier") |
| Indicateur | Mesure associée à une Entity |
| ProConnect | IdP gouvernemental (ex-AgentConnect) pour les users humains |

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
- **neverthrow** pour `Result<T, E>`

### Observabilité
- **pino** pour le logging via pattern de sinks composables
- Logs persistés en DB initialement (pas d'APM disponible) via un sink dédié, remplaçable sans refacto du code métier

### Authentification
- **API Keys** en DB pour les agents/services machine-to-machine (impl complète), hashées en **SHA-256 déterministe** (lookup par index, cf. section 9.2)
- **ProConnect OIDC** pour les users humains (scaffolding dans ce ticket, intégration dans un ticket suivant)
- **jsonwebtoken** pour le JWT interne (HS256, TTL 8h)
- **openid-client** pour le flow OIDC (à intégrer dans le ticket suivant)
- Pas de bcrypt — aucun password n'est stocké côté backend (auth users exclusivement via ProConnect)

### Tests
- **Vitest** (backend et futur front)
- `test.sequence.concurrent: true` — parallélisme max par défaut
- `withTestTransaction` — chaque test dans sa propre transaction, rollback automatique

---

## 5. Architecture

### 5.1 DDD by the book — stratégique ET tactique

pilote-mb-core adopte le **Domain-Driven Design complet**, à la fois stratégique et tactique :

- **Stratégique** : subdomains alignés sur des bounded contexts, Published Language explicite entre contexts, Anti-Corruption Layer quand les modèles divergent, Context Map documenté
- **Tactique** : Aggregate Roots avec invariants, Value Objects formalisés, Domain Events publiés par les agrégats, Repositories scopés à l'agrégat, Factories pour les créations contrôlées, Domain Services pour la logique transverse (selon besoin), Clock injectable

**Pourquoi by the book plutôt qu'un sous-ensemble pragmatique ?**
- Application neuve sans dette — moment unique pour figer les fondations
- Le subdomain/BC alignement est **difficile à rétrofitter** après coup
- Pilote-mb est pensé pour durer et grossir (multi-tenant, agent IA, extraction future potentielle en services)
- La douleur ressentie sur pilote-ppg avec le "partage de repos cross-context" était le **symptôme d'un DDD incomplet** (pas d'ACL, pas de Published Language) — la bonne réponse est d'aller plus loin, pas de reculer

**CQRS logique conservé** : séparation explicite `commands/` (écriture, change l'état) et `queries/` (lecture, retourne des vues dédiées). Même base, pas d'event sourcing.

### 5.2 Subdomains de pilote-mb et Bounded Contexts

Les subdomains identifiés pour pilote-mb, classés selon la taxonomie Evans (Core / Supporting / Generic) :

| Subdomain | Classification | BC matérialisé | Présent à l'init ? |
|---|---|---|---|
| **Pilotage** (entities paramétrables + indicateurs + collecte) | **Core** | `pilotage` | ❌ ticket suivant |
| **Paramétrage Marque Blanche** (méta-modèle client) | **Core** | `parametrage` | ❌ tickets suivants |
| Authentification | Supporting | `authentication` | ✅ BC complet |
| Territorialisation | Supporting | `territorialisation` | ❌ tickets suivants |
| Reporting | Supporting | `rapport` | ❌ tickets suivants |
| Notification | Generic | `notification` | ❌ tickets suivants |
| Audit | Generic | `audit` | ❌ tickets suivants |
| Healthcheck | (infra) | `healthcheck` | ✅ BC minimal |

Le **Core domain** (`pilotage` + `parametrage`) porte la valeur différenciante de pilote-mb — ce sera l'effort de modélisation DDD le plus soutenu. Les subdomains supporting et generic sont traités avec la même rigueur stratégique (frontières strictes, Published Language) mais potentiellement moins de raffinement tactique (pas forcément tous les patterns).

Pour l'init, **seul `authentication` est implémenté comme BC DDD complet** (stratégique + tactique au grand complet). Le BC `healthcheck` est minimal (pas d'entité, juste une query technique). Ils servent de **template concret** pour les futurs BCs qui arriveront dans leurs tickets dédiés.

### 5.3 Context Map

Relations entre BCs documentées explicitement :

| Source → Cible | Relation DDD | Mécanisme concret |
|---|---|---|
| `pilotage` → `authentication` | Customer/Supplier (downstream) | Consomme `AuthenticationFacade` + DTO `UtilisateurReference` via ACL |
| `pilotage` → `territorialisation` | Customer/Supplier | `TerritorialisationFacade` + `TerritoireReference` |
| `rapport` → `pilotage` | Conformist (read-only) | `PilotageFacade` |
| `audit` → tous | Conformist (subscriber) | Écoute les Domain Events publiés via le bus |
| tous → `shared-kernel` | Shared Kernel | Primitives DDD : `AggregateRoot`, `ValueObject`, `DomainEvent`, `Result`, `Clock` |
| tous → `platform` | Shared Kernel technique | Infra : Prisma, logger, HTTP, container, event publisher |

À l'init, seules les relations `authentication → platform` et `healthcheck → platform` sont actives. Le reste est documenté pour cadrer les tickets suivants.

### 5.4 Structure des dossiers

```
apps/pilote-mb-core/
├── src/
│   ├── shared-kernel/                         # primitives DDD stables, partagées par tous les BCs
│   │   ├── aggregate-root.ts                  # base class + pendingEvents
│   │   ├── value-object.ts                    # base class + equals
│   │   ├── domain-event.ts                    # interface DomainEvent
│   │   ├── domain-event-publisher.ts          # port (interface)
│   │   ├── domain-event-handler.ts            # interface pour listeners
│   │   ├── domain-error.ts                    # classe de base + DomainErrorKind
│   │   ├── result.ts                          # re-export neverthrow pour cohérence
│   │   ├── uuid.ts                            # VO UUID
│   │   ├── clock.ts                           # port injectable (évite new Date() dans le domain)
│   │   ├── transaction.ts                     # port Transaction
│   │   └── logger.ts                          # port Logger
│   │
│   ├── platform/                              # infra technique transverse (pas un BC métier)
│   │   ├── persistence/prisma/
│   │   │   ├── prisma-transaction.ts          # AsyncLocalStorage + txStore + PrismaTransaction
│   │   │   └── prisma-pilote.ts               # wrapper injectable
│   │   ├── http/
│   │   │   ├── app.ts                         # buildApp (assemble routes de tous les BCs)
│   │   │   ├── middlewares/
│   │   │   │   ├── request-id.middleware.ts
│   │   │   │   ├── logger.middleware.ts
│   │   │   │   ├── auth.middleware.ts         # consomme AuthenticationFacade via Published Language
│   │   │   │   ├── require-scope.middleware.ts
│   │   │   │   └── error-handler.middleware.ts
│   │   │   ├── schemas/
│   │   │   │   ├── error.schema.ts
│   │   │   │   └── pagination.schema.ts
│   │   │   ├── error-mapping.ts               # DomainErrorKind → HTTP status
│   │   │   └── respond-with-result.ts
│   │   ├── logging/
│   │   │   ├── composite-logger.ts
│   │   │   └── sinks/
│   │   │       ├── pino-stdout.sink.ts
│   │   │       └── database.sink.ts
│   │   ├── events/
│   │   │   ├── in-memory-domain-event-publisher.ts   # adapter du port
│   │   │   └── audit-log-event-handler.ts            # handler → application_log
│   │   ├── clock/
│   │   │   └── system-clock.ts                # adapter Clock (wrap Date)
│   │   ├── container/
│   │   │   ├── module-system/                 # adapté de pilote-ppg
│   │   │   │   ├── define-module.ts
│   │   │   │   ├── boot-modules.ts
│   │   │   │   └── module-names.ts
│   │   │   └── build-app-container.ts         # bootstrap : assemble tous les modules des BCs
│   │   └── platform.module.ts                 # cradle transverse (prisma, transaction, logger, clock, eventPublisher, …)
│   │
│   ├── authentication/                        # BC Authentication (DDD complet)
│   │   ├── domain/
│   │   │   ├── api-key/
│   │   │   │   ├── api-key.ts                 # AggregateRoot + factory create()
│   │   │   │   ├── api-key-id.ts              # VO
│   │   │   │   ├── scope.ts                   # VO
│   │   │   │   ├── api-key.repository.ts      # INTERFACE (scopée à l'agrégat)
│   │   │   │   ├── errors/
│   │   │   │   │   ├── invalid-api-key-name.error.ts
│   │   │   │   │   ├── api-key-scopes-required.error.ts
│   │   │   │   │   └── api-key-already-revoked.error.ts
│   │   │   │   └── events/
│   │   │   │       ├── api-key-created.event.ts
│   │   │   │       └── api-key-revoked.event.ts
│   │   │   └── utilisateur/
│   │   │       ├── utilisateur.ts             # AggregateRoot + factory
│   │   │       ├── utilisateur-id.ts          # VO
│   │   │       ├── email.ts                   # VO (validation format)
│   │   │       ├── statut-acces.ts            # VO
│   │   │       ├── utilisateur.repository.ts  # INTERFACE
│   │   │       ├── errors/
│   │   │       └── events/
│   │   │           └── utilisateur-created.event.ts
│   │   ├── application/
│   │   │   ├── commands/create-session/       # ProConnect — scaffolding, stub
│   │   │   │   ├── create-session.command.ts
│   │   │   │   ├── create-session.handler.ts
│   │   │   │   └── create-session.handler.test.ts
│   │   │   ├── queries/
│   │   │   │   ├── verify-api-key/
│   │   │   │   └── verify-jwt/
│   │   │   └── facades/
│   │   │       └── authentication.facade.impl.ts      # implémente AuthenticationFacade
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   │   ├── api-key.mapper.ts          # domain ↔ Prisma row
│   │   │   │   ├── api-key.prisma-repository.ts
│   │   │   │   ├── utilisateur.mapper.ts
│   │   │   │   └── utilisateur.prisma-repository.ts
│   │   │   ├── crypto/
│   │   │   │   ├── sha256-api-key-hasher.ts
│   │   │   │   ├── crypto-token-generator.ts
│   │   │   │   └── jsonwebtoken-token-signer.ts
│   │   │   ├── http/
│   │   │   │   └── routes/
│   │   │   │       └── create-session.route.ts
│   │   │   ├── proconnect/
│   │   │   │   └── proconnect-client.ts       # scaffolding (ticket suivant)
│   │   │   └── scripts/
│   │   │       └── create-api-key.ts          # CLI
│   │   ├── public/                            # 🔑 PUBLISHED LANGUAGE
│   │   │   ├── utilisateur-reference.ts       # DTO minimal exposé aux autres BCs
│   │   │   ├── api-key-reference.ts
│   │   │   └── authentication.facade.ts       # interface des capabilities exposées
│   │   └── authentication.module.ts           # cradle + exports
│   │
│   ├── healthcheck/                           # BC minimal (pas d'entité, juste une query)
│   │   ├── application/queries/check-health/
│   │   │   ├── check-health.handler.ts
│   │   │   └── check-health.handler.test.ts
│   │   ├── infrastructure/http/routes/
│   │   │   └── health.route.ts
│   │   ├── public/
│   │   │   └── healthcheck.facade.ts          # exposé si d'autres BCs veulent s'en servir
│   │   └── healthcheck.module.ts
│   │
│   ├── test/                                  # helpers transverses (pas un BC)
│   │   ├── vitest.setup.ts                    # setup global
│   │   ├── with-test-transaction.ts
│   │   ├── test-context.ts
│   │   ├── fake-clock.ts                      # Clock figé pour tests
│   │   └── fixtures/                          # une factory par AggregateRoot
│   │       ├── api-key.fixture.ts
│   │       └── utilisateur.fixture.ts
│   │
│   ├── config.ts                              # Config Zod-validée
│   └── index.ts                               # bootstrap
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   └── architecture/
│       └── decisions/
│           ├── 0001-record-architecture-decisions.md
│           └── 0002-architecture-init-pilote-mb-core.md
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .dependency-cruiser.cjs                    # règles d'architecture (obligatoire)
├── .eslintrc.cjs
├── .prettierrc
└── CLAUDE.md
```

Tests co-localisés : `foo.ts` + `foo.test.ts` côte-à-côte.

**Points clés de cette structure :**
- **Un dossier racine par BC** — `authentication/`, `healthcheck/`, plus tard `pilotage/`, `territorialisation/`, etc.
- **Chaque BC est autonome** : ses propres couches (`domain/`, `application/`, `infrastructure/`) + son `public/` + son `<bc>.module.ts`
- **`shared-kernel/`** : primitives DDD neutres (AggregateRoot, ValueObject, DomainEvent, ports techniques) — importable de partout
- **`platform/`** : infra technique transverse (Prisma, HTTP, logging, events, container) — **pas un BC métier**
- **`public/`** par BC : l'**unique** porte d'entrée pour les autres BCs (DTOs + facades)
- **`test/`** : helpers transverses, hors BC

### 5.5 Règles de dépendances et outillage

**Règle cardinale :** aucun import cross-BC autorisé sauf via le dossier `public/` du BC source.

```ts
// ❌ INTERDIT — import interne d'un autre BC
import { UtilisateurRepository } from '@/authentication/domain/utilisateur/utilisateur.repository'
import { CreateSessionHandler } from '@/authentication/application/commands/create-session/create-session.handler'

// ✅ AUTORISÉ — import du Published Language
import type { UtilisateurReference } from '@/authentication/public/utilisateur-reference'
import type { AuthenticationFacade } from '@/authentication/public/authentication.facade'
```

**Outillage obligatoire dès l'init :**

1. **`dependency-cruiser`** (config `.dependency-cruiser.cjs`, run en CI) — interdit par règles :
   - Imports depuis un BC vers `@/<autre-bc>/{domain,application,infrastructure}/**`
   - Imports depuis un BC vers `@/<autre-bc>/<bc>.module.ts` (seul `platform/container/build-app-container.ts` y a droit)
   - Imports de `platform/` ou d'un BC dans `shared-kernel/` (shared-kernel reste pur, côté domaine uniquement)

2. **Règle ESLint `no-restricted-syntax`** :
   - Interdit `export default` sauf whitelist
   - Interdit `new <AggregateRoot>()` direct en dehors des fichiers `*.repository.ts` et `*.test.ts` — force le passage par les factories `Entity.create(...)`

3. **Convention no-barrel** documentée dans CLAUDE.md (sauf `public/` de chaque BC et `shared-kernel/` qui peuvent exposer via des fichiers nommés explicites, jamais `index.ts`)

**Règles intra-BC (au sein d'un même BC) :**
- `domain/` importe `shared-kernel/` et son propre `domain/` uniquement
- `application/` importe `domain/` de son BC + `shared-kernel/` + **les facades publiques d'autres BCs** (via `@/autre-bc/public/...`)
- `infrastructure/` peut tout importer (son BC entier + `platform/` + `shared-kernel/` + facades publiques)
- `public/` n'importe que `shared-kernel/` — jamais de fuite d'infra/application/domain interne

### 5.6 Published Language et Anti-Corruption Layer

**Published Language** : chaque BC expose dans `public/` :
- **DTOs minimaux** (`UtilisateurReference` ≠ `Utilisateur` entité complète)
- **Interfaces de facades** (`AuthenticationFacade`) décrivant les capabilities que les autres BCs peuvent appeler

Les **DTOs** sont volontairement **pauvres** : ils ne doivent pas fuiter l'état interne du BC source.

```ts
// src/authentication/public/utilisateur-reference.ts
export type UtilisateurReference = {
  readonly id: string
  readonly email: string
  readonly nomComplet: string
}
// Notez ce qui N'est PAS exposé : statut_acces, token_version, sub_proconnect, roles
// → concepts internes à authentication, les autres BCs n'ont rien à en savoir
```

```ts
// src/authentication/public/authentication.facade.ts
export interface AuthenticationFacade {
  utilisateurExiste(utilisateurId: string): Promise<boolean>
  getUtilisateurReference(utilisateurId: string): Promise<UtilisateurReference | null>
  verifyApiKey(rawToken: string): Promise<ApiKeyReference | null>
  verifyJwt(rawJwt: string): Promise<UtilisateurReference | null>
}
```

L'implémentation vit dans `authentication/application/facades/` et consomme les repos internes — c'est la seule place où on traverse la frontière du Published Language à l'intérieur du BC.

**Anti-Corruption Layer (ACL)** : quand un BC consommateur a besoin d'un concept **avec sa propre sémantique métier**, il traduit le Published Language en son propre modèle via un Translator dans `infrastructure/acl/`.

Exemple prospectif (ticket futur) :
```ts
// src/pilotage/infrastructure/acl/utilisateur-to-responsable.translator.ts
export class UtilisateurToResponsableTranslator {
  toResponsable(reference: UtilisateurReference): Responsable {
    return Responsable.reconstitute({
      id: ResponsableId.from(reference.id),
      nomComplet: new NomComplet(reference.nomComplet),
    })
  }
}
```

→ Le BC `pilotage` ne parle **jamais** d'`UtilisateurReference` dans son `domain/` — uniquement de `Responsable`. Isolation sémantique réelle.

### 5.7 Patterns tactiques DDD

#### 5.7.1 Aggregate Root

Toute entité avec identité propre hérite d'`AggregateRoot`. Les invariants de consistance sont scopés à l'agrégat, checkés lors des mutations.

```ts
// src/shared-kernel/aggregate-root.ts
export abstract class AggregateRoot<TId> {
  protected constructor(readonly id: TId) {}
  private readonly pendingEvents: DomainEvent[] = []

  protected recordEvent(event: DomainEvent): void {
    this.pendingEvents.push(event)
  }

  pullPendingEvents(): ReadonlyArray<DomainEvent> {
    const events = [...this.pendingEvents]
    this.pendingEvents.length = 0
    return events
  }
}
```

Agrégats de l'init : `ApiKey`, `Utilisateur`.

#### 5.7.2 Value Object

Immuables, égalité par valeur, validation à la construction.

```ts
// src/shared-kernel/value-object.ts
export abstract class ValueObject<T> {
  constructor(protected readonly value: T) {}
  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this.value) === JSON.stringify(other.value)
  }
  valueOf(): T { return this.value }
}
```

VOs de l'init : `ApiKeyId`, `UtilisateurId`, `Email` (avec regex de validation), `StatutAcces` (enum), `Scope` (format `<resource>:<action>`).

#### 5.7.3 Domain Event

Les AggregateRoots enregistrent leurs events via `recordEvent()`. Les repos les publient via le bus **après un `save()` réussi** (dans la même transaction logique).

```ts
// src/shared-kernel/domain-event.ts
export interface DomainEvent {
  readonly type: string
  readonly occurredAt: Date
  readonly aggregateId: string
}
```

Events de l'init (cas concrets, pas cosmétiques) :
- `ApiKeyCreatedEvent` — émis par `ApiKey.create()`
- `ApiKeyRevokedEvent` — émis par `ApiKey.revoke()`
- `UtilisateurCreatedEvent` — émis par la future factory `Utilisateur.createFromProConnect()` (scaffolding)

Handler initial : `AuditLogEventHandler` dans `platform/events/` qui persiste tous les events dans `application_log` (trace d'audit). Prouve le pattern end-to-end.

#### 5.7.4 Factory (static method)

Création d'un agrégat **uniquement** via `Entity.create(...)` :
- Check les invariants
- Génère l'id
- Enregistre l'event de création

Reconstruction depuis DB uniquement via `Entity.reconstitute(...)` (utilisée par le repo).

```ts
export class ApiKey extends AggregateRoot<ApiKeyId> {
  private constructor(/* privé — pas d'instanciation directe */) { super(id) }

  static create(params: {
    nom: string
    scopes: Scope[]
    hasher: ApiKeyHasher
    tokenGenerator: TokenGenerator
    clock: Clock
  }): Result<{ aggregate: ApiKey; rawToken: string }, DomainError> {
    if (params.nom.trim() === '') return err(new InvalidApiKeyNameError())
    if (params.scopes.length === 0) return err(new ApiKeyScopesRequiredError())

    const rawToken = params.tokenGenerator.generate()
    const keyHash = params.hasher.hash(rawToken)
    const keyPrefix = rawToken.slice(0, 12)
    const aggregate = new ApiKey(ApiKeyId.generate(), params.nom, keyHash, keyPrefix, params.scopes, true)

    aggregate.recordEvent(new ApiKeyCreatedEvent(aggregate.id.valueOf(), params.clock.now()))
    return ok({ aggregate, rawToken })
  }

  static reconstitute(row: /* DB shape */): ApiKey { /* ... */ }

  revoke(clock: Clock): Result<void, DomainError> {
    if (!this.active) return err(new ApiKeyAlreadyRevokedError())
    this.active = false
    this.recordEvent(new ApiKeyRevokedEvent(this.id.valueOf(), clock.now()))
    return ok(undefined)
  }
}
```

Une règle ESLint interdit `new ApiKey(...)` en dehors de `api-key.ts` et des tests.

#### 5.7.5 Repository (scopé à l'agrégat)

**Un repo par AggregateRoot**, jamais par entité interne. Le repo sauvegarde l'agrégat entier et **publie ses events post-save**.

```ts
export class ApiKeyPrismaRepository implements ApiKeyRepository {
  constructor(private readonly deps: Inject<'prisma' | 'domainEventPublisher'>) {}

  async save(aggregate: ApiKey): Promise<void> {
    const data = ApiKeyMapper.toPersistence(aggregate)
    await this.deps.prisma.getInstance().api_key.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    })
    await this.deps.domainEventPublisher.publish(aggregate.pullPendingEvents())
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const row = await this.deps.prisma.getInstance().api_key.findUnique({ where: { key_hash: keyHash } })
    return row ? ApiKeyMapper.toDomain(row) : null
  }
}
```

#### 5.7.6 Domain Service

Logique métier qui ne rentre pas naturellement dans un AggregateRoot ou un VO. Vit dans `<bc>/domain/<agg>/services/` (lié à un agrégat) ou `<bc>/domain/services/` (transverse au BC, rare).

**À l'init : zéro Domain Service** justifié. La règle est documentée, applicable au cas par cas dans les futurs BCs.

#### 5.7.7 Clock injectable

Tous les timestamps du domain passent par un port `Clock` injecté, jamais `new Date()` direct dans `domain/` ou `application/`. Permet :
- Tests déterministes via `FakeClock`
- Centralisation du format temporel si besoin

```ts
// src/shared-kernel/clock.ts
export interface Clock { now(): Date }
```

Règle ESLint : interdit `new Date()` dans `domain/` et `application/`.

---

## 6. Patterns fondamentaux

### 6.1 Dependency Injection — module-system Awilix (copié/adapté de pilote-ppg)

pilote-mb-core reprend le **module-system** mis en place sur pilote-ppg. Il apporte trois bénéfices majeurs par rapport à un registre Awilix plat :
- **Découpage par bounded context** : chaque module correspond à un BC DDD et déclare son propre cradle typé
- **Graphe de dépendances explicite** via `imports` / `exports` — seules les facades des `exports` fuient entre BCs
- **Typage fort des injections** via `Inject<K>` — chaque classe déclare précisément les dépendances qu'elle consomme

> **Note terminologique :** dans pilote-mb-core, **1 module module-system = 1 bounded context DDD**. Le module `authentication` est le BC Authentication, le module `pilotage` sera le BC Pilotage, etc. Le module `platform` est l'exception : c'est une couche d'infra technique transverse (pas un BC métier), nommée ainsi pour éviter le terme vague "shared". Cf. section 5.2 pour la liste des BCs et leur classification (Core/Supporting/Generic).

#### Structure du framework

Le framework vit dans `src/platform/container/module-system/` :
- `define-module.ts` — factory curryfiée `defineModule<TExports, TCradle>()({...})` avec inférence des types
- `boot-modules.ts` — orchestrateur en 2 phases :
  - Phase 1 : crée un container racine pour le module sans imports (`platform`), puis un scope par autre module (héritant des deps transverses)
  - Phase 2 : résout eagerly les exports de chaque module importé et les ré-enregistre comme `asValue` dans le container consommateur (évite les boucles de résolution d'Awilix)
- `module-names.ts` — liste canonique typée des modules du projet

Adaptations par rapport à pilote-ppg :
- Renommage des fichiers/types en **camelCase** et noms **anglais** (sauf entités métier) pour respecter la convention de pilote-mb
- `PROXY` + `strict: true` sur le container racine (identique)

#### Module `platform` (racine, infra technique transverse)

```ts
// src/platform/platform.module.ts
type PlatformCradle = {
  prisma: PrismaPilote
  transaction: Transaction
  logger: Logger
  config: Config
  clock: Clock
  domainEventPublisher: DomainEventPublisher
}

export type PlatformDependencies = PlatformCradle

export const platformModule = defineModule<NoExports, PlatformCradle>()({
  name: 'platform',
  imports: [],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      prisma:               asModuleFunction(() => new PrismaPilote()).singleton(),
      transaction:          asModuleFunction(() => new PrismaTransaction()).singleton(),
      logger:               asModuleFunction(() => buildLogger(config)).singleton(),
      config:               asModuleFunction(() => config).singleton(),
      clock:                asModuleClass(SystemClock).singleton(),
      domainEventPublisher: asModuleFunction(({ logger }) =>
        new InMemoryDomainEventPublisher([
          new AuditLogEventHandler({ logger, prisma: /* injecté */ }),
        ]),
      ).singleton(),
    } satisfies VerifyCradle<PlatformCradle>)
  },
})
```

`platform` remplace l'ancien `shared` et porte les services techniques transverses. Les services liés à un BC spécifique (ex: `TokenSigner`, `ApiKeyHasher`) migrent dans le cradle de leur BC (ici `authentication`).

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
  authenticationFacade: AuthenticationFacade   // 🔑 Published Language
}

type AuthenticationExports = {
  authenticationFacade: AuthenticationFacade
}

export const authenticationModule = defineModule<AuthenticationExports, AuthenticationCradle>()({
  name: 'authentication',
  imports: ['platform'],
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

**Notez :**
- Tout ce qui est **lié à l'authentication** (hasher, token generator/signer, repos, handlers, facade) vit dans le cradle de `authentication`, pas dans `platform`
- Le champ `exports: ['authenticationFacade']` **autorise** les autres modules à consommer la facade via leur `imports: ['authentication']`
- Les autres BCs n'ont **aucun moyen** de récupérer `apiKeyRepository` ou autre interne — seule `authenticationFacade` est résolvable cross-module

#### Bootstrap

```ts
// src/platform/container/build-app-container.ts
export function buildAppContainer() {
  return bootModules([
    platformModule,
    authenticationModule,
    healthcheckModule,
  ])
}
```

#### Liste des modules de l'init

```ts
// src/platform/container/module-system/module-names.ts
export const moduleNames = [
  'platform',
  'authentication',
  'healthcheck',
] as const

export type ModuleName = (typeof moduleNames)[number]
```

On étend cette liste à chaque nouveau BC (`'pilotage'`, `'territorialisation'`, `'rapport'`, `'parametrage'`, `'notification'`, `'audit'`, ...).

#### Convention de vie des dépendances

- **Tout en singleton** (pas de scope par requête — les transactions passent par `AsyncLocalStorage`, pas par Awilix scope)
- **Mode Proxy Injection** (un seul argument objet dans le constructeur, déstructuré par le pattern `Inject<K>` ci-dessous)

### 6.2 Transactions — AsyncLocalStorage via `PrismaPilote` injecté

On reprend le pattern pilote-ppg : un `AsyncLocalStorage<PilotePrismaClient>` porte la transaction courante à travers la chaîne d'appels async, et un **wrapper `PrismaPilote`** lu via Awilix encapsule la résolution "tx courante OR client racine". Les repositories **ne touchent jamais** à `PrismaClient` ni à `getPrisma()` directement — ils consomment un `prisma: PrismaPilote` via `Inject<'prisma'>`.

```ts
// src/platform/persistence/prisma/prisma-transaction.ts
export type PilotePrismaClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
export const txStore = new AsyncLocalStorage<PilotePrismaClient>()

export class PrismaTransaction implements Transaction {
  async run<T>(scope: () => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => txStore.run(tx, scope))
  }
}
```

```ts
// src/platform/persistence/prisma/prisma-pilote.ts
export class PrismaPilote {
  private instance: PrismaClient | null = null

  getInstance(): PilotePrismaClient {
    if (!this.instance) this.instance = new PrismaClient()
    return txStore.getStore() ?? this.instance
  }
}
```

**Règle d'or** : aucun repository ne dépend directement de `PrismaClient` ni de `getPrisma()`. Tous consomment `this.deps.prisma.getInstance()` via le wrapper injecté.

```ts
// src/platform/persistence/prisma/api-key.prisma-repository.ts
import { type Inject } from '@/authentication/authentication.module'

export class ApiKeyPrismaRepository implements ApiKeyRepository {
  constructor(private readonly deps: Inject<'prisma'>) {}

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const row = await this.deps.prisma.getInstance().api_key.findUnique({
      where: { key_hash: keyHash },
    })
    return row ? ApiKeyMapper.toDomain(row) : null
  }
}
```

Un handler qui a besoin d'une transaction consomme le port `Transaction` via `Inject<'transaction'>` et appelle `this.deps.transaction.run(async () => { ... })`. Toute la chaîne async dans le callback bénéficie automatiquement de la tx courante via `AsyncLocalStorage` — les repos appellent `this.deps.prisma.getInstance()` et obtiennent la tx sans connaître son existence.

**Bénéfice vs import direct de `getPrisma()`** : les dépendances sont explicites dans le constructeur, les tests peuvent injecter un fake `PrismaPilote` trivialement, et on reste cohérent avec le pattern Awilix de toute l'app.

### 6.3 Result type — neverthrow

Les handlers ne throw pas pour les erreurs métier — ils retournent un `Result`.

```ts
import { err, ok, Result } from 'neverthrow'
import { type Inject } from '@/authentication/authentication.module'

export class CreateSessionHandler {
  constructor(private readonly deps: Inject<'utilisateurRepository' | 'tokenSigner'>) {}

  async executer(command: CreateSessionCommand): Promise<Result<Session, AuthenticationError>> {
    if (!command.idToken) return err(new MissingIdTokenError())
    // TODO: intégrer ProConnect (ticket suivant) — valider l'id_token via JWKS,
    // upsert utilisateur, émettre JWT via this.deps.tokenSigner.sign(...)
    return err(new NotImplementedError('ProConnect integration — voir ticket suivant'))
  }
}
```

Throws réservés aux erreurs techniques (DB down, config invalide, etc.) qui remontent au middleware d'erreur global (cf. section 16).

### 6.4 Logger — sinks composables

Port `Logger` dans `src/domain/shared/logger.ts`, implémenté par `CompositeLogger` qui dispatch vers N sinks.

```ts
// src/domain/shared/logger.ts
export interface Logger {
  info(context: Record<string, unknown>, message: string): void
  warn(context: Record<string, unknown>, message: string): void
  error(context: Record<string, unknown>, message: string): void
  debug(context: Record<string, unknown>, message: string): void
}
```

```ts
// src/platform/logging/composite-logger.ts
export class CompositeLogger implements Logger {
  constructor(private readonly sinks: LogSink[]) {}
  info(context, msg)  { this.emit('info',  context, msg) }
  warn(context, msg)  { this.emit('warn',  context, msg) }
  error(context, msg) { this.emit('error', context, msg) }
  debug(context, msg) { this.emit('debug', context, msg) }
  private emit(level, context, message) {
    const entry = { level, timestamp: new Date(), message, context }
    for (const sink of this.sinks) sink.write(entry)
  }
}
```

**Sinks initiaux** :
- `PinoStdoutSink` — pino vers stdout (JSON en prod, pretty en dev)
- `DatabaseSink` — insert dans `application_log`, best-effort (jamais crash)

**Wiring** : fait dans `shared.module.ts` via une factory `buildLogger(config)` qui compose les sinks selon `config.LOG_TO_DATABASE`. Chaque test/environnement peut avoir sa propre composition en branchant d'autres sinks sans toucher au reste du code.

**Évolution future** : ajouter un sink APM / HTTP vers app satellite de logs = nouvelle ligne dans `buildLogger`. Zéro refacto côté métier.

### 6.5 Config — Zod validée au boot

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

### 6.6 Pattern d'injection `Inject<K>` dans les classes

Chaque module expose un alias `Inject<K>` typé, construit depuis son `ExtractScope`. Les classes qui appartiennent au module consomment uniquement les clés dont elles ont besoin — précisément typées, auto-complétées, sans re-déclarer la signature.

```ts
// Dans authentication.module.ts
type Scope = ExtractScope<typeof authenticationModule>
export type Inject<K extends keyof Scope> = Pick<Scope, K>
```

**Usage dans un repository :**
```ts
export class ApiKeyPrismaRepository implements ApiKeyRepository {
  constructor(private readonly deps: Inject<'prisma'>) {}
  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const row = await this.deps.prisma.getInstance().api_key.findUnique({ where: { key_hash: keyHash } })
    return row ? ApiKeyMapper.toDomain(row) : null
  }
}
```

**Usage dans un handler qui a plusieurs deps :**
```ts
export class CreateSessionHandler {
  constructor(
    private readonly deps: Inject<'utilisateurRepository' | 'tokenSigner' | 'transaction' | 'logger'>,
  ) {}

  async executer(command: CreateSessionCommand): Promise<Result<Session, AuthenticationError>> {
    return this.deps.transaction.run(async () => {
      // TODO: intégrer ProConnect (ticket suivant)
      return err(new NotImplementedError('ProConnect integration — voir ticket suivant'))
    })
  }
}
```

**Règles à figer :**
- Toute classe instanciée par Awilix (`asModuleClass`) **déclare ses deps via `Inject<K>`**, jamais via un type ad-hoc inline
- Une classe ne peut consommer **que des clés de son propre scope** (shared deps + cradle du module) — le typage de `Inject<K>` le force à la compilation
- Dans un fichier `*.repository.ts` ou `*.handler.ts`, l'import de `Inject` pointe vers le `module.ts` du module qui déclare ces dépendances
- **Pas d'abus** : `Inject<'a' | 'b' | 'c' | 'd' | 'e' | 'f'>` signale qu'une classe fait trop de choses — à découper en deux

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
- Pas de variables à 1 ou 2 caractères (ex: `error` et non `e`, `event` et non `ev`)
- Préférer `$Enums` de Prisma pour les enums DB
- `expect(result).toEqual([{...}])` plutôt que `toHaveLength + index access`

---

## 8. API design — règles "agent-ready"

L'API sera consommée par un **agent IA satellite** (et plus tard par le webapp). Chaque endpoint doit donc être un "tool potentiel" pour un LLM.

### 8.1 Règles non-négociables

1. **Atomicité** — un endpoint, une responsabilité. Pas de méga-endpoint multi-usage.
2. **Descriptions riches** — `.describe()` obligatoire sur chaque champ Zod. `summary` + `description` ≥ 1 phrase obligatoires sur chaque route, disant **quand** utiliser cet endpoint.
3. **Outputs structurés** — JSON plat, pas de string multilignes, pas de HATEOAS.
4. **Filtres combinables** — pas de vues en dur via URLs différentes. Un endpoint de listing, plusieurs filtres combinables (dont un `view` si besoin).
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
7. **Idempotence partout où possible** — `PUT /entities/{id}` plutôt que `POST /entities/duplicate`. Support `Idempotency-Key` header sur mutations critiques (plus tard).
8. **Pas d'`_output_instructions`** — l'agent satellite gère ses propres instructions côté lui. L'API reste pur REST/JSON.

### 8.2 Organisation OpenAPI
- **1 tag = 1 entité** (`Entity`, `Indicateur`, `Territoire`, `Health`, `Authentication`…)
- Schémas Zod **locaux aux routes** quand spécifiques, **partagés dans `src/platform/http/schemas/`** quand réutilisés
- Chaque schéma Zod nommé via `.openapi('NomDuSchema')` → référencement propre dans le JSON
- `/api/openapi.json` et `/api/docs` **accessibles en prod aussi** (objectif produit)

### 8.3 Pattern d'une route

```ts
// src/platform/http/routes/create-session.route.ts
const CreateSessionInputSchema = z.object({
  id_token: z.string().describe("id_token OIDC émis par ProConnect"),
}).openapi('CreateSessionInput')

const SessionSchema = z.object({
  jwt: z.string(),
  utilisateur: UtilisateurSchema,
}).openapi('Session')

const createSessionRoute = createRoute({
  method: 'post',
  path: '/auth/sessions',
  tags: ['Authentication'],
  summary: "Échange un id_token ProConnect contre un JWT interne",
  description: "Valide la signature de l'id_token via JWKS ProConnect, upsert l'utilisateur en DB, et retourne un JWT interne HS256.",
  request: { body: { content: { 'application/json': { schema: CreateSessionInputSchema } } } },
  responses: {
    201: { description: 'Session créée', content: { 'application/json': { schema: SessionSchema } } },
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
      context.json({
        jwt: session.jwt,
        utilisateur: UtilisateurMapper.toHttp(session.utilisateur),
      }, 201),
    )
  })
}
```

Pour le scaffolding ProConnect, le handler retourne `err(new NotImplementedError(...))` dont le `kind = 'not-implemented'` mappe sur **501** via la table de mapping HTTP (cf. section 16.2).

---

## 9. Authentification

### 9.1 Deux stratégies parallèles, middleware unifié

Un seul middleware `auth.middleware.ts` détecte le format du Bearer token et délègue à la bonne stratégie :
- Token préfixé `pmb_live_` ou `pmb_test_` → **API Key** (agents/services). Le préfixe est purement informatif (identifie l'environnement visuellement pour les devs/ops). Le middleware traite les deux strictement pareil — **aucune vérification de cohérence préfixe / NODE_ENV**, volontairement, car un même token pourrait être utilisé pour tester prod en bouchon local.
- Token JWT (3 segments séparés par `.`) → **session user**

Le middleware pose sur le contexte Hono :
- `c.set('auth', { type: 'api-key', apiKey })`
- `c.set('auth', { type: 'user', utilisateur, jwt })`

### 9.2 API Keys (impl complète dans ce ticket)

**Convention du préfixe :**
- `pmb_live_*` — clés pour les environnements de production (prod)
- `pmb_test_*` — clés pour tous les autres environnements (dev, staging, test, CI)

Le préfixe est purement informatif (aide visuelle à identifier l'environnement). Le middleware d'auth traite les deux pareil. Le CLI `create-api-key` prend un flag `--env live|test` qui détermine le préfixe généré.

**Choix du hash : SHA-256, pas bcrypt**

Les API keys sont **hashées avec SHA-256 déterministe**, pas bcrypt. Raison :
- bcrypt est non-déterministe (salt unique par hash) → impossible de faire un `WHERE key_hash = X` pour lookup. Il faudrait un `findMany` + `bcrypt.compare` sur chaque row : inacceptable en perf.
- Les API keys ont une **haute entropie** (256 bits générés via `crypto.randomBytes`) → SHA-256 sans salt est suffisamment sécurisé (pas de rainbow table possible).
- Lookup `WHERE key_hash = sha256(token)` + index B-tree = O(1) à toute échelle.

bcrypt serait pertinent pour des passwords user (faible entropie), mais on n'a **pas de password** côté backend (auth users = ProConnect). Donc bcrypt est globalement inutile pour pilote-mb-core.

**Table Prisma :**
```prisma
model api_key {
  id                        String    @id @default(uuid())
  nom                       String
  key_hash                  String    @unique  // SHA-256 hex du token complet
  key_prefix                String    // ex: "pmb_live_abc" — pour affichage admin, jamais le token complet
  scopes                    String[]
  active                    Boolean   @default(true)
  date_creation             DateTime  @default(now())
  date_derniere_utilisation DateTime?
}
```

**Ports dans `authentication/domain/api-key/` :**
```ts
// api-key-hasher.ts — contrat domain (pas d'impl)
export interface ApiKeyHasher {
  hash(token: string): string              // déterministe
}

// token-generator.ts — contrat domain
export interface TokenGenerator {
  generate(prefix: 'pmb_live_' | 'pmb_test_'): string
}
```

**Adapters dans `authentication/infrastructure/crypto/` :**
```ts
// sha256-api-key-hasher.ts
export class Sha256ApiKeyHasher implements ApiKeyHasher {
  hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}

// crypto-token-generator.ts
export class CryptoTokenGenerator implements TokenGenerator {
  generate(prefix: 'pmb_live_' | 'pmb_test_'): string {
    return `${prefix}${crypto.randomBytes(32).toString('hex')}`
  }
}
```

**AggregateRoot `ApiKey` dans `authentication/domain/api-key/api-key.ts` :**
```ts
import { AggregateRoot, Clock, err, ok, Result } from '@/shared-kernel/...'
import { ApiKeyCreatedEvent } from './events/api-key-created.event'
import { ApiKeyRevokedEvent } from './events/api-key-revoked.event'
import { InvalidApiKeyNameError } from './errors/invalid-api-key-name.error'
import { ApiKeyScopesRequiredError } from './errors/api-key-scopes-required.error'
import { ApiKeyAlreadyRevokedError } from './errors/api-key-already-revoked.error'

export class ApiKey extends AggregateRoot<ApiKeyId> {
  private constructor(
    id: ApiKeyId,
    private readonly nom: string,
    private readonly keyHash: string,
    private readonly keyPrefix: string,
    private readonly scopes: ReadonlyArray<Scope>,
    private active: boolean,
    private readonly dateCreation: Date,
  ) { super(id) }

  static create(params: {
    nom: string
    scopes: Scope[]
    environment: 'live' | 'test'
    hasher: ApiKeyHasher
    tokenGenerator: TokenGenerator
    clock: Clock
  }): Result<{ aggregate: ApiKey; rawToken: string }, DomainError> {
    if (params.nom.trim() === '') return err(new InvalidApiKeyNameError())
    if (params.scopes.length === 0) return err(new ApiKeyScopesRequiredError())

    const prefix = params.environment === 'live' ? 'pmb_live_' : 'pmb_test_'
    const rawToken = params.tokenGenerator.generate(prefix)
    const keyHash = params.hasher.hash(rawToken)
    const keyPrefix = rawToken.slice(0, 12)

    const now = params.clock.now()
    const aggregate = new ApiKey(
      ApiKeyId.generate(),
      params.nom,
      keyHash,
      keyPrefix,
      params.scopes,
      true,
      now,
    )
    aggregate.recordEvent(new ApiKeyCreatedEvent(aggregate.id.valueOf(), params.nom, now))
    return ok({ aggregate, rawToken })
  }

  static reconstitute(row: ApiKeyPersistenceShape): ApiKey {
    return new ApiKey(/* ... depuis row ... */)
  }

  revoke(clock: Clock): Result<void, DomainError> {
    if (!this.active) return err(new ApiKeyAlreadyRevokedError())
    this.active = false
    this.recordEvent(new ApiKeyRevokedEvent(this.id.valueOf(), clock.now()))
    return ok(undefined)
  }

  estActive(): boolean { return this.active }
  hasScope(scope: Scope): boolean { return this.scopes.some((s) => s.equals(scope)) }
}
```

**Flow de vérification (middleware auth) :**
1. Le client envoie `Authorization: Bearer pmb_live_xxxxxxxx...`
2. Le middleware appelle `authenticationFacade.verifyApiKey(token)` (via Published Language)
3. La facade délègue au `VerifyApiKeyHandler` qui : hash le token, lookup via `ApiKeyRepository.findByKeyHash()`, vérifie `estActive()`, retourne un `ApiKeyReference` ou null
4. Le middleware pose `c.set('auth', { type: 'api-key', reference })` ou répond 401 via `app.onError` (lève `HTTPException`)

**Création via CLI :**
```bash
pnpm create-api-key --nom "agent-satellite-prod" --env live --scopes "entities:read,indicateurs:read"
# Le script :
#   1. Résout `authenticationModule` + `platformModule` via buildAppContainer()
#   2. Appelle ApiKey.create(...) avec les deps injectées
#   3. Appelle apiKeyRepository.save(aggregate) → déclenche ApiKeyCreatedEvent → AuditLogEventHandler
#   4. Affiche rawToken UNE SEULE FOIS en stdout
```

### 9.3 Authentification user — ProConnect (scaffolding seul)

**Décision stratégique** : pas de login intégré (pas de table password, pas de `POST /auth/login`). L'authentification user passe exclusivement par **ProConnect** (IdP gouvernemental, ex-AgentConnect). Le backend valide les id_token émis par ProConnect et ré-émet son propre JWT interne.

**Pourquoi ré-émettre un JWT interne plutôt qu'utiliser directement l'id_token ProConnect ?**
- Les specs OIDC recommandent que l'id_token reste côté client
- Notre JWT interne porte **nos rôles + notre `statut_acces`** — concepts applicatifs que ProConnect ne connaît pas
- Révocation possible côté backend (via `token_version` sur l'utilisateur)
- Performance : pas besoin d'appeler ProConnect à chaque requête (JWKS cached)

**Flow complet (à implémenter dans le ticket ProConnect) :**
```
1. User clique "Se connecter avec ProConnect" sur webapp
2. Webapp redirige vers ProConnect (OAuth Authorization Code Flow + PKCE)
3. ProConnect authentifie, redirige vers webapp avec ?code=xxx
4. Webapp échange le code contre un id_token (appel ProConnect /token)
5. Webapp → POST /auth/sessions { id_token }
6. pilote-mb-core :
   a. Valide signature id_token via JWKS ProConnect (cached)
   b. Extrait sub, email, given_name, family_name
   c. Upsert utilisateur en DB (clé : sub_proconnect)
      - si nouveau : statut_acces = 'EN_ATTENTE_ACCES'
      - sinon : statut_acces préservé
   d. Émet un JWT interne HS256 (payload: utilisateur_id, statut_acces, roles, token_version)
   e. Retourne { jwt, utilisateur }
7. Webapp stocke le JWT interne et l'utilise pour toutes les requêtes suivantes
```

**Page "Demander l'accès à Pilote"** : un utilisateur ProConnect qui se connecte pour la première fois arrive avec `statut_acces = 'EN_ATTENTE_ACCES'`. Le JWT est émis mais les routes métier sont bloquées par un middleware de statut. Le front route l'utilisateur vers une page de justification (formulaire → notif email admin). Un admin approuve/refuse ensuite via `PATCH /auth/utilisateurs/{id}/acces`.

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

**Ce qui est livré dans ce ticket (scaffolding)** :
- Table `utilisateur` + enum `statut_acces_enum`
- Value object `StatutAcces` et domain model `Utilisateur`
- Repository Prisma `UtilisateurPrismaRepository`
- Port `TokenSigner` + adapter `JsonwebtokenTokenSigner` (vérif et émission JWT interne **fonctionnels**, testés)
- Middleware `auth.middleware.ts` avec dispatch API Key / JWT (branche JWT valide la signature, résout l'utilisateur). **Note** : tant que `POST /auth/sessions` retourne 501, aucun JWT valide ne peut être émis par le backend — la branche JWT du middleware est testée via des tokens signés manuellement avec `JWT_SECRET` dans les tests d'intégration.
- `CreateSessionHandler` créé avec la structure CQRS complète, mais son impl contient un `TODO: intégrer ProConnect` et retourne `err(new NotImplementedError(...))` (kind `'not-implemented'` → 501 via `respondWithResult`)
- Route `POST /auth/sessions` retourne 501 Not Implemented avec message clair pointant le ticket suivant

**Ce qui est explicitement hors scope (ticket suivant)** :
- Intégration `openid-client` + validation JWKS ProConnect
- Upsert utilisateur depuis claims ProConnect
- Endpoints `GET /auth/me`, `POST /auth/acces/demande`, `PATCH /auth/utilisateurs/{id}/acces`
- Middleware de blocage pour `statut_acces = EN_ATTENTE_ACCES`
- Page "Demander l'accès" côté webapp

### 9.4 Routes publiques (exemptées d'auth)
- `GET /health`
- `GET /api/openapi.json`
- `GET /api/docs`

Toutes les autres routes nécessitent une auth valide (API Key ou JWT user).

---

## 10. Tests

### 10.1 Stratégie globale
- **Vitest** avec `test.sequence.concurrent: true` → parallélisme maximum dès le départ
- Tests co-localisés : `foo.ts` + `foo.test.ts`
- Pas de séparation artificielle unit/integration : un test qui hit la DB est OK tant qu'il est dans `withTestTransaction`

### 10.2 withTestTransaction

Le helper initialise le container applicatif via `buildAppContainer()` (singleton partagé entre tests), ouvre une vraie transaction Prisma via le `PrismaPilote` injecté, pose la transaction dans le `txStore` AsyncLocalStorage, exécute le test, puis force un rollback via une exception contrôlée.

```ts
// src/test/with-test-transaction.ts
import { buildAppContainer } from '@/platform/container/build-app-container'
import { txStore } from '@/platform/persistence/prisma/prisma-transaction'
import { PrismaPilote } from '@/platform/persistence/prisma/prisma-pilote'
import { TestContext } from './test-context'

class RollbackSignal extends Error {}

// Un seul container pour toute la suite de tests (lazy, thread-safe via Vitest worker).
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
    const platformContainer = getContainer('platform')
    const prismaPilote = platformContainer.resolve<PrismaPilote>('prisma')
    const prismaClient = prismaPilote.getInstance()   // client racine (pas de tx active ici)

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

`TestContext` est un wrapper léger autour de `getContainer` qui expose des raccourcis typés :
```ts
// src/test/test-context.ts
export class TestContext {
  constructor(private readonly getContainer: ReturnType<typeof buildAppContainer>['getContainer']) {}

  resolveRepository<T>(moduleName: ModuleName, key: string): T {
    return this.getContainer(moduleName).resolve<T>(key)
  }
  resolveHandler<T>(moduleName: ModuleName, key: string): T {
    return this.getContainer(moduleName).resolve<T>(key)
  }
}
```

**Usage :**
```ts
describe('ApiKeyPrismaRepository', () => {
  it("retourne null si la clé n'existe pas", withTestTransaction(async (testContext) => {
    // Given
    const repository = testContext.resolveRepository<ApiKeyRepository>('apiKeyRepository')
    // When
    const result = await repository.findByKeyHash('inexistante')
    // Then
    expect(result).toBeNull()
  }))
})
```

### 10.3 Factories

Un fichier par entité dans `src/test/fixtures/`. Ce sont des **fonctions utilitaires**, pas des classes injectées par Awilix.

**Exception documentée à la règle 6.2** : les fixtures peuvent utiliser `getPrisma()` directement (import depuis `prisma-transaction.ts`). Raison : les fixtures ne sont pas instanciées via Awilix et on veut éviter le boilerplate d'injection pour des helpers de test. `getPrisma()` retourne automatiquement la transaction courante (celle de `withTestTransaction`) ou le client racine.

```ts
// src/test/fixtures/api-key.fixture.ts
import { getPrisma } from '@/platform/persistence/prisma/prisma-transaction'
import { randomUUID, createHash, randomBytes } from 'node:crypto'

export async function createApiKeyFixture(
  overrides: Partial<Prisma.api_keyUncheckedCreateInput> = {},
) {
  const rawToken = overrides.key_hash
    ? undefined   // caller a fourni un hash custom
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

Les factories marchent à la fois en test (dans la tx ouverte par `withTestTransaction`) et en prod/scripts (hors tx) sans adaptation.

### 10.4 Règles non-négociables de test

- ❌ Pas de mutation DB dans `beforeAll` / `afterAll`
- ❌ Pas d'override des timeouts Prisma par défaut (5s tx / 2s maxWait). Si un test dépasse, c'est un smell à corriger.
- ✅ Chaque test crée ses propres données via factories dans sa tx
- ✅ `connection_limit` Prisma aligné avec `maxThreads` Vitest
- ✅ Postgres de test lancé avec `max_connections=500 -c shared_buffers=256MB`

### 10.5 Configuration Vitest

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

---

## 11. Infrastructure

### 11.1 Docker-compose

Basé sur `apps/pilote-ppg/docker-compose.yml`, adapté :
- 2 bases PostgreSQL : `postgres` (local dev, port 5434) et `postgres_test` (port 5435) — ports distincts de pilote-ppg (5432/5433) pour permettre de tourner les deux en parallèle
- Postgres test démarré avec `max_connections=500 -c shared_buffers=256MB`
- Pas de traefik initial (pas de routage nécessaire pour un backend seul)
- Volume persisté sur `postgres` uniquement (pas sur `postgres_test`)

### 11.2 Prisma schema initial

Tables minimales nécessaires pour healthcheck + auth :

**`api_key`** — définie en section 9.2 (avec `key_hash` SHA-256 + `key_prefix`).

**`utilisateur`** + enum `statut_acces_enum` — définis en section 9.3.

**`application_log`** — destination du `DatabaseSink` (reprise minimaliste du schema pilote-ppg) :
```prisma
model application_log {
  id         BigInt                     @id @default(autoincrement())
  level      application_log_level_enum
  categorie  String                     @default("systeme")
  message    String
  contexte   Json?
  source     String?
  duree_ms   Int?
  request_id String?                    // corrélation requête (cf. section 16)
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
      "@/shared-kernel/*": ["src/shared-kernel/*"],
      "@/platform/*": ["src/platform/*"],
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
- `no-restricted-syntax` interdisant `export default` (whitelist pour fichiers de config tierces)
- `no-restricted-syntax` interdisant `new Date()` dans `src/**/domain/**` et `src/**/application/**` (on doit passer par le port `Clock` injecté)
- `no-restricted-syntax` interdisant `new <AggregateRoot>()` sauf dans le fichier de définition de l'agrégat et les tests (force le passage par les static factories `Entity.create()` et `Entity.reconstitute()`)
- Convention no-barrel documentée dans CLAUDE.md
- Règles TypeScript strict standard

**dependency-cruiser — règles d'architecture (obligatoires, run en CI) :**

Fichier `.dependency-cruiser.cjs` avec les règles suivantes :

1. **Interdire les imports cross-BC vers les internals** :
   ```js
   {
     name: 'no-cross-bc-internals',
     severity: 'error',
     from: { path: '^src/(?!shared-kernel|platform|test)(?<bc>[^/]+)/' },
     to: {
       path: '^src/(?!shared-kernel|platform|test)(?<targetBc>[^/]+)/',
       pathNot: [
         '^src/$1/',                          // même BC autorisé
         '^src/[^/]+/public/',                // public/ des autres BCs autorisé
       ],
     },
   }
   ```

2. **Interdire les imports de `<bc>.module.ts` depuis un autre BC** (seul `build-app-container.ts` peut le faire).

3. **Interdire les imports de `platform/` ou d'un BC dans `shared-kernel/`** (shared-kernel reste domain-pur).

4. **Interdire les imports de `infrastructure/` d'un BC vers `domain/` ou `application/` d'un autre BC** (redondant avec #1 mais plus explicite).

5. **Interdire les imports depuis `<bc>/public/` vers le reste du BC** (le public ne doit dépendre que de `shared-kernel/`).

`dependency-cruiser` est appelé dans le script `lint` (`depcruise --config .dependency-cruiser.cjs src`).

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

Les workflows vivent dans `.github/workflows/` à la racine. Deux éléments clés déjà en place que pilote-mb-core réutilise :
- **Workflow unique `testAndLint.yml`** : détecte les apps impactées via `dorny/paths-filter` et ne lance les jobs que pour les apps concernées.
- **Action composite réutilisable `.github/actions/setupNodeAndPackages`** : Setup pnpm + Node (version injectée) + `pnpm install --frozen-lockfile` cached.

Cette organisation évite de dupliquer du setup entre apps et limite les builds inutiles sur les PR qui ne touchent qu'une seule app du monorepo.

### 12.2 Ajouts à `testAndLint.yml`

**Étendre la détection de changements :**
```yaml
jobs:
  changes:
    name: Detect changes
    runs-on: ubuntu-latest
    outputs:
      pilote-ppg: ${{ steps.filter.outputs.pilote-ppg }}
      pilote-ppg-data-management: ${{ steps.filter.outputs.pilote-ppg-data-management }}
      pilote-mb-core: ${{ steps.filter.outputs.pilote-mb-core }}      # NOUVEAU
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
            pilote-mb-core:                                           # NOUVEAU
              - 'apps/pilote-mb-core/**'
              - 'package.json'
              - 'pnpm-lock.yaml'
```

**Ajouter deux jobs pour pilote-mb-core :**

```yaml
  test-mb-core:
    name: Run tests (pilote-mb-core)
    needs: changes
    if: needs.changes.outputs['pilote-mb-core'] == 'true'
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
        run: pnpm -F @pilote-mb/core prisma migrate deploy
      - name: Run tests
        run: pnpm -F @pilote-mb/core test

  lint-mb-core:
    name: Run linters (pilote-mb-core)
    needs: changes
    if: needs.changes.outputs['pilote-mb-core'] == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setupNodeAndPackages
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Run lint
        run: pnpm -F @pilote-mb/core lint
```

### 12.3 Points importants

- **Service Postgres en port 5435** (même port que `postgres_test` du docker-compose local) pour rester cohérent. Valeurs de user/password standard `postgres/postgres` — distinctes de la DB de dev, jamais des secrets.
- **Pas d'augmentation de `max_connections`** côté service Postgres GitHub Actions (non configurable directement via la syntaxe `services:`). Le parallélisme Vitest est réglé par `connection_limit=50` sur `DATABASE_URL`. Si on voit des timeouts `maxWait` en CI, on baissera `maxThreads` Vitest ou on passera à un container Postgres custom.
- **`LOG_TO_DATABASE: false` en CI** — on évite que le `DatabaseSink` écrive en DB pendant les tests (pollution + conflits de transactions).
- **`prisma migrate deploy`** avant `pnpm test` — nécessaire pour que le schéma soit présent dans le Postgres éphémère du job.
- **Pas de job E2E** pour l'instant — pas de front, pas de Playwright.
- **Pas de workflow `e2e.yml` adapté** à pilote-mb-core tant qu'il n'y a pas de webapp. Le jour où `pilote-mb-webapp` arrive, on ajoutera un workflow dédié (scheduled + manuel) comme le fait pilote-ppg.

### 12.4 Required status checks

Sur GitHub, configurer `test-mb-core` et `lint-mb-core` comme **required status checks** sur la branche `dev` (et `main` si applicable) — étape manuelle côté settings du repo, pas dans le fichier de workflow. À noter dans le ticket.

### 12.5 Scripts `package.json` attendus par la CI

Pour que les jobs fonctionnent, `apps/pilote-mb-core/package.json` doit exposer :
- `"test": "vitest run"` (et non `vitest` en watch)
- `"lint": "eslint src && tsc --noEmit"`
- Prisma accessible via `pnpm -F @pilote-mb/core prisma ...` (standard via la dépendance `prisma` en devDep)

---

## 13. Scope précis de ce ticket

### Livrables

**Fondations projet :**
1. `apps/pilote-mb-core/` enregistré dans le monorepo (`pnpm-workspace.yaml`)
2. Fichiers de config : `package.json`, `tsconfig.json`, `vitest.config.ts`, `.eslintrc.cjs`, `.prettierrc`, `.dependency-cruiser.cjs`, `docker-compose.yml`
3. Schema Prisma + première migration (`0001_init`) incluant `api_key`, `utilisateur`, `application_log`
4. Config Zod-validée (`src/config.ts`)

**shared-kernel (primitives DDD) :**
5. `AggregateRoot<TId>` base class + `ValueObject<T>` base class
6. `DomainEvent` interface + `DomainEventPublisher` port + `DomainEventHandler` interface
7. `DomainError` + `DomainErrorKind` (avec `'not-implemented'`)
8. `Result` (re-export neverthrow) + `Uuid` VO
9. Ports : `Clock`, `Transaction`, `Logger`

**BC platform (infra transverse) :**
10. **Module-system** adapté de pilote-ppg (`define-module`, `boot-modules`, `module-names`) + `platformModule` + `build-app-container`
11. **`PrismaPilote` wrapper** + `PrismaTransaction` + `txStore` AsyncLocalStorage
12. Logger sinks composables : `CompositeLogger` + `PinoStdoutSink` + `DatabaseSink`
13. **Event bus** : `InMemoryDomainEventPublisher` + `AuditLogEventHandler` (persiste tous les events dans `application_log`)
14. Clock : `SystemClock` adapter
15. Middlewares HTTP : `request-id`, `logger`, `auth` (consomme `AuthenticationFacade` du BC `authentication`), `require-scope`, `error-handler`
16. **Error handling complet** : mapping `kind → HTTP status`, `app.onError` + `app.notFound`, helper `respondWithResult`, `ErrorSchema` partagé
17. **App Hono** : `buildApp` + Swagger UI (`/api/docs`) + JSON (`/api/openapi.json`)

**BC authentication (DDD complet) :**
18. Domain `api-key` : AggregateRoot `ApiKey` avec factory `create()` + `revoke()`, VOs `ApiKeyId` / `Scope`, ports `ApiKeyHasher` / `TokenGenerator`, repository interface, 3 errors (`InvalidApiKeyNameError`, `ApiKeyScopesRequiredError`, `ApiKeyAlreadyRevokedError`), 2 events (`ApiKeyCreatedEvent`, `ApiKeyRevokedEvent`)
19. Domain `utilisateur` : AggregateRoot `Utilisateur` (factory partiellement stubée en attendant ProConnect), VOs `UtilisateurId` / `Email` / `StatutAcces`, repository interface, 1 event (`UtilisateurCreatedEvent`)
20. Infrastructure : `ApiKeyPrismaRepository` + mapper, `UtilisateurPrismaRepository` + mapper, adapters `Sha256ApiKeyHasher` / `CryptoTokenGenerator` / `JsonwebtokenTokenSigner`, scaffolding `ProconnectClient`, CLI `create-api-key.ts`
21. Application : `VerifyApiKeyHandler`, `VerifyJwtHandler`, `CreateSessionHandler` stub (kind `not-implemented`), `AuthenticationFacadeImpl`
22. **Published Language** : `UtilisateurReference`, `ApiKeyReference`, `AuthenticationFacade` interface
23. Route HTTP `POST /auth/sessions` (retourne 501 via `respondWithResult`)
24. `authentication.module.ts` avec cradle typé + export de `authenticationFacade`

**BC healthcheck :**
25. `CheckHealthHandler` (ping DB via `SELECT 1`), route `GET /health` (publique)
26. `healthcheck.module.ts`

**Tests & helpers :**
27. `vitest.setup.ts`, `withTestTransaction`, `TestContext`, `FakeClock`
28. Fixtures : `api-key.fixture.ts`, `utilisateur.fixture.ts`

**Documentation :**
29. CLAUDE.md du projet (reprend les règles de ce design)
30. `docs/architecture/decisions/0001-record-architecture-decisions.md` (ADR base)
31. `docs/architecture/decisions/0002-architecture-init-pilote-mb-core.md` (résume ce design)

**CI :**
32. Mise à jour de `.github/workflows/testAndLint.yml` (ajout filter + jobs `test-mb-core` + `lint-mb-core`)

---

### Hors scope (tickets suivants — notes de traçabilité)

La liste "Hors scope" est mise à jour ci-dessous avec les précisions DDD.

### Hors scope (tickets suivants)

**BCs à créer :**
- BC `pilotage` (Core) : `Entity` AggregateRoot paramétrable, `Indicateur` AggregateRoot, collecte de données, facades + PublishedLanguage
- BC `parametrage` (Core) : méta-modèle Marque Blanche (définition des types d'entités/indicateurs spécifiques à chaque client)
- BC `territorialisation` (Supporting) : hiérarchie territoriale, résolution de codes
- BC `rapport` (Supporting) : génération de bilans, export CSV/XLSX
- BC `notification` (Generic) : emails via Brevo
- BC `audit` (Generic) : historique persisté (consommateur des Domain Events)

**Complétions du BC authentication :**
- **Intégration ProConnect** (flow OIDC complet, validation JWKS, upsert user depuis claims, `CreateSessionHandler` fonctionnel)
- Endpoints `GET /auth/me`, `POST /auth/acces/demande`, `PATCH /auth/utilisateurs/{id}/acces`
- Middleware de blocage pour `statut_acces = EN_ATTENTE_ACCES`
- Refresh tokens (si nécessaire quand le front sera en place)

**Autres hors scope :**
- Front `pilote-mb-webapp` (Vite + React + TanStack Query)
- CI/CD (déploiement, pipeline de release)
- Monitoring/APM (on reste sur DatabaseSink en attendant contractualisation)
- Page "Demander l'accès à Pilote" (dépend du ticket ProConnect)
- Gestion des rôles fine-grained / RBAC avancé

---

## 14. Questions ouvertes / décisions différées

- **Nom du schéma Postgres** : on reste sur `public` par défaut. Multi-tenant (un schéma par client) = ticket dédié si pertinent un jour.
- **Refresh tokens** : pas nécessaire pour le MVP, TTL de 8h suffit. À revoir quand le front sera en place.
- **Idempotency-Key header** : convention prête à être ajoutée, mais pas implémentée tant qu'on n'a pas de mutation critique.
- **Règle lint cross-layer** : pas d'outillage automatique au démarrage, revue manuelle. À ajouter si la convention dérape.
- **ProConnect en maintenance** : au moment de la rédaction de ce design, ProConnect est en maintenance, ce qui justifie le scaffolding différé. Le ticket d'intégration sera lancé dès le retour du service.
- **Luxon différé** : le port `Clock` retourne `Date` native à l'init. Luxon sera introduit dans le ticket du premier BC qui manipule beaucoup de dates (probablement `pilotage` pour les jalons ou `rapport` pour les périodes/formatage FR). À ce moment, choix entre "Luxon en complément" ou "migrer `Clock.now()` vers `DateTime`".

---

## 15. Critères de succès de l'init

- ✅ `pnpm dev` lance le serveur avec logs pretty
- ✅ `curl http://localhost:3000/health` retourne 200 avec body JSON
- ✅ `curl http://localhost:3000/api/openapi.json` retourne un OpenAPI 3.1 valide
- ✅ `http://localhost:3000/api/docs` affiche Swagger UI avec les routes documentées
- ✅ `curl -X POST http://localhost:3000/auth/sessions ...` retourne 501 avec message explicite
- ✅ Une requête sur une route protégée sans Bearer → 401 via `app.onError` (pas de if manuel dans la route)
- ✅ Une requête avec un `pmb_live_*` valide → 200 (si scope OK)
- ✅ Une route qui throw en interne → 500 via `app.onError`, stack loggué mais jamais exposé dans la réponse
- ✅ Une route inexistante → 404 avec `ErrorSchema { code: 'ROUTE_NOT_FOUND', ... }` via `app.notFound`
- ✅ Toutes les réponses d'erreur suivent le format `ErrorSchema { code, message, details? }` — zéro exception
- ✅ Les tests d'intégration du healthcheck et des API keys passent, en parallèle
- ✅ `pnpm lint` passe (eslint + tsc --noEmit + dependency-cruiser)
- ✅ CLAUDE.md et ADR 0002 en place
- ✅ Les jobs CI `test-mb-core` et `lint-mb-core` passent vert sur la PR

**Critères DDD spécifiques :**
- ✅ Créer une API key via le CLI **publie** un `ApiKeyCreatedEvent`, **persisté** dans `application_log` via `AuditLogEventHandler`
- ✅ Tenter d'instancier `new ApiKey(...)` en dehors du fichier `api-key.ts` ou d'un test **échoue au lint** (règle ESLint `no-restricted-syntax`)
- ✅ Importer `ApiKeyRepository` depuis en dehors du BC `authentication` **échoue à `depcruise`**
- ✅ Importer `UtilisateurReference` depuis `@/authentication/public/utilisateur-reference` **fonctionne** depuis n'importe quel BC
- ✅ Dans un test, remplacer `Clock` par `FakeClock` dans le container **permet de figer les timestamps** émis par les agrégats
- ✅ Le Context Map de la section 5.3 est à jour avec ce qui est réellement implémenté

---

## 16. Gestion des erreurs

L'erreur doit remonter du domaine à l'utilisateur avec un format stable, un statut HTTP cohérent, et un logging adapté. L'architecture est en 4 niveaux.

### 16.1 Niveau 1 — `DomainError` typée (dans `domain/shared/`)

Base abstraite portée par toutes les erreurs métier. Chaque sous-classe déclare un `code` stable (pour les consommateurs API/agents) et un `kind` (pour le mapping HTTP).

```ts
// src/domain/shared/domain-error.ts
export type DomainErrorKind =
  | 'not-found'
  | 'validation'
  | 'conflict'
  | 'forbidden'
  | 'unauthorized'
  | 'not-implemented'
  | 'internal'

export abstract class DomainError extends Error {
  abstract readonly code: string
  abstract readonly kind: DomainErrorKind
  readonly details?: Record<string, unknown>

  constructor(message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.details = details
  }
}

// Exemples concrets (vivent dans les sous-dossiers domain/<entity>/errors/)
export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND'
  readonly kind = 'not-found' as const
}

export class InvalidIndicateurTypeError extends DomainError {
  readonly code = 'INVALID_INDICATEUR_TYPE'
  readonly kind = 'validation' as const
}
```

**Règle** : toute erreur métier = une classe dédiée. Jamais de `throw new Error('...')` dans le domain.

### 16.2 Niveau 2 — Mapping `kind` → HTTP status

Table unique, centralisée, testable isolément :

```ts
// src/platform/http/error-mapping.ts
const KIND_TO_STATUS: Record<DomainErrorKind, number> = {
  'not-found':       404,
  'validation':      400,
  'conflict':        409,
  'forbidden':       403,
  'unauthorized':    401,
  'not-implemented': 501,
  'internal':        500,
}

export const mapDomainErrorToHttpStatus = (error: DomainError): number =>
  KIND_TO_STATUS[error.kind]
```

### 16.3 Niveau 3 — Error boundary global via `app.onError`

Hono expose un hook `app.onError((error, context) => ...)` qui intercepte **tout throw non attrapé** dans l'app — c'est l'error-boundary qui wrap les routes. Il gère quatre cas :

```ts
// src/platform/http/middlewares/error-handler.middleware.ts
export function registerErrorHandler(app: OpenAPIHono, container: AwilixContainer) {
  const logger = container.resolve<Logger>('logger')

  app.onError((error, context) => {
    const requestId = context.get('requestId') ?? undefined
    const url = context.req.url
    const method = context.req.method

    // 1. DomainError catchée (safety net — normalement retournée via Result)
    if (error instanceof DomainError) {
      logger.warn({ code: error.code, url, method, requestId }, error.message)
      return context.json({
        code: error.code,
        message: error.message,
        details: error.details,
      }, mapDomainErrorToHttpStatus(error))
    }

    // 2. HTTPException Hono (levée par les middlewares auth, body parser, etc.)
    if (error instanceof HTTPException) {
      logger.warn({ url, method, requestId, status: error.status }, error.message)
      return context.json({
        code: error.status === 401 ? 'UNAUTHORIZED'
            : error.status === 403 ? 'FORBIDDEN'
            : 'HTTP_EXCEPTION',
        message: error.message,
      }, error.status)
    }

    // 3. ZodError (validation d'entrée)
    if (error instanceof ZodError) {
      logger.warn({ url, method, requestId, issues: error.issues }, 'Validation error')
      return context.json({
        code: 'VALIDATION_ERROR',
        message: 'Les données fournies sont invalides',
        details: { issues: error.issues },
      }, 400)
    }

    // 4. Erreur technique inattendue — 500, stack loggué, jamais exposé au client
    logger.error(
      { url, method, requestId, stack: error.stack, name: error.name },
      `Unhandled error: ${error.message}`,
    )
    return context.json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Une erreur interne est survenue',
    }, 500)
  })

  // Convention 404 standard
  app.notFound((context) => context.json({
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${context.req.method} ${context.req.url} introuvable`,
  }, 404))
}
```

**Règles non-négociables :**
- **Jamais de stack trace dans la réponse HTTP** — loggué côté serveur uniquement
- **Réponse prod identique à la réponse staging** (pas de divergence qui brouille le debug)
- **Tout est loggué** avec niveau adapté (warn pour 4xx, error pour 5xx)
- **`requestId`** posé par un middleware en amont et propagé dans tous les logs pour corrélation

### 16.4 Niveau 4 — Helper `respondWithResult` pour factoriser les routes

Pour éviter le boilerplate `if (result.isErr) ... else ...` dans chaque route :

```ts
// src/platform/http/respond-with-result.ts
export async function respondWithResult<TValue, TError extends DomainError, TResponse>(
  context: Context,
  result: Result<TValue, TError>,
  onSuccess: (value: TValue) => TResponse,
): Promise<TResponse | Response> {
  if (result.isErr) {
    return context.json({
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
    }, mapDomainErrorToHttpStatus(result.error))
  }
  return onSuccess(result.value)
}
```

**Usage dans une route :**

```ts
app.openapi(createEntityRoute, async (context) => {
  const body = context.req.valid('json')
  const handler = container.resolve<CreateEntityHandler>('createEntityHandler')
  const result = await handler.executer({ nom: body.nom })

  return respondWithResult(context, result, (entity) =>
    context.json({ id: entity.id, nom: entity.nom }, 201),
  )
})
```

→ Code de route minimal, un seul chemin de mapping d'erreur, impossible d'oublier un status.

### 16.5 Conventions à figer

- ❗ Toute erreur métier = classe héritée de `DomainError`, avec `code` stable + `kind`
- ❗ Tout handler retourne `Result<T, DomainError>` — pas de throw métier
- ❗ Toute route utilise `respondWithResult` (ou équivalent inline si vraiment justifié, mais le helper est la convention)
- ❗ Les throws techniques remontent à `app.onError` qui loggue et renvoie une réponse `ErrorSchema` propre
- ❗ Pas de stack trace exposée côté HTTP, jamais
- ❗ `requestId` présent dans tous les logs liés à une requête
