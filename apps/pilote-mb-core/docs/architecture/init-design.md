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

### 5.1 Approche globale

**Clean Architecture + DDD tactique + CQRS logique.**

- **Clean Architecture** : séparation en 3 couches (`domain`, `application`, `infrastructure`) avec inversion de dépendances — domain au centre, infrastructure en périphérie
- **DDD tactique** : entités, value objects, domain services, repositories-interfaces (ports), domain errors
- **CQRS logique** : séparation explicite `commands/` (écriture) et `queries/` (lecture), chaque use case a son propre handler. Même DB, pas d'event sourcing.

### 5.2 Organisation layer-first, orientée entité

La structure est layer-first, mais à l'intérieur du domain les **entités** sont la première division (pas les "bounded contexts" au sens métier).

Raison : les repositories sont naturellement partageables entre use cases sans avoir à traverser des barrières de "bounded contexts" — exactement le problème rencontré sur pilote-ppg.

### 5.3 Structure des dossiers

```
apps/pilote-mb-core/
├── src/
│   ├── domain/
│   │   ├── shared/                          # Result, DomainError, Clock, UUID, Transaction port, Logger port
│   │   │   ├── transaction.ts
│   │   │   ├── logger.ts
│   │   │   ├── domain-error.ts              # classe de base + kind pour mapping HTTP
│   │   │   └── ...
│   │   ├── api-key/
│   │   │   ├── api-key.ts
│   │   │   └── api-key.repository.ts        # INTERFACE
│   │   └── utilisateur/
│   │       ├── utilisateur.ts
│   │       ├── statut-acces.ts              # value object (enum)
│   │       └── utilisateur.repository.ts    # INTERFACE
│   ├── application/
│   │   ├── commands/
│   │   │   └── create-session/              # ProConnect (scaffolding)
│   │   │       ├── create-session.command.ts
│   │   │       ├── create-session.handler.ts
│   │   │       └── create-session.handler.test.ts
│   │   └── queries/
│   │       ├── verify-api-key/
│   │       ├── verify-jwt/
│   │       └── check-health/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── prisma/
│   │   │       ├── prisma-transaction.ts    # AsyncLocalStorage + txStore + PrismaTransaction
│   │   │       ├── prisma-pilote.ts         # wrapper injectable (client racine + tx courante via txStore)
│   │   │       ├── api-key.prisma-repository.ts
│   │   │       └── utilisateur.prisma-repository.ts
│   │   ├── http/
│   │   │   ├── app.ts                       # buildApp — assemble Hono + OpenAPI + middlewares
│   │   │   ├── middlewares/
│   │   │   │   ├── request-id.middleware.ts # génère/propage le requestId (corrélation logs)
│   │   │   │   ├── logger.middleware.ts     # log start/end de chaque requête
│   │   │   │   ├── auth.middleware.ts       # dispatch API-Key / JWT par format
│   │   │   │   ├── require-scope.middleware.ts
│   │   │   │   └── error-handler.middleware.ts
│   │   │   ├── schemas/
│   │   │   │   ├── error.schema.ts          # ErrorSchema partagé
│   │   │   │   └── pagination.schema.ts
│   │   │   ├── error-mapping.ts             # DomainErrorKind → HTTP status
│   │   │   ├── respond-with-result.ts       # helper Result → Response
│   │   │   └── routes/
│   │   │       ├── health.route.ts
│   │   │       └── create-session.route.ts   # retourne 501 — scaffolding ProConnect
│   │   ├── logging/
│   │   │   ├── composite-logger.ts
│   │   │   ├── log-sink.ts                  # interface
│   │   │   └── sinks/
│   │   │       ├── pino-stdout.sink.ts
│   │   │       └── database.sink.ts
│   │   ├── crypto/
│   │   │   ├── sha256-api-key-hasher.ts     # hash déterministe des API keys
│   │   │   └── jsonwebtoken-token-signer.ts
│   │   ├── proconnect/
│   │   │   └── proconnect-client.ts         # scaffolding (à compléter ticket suivant)
│   │   ├── container/
│   │   │   ├── module-system/               # framework DI (adapté de pilote-ppg)
│   │   │   │   ├── define-module.ts
│   │   │   │   ├── boot-modules.ts
│   │   │   │   └── module-names.ts
│   │   │   ├── modules/
│   │   │   │   ├── shared.module.ts         # prisma, transaction, logger, config, tokenSigner, apiKeyHasher
│   │   │   │   ├── authentication.module.ts
│   │   │   │   └── healthcheck.module.ts
│   │   │   └── build-app-container.ts       # orchestrateur appelant bootModules
│   │   ├── scripts/
│   │   │   └── create-api-key.ts            # CLI
│   │   └── test/
│   │       ├── vitest.setup.ts             # setup global (applique les migrations, ferme Prisma en teardown)
│   │       ├── with-test-transaction.ts
│   │       ├── test-context.ts
│   │       └── fixtures/
│   │           ├── api-key.fixture.ts
│   │           └── utilisateur.fixture.ts
│   ├── config.ts                            # Config Zod-validée
│   └── index.ts                             # bootstrap
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
├── .eslintrc.cjs
├── .prettierrc
└── CLAUDE.md
```

Tests co-localisés : `foo.ts` + `foo.test.ts` côte-à-côte.

### 5.4 Règles de dépendance entre couches

- `domain/` n'importe que `domain/` (autres sous-dossiers) et rien d'autre
- `application/` importe `domain/` uniquement
- `infrastructure/` importe `domain/` et `application/`
- Pas de règle ESLint automatique initialement — convention + revue humaine. `dependency-cruiser` à ajouter si la convention dérape.

---

## 6. Patterns fondamentaux

### 6.1 Dependency Injection — module-system Awilix (copié/adapté de pilote-ppg)

pilote-mb-core reprend le **module-system** mis en place sur pilote-ppg. Il apporte trois bénéfices majeurs par rapport à un registre Awilix plat :
- **Découpage par bounded-context** : chaque module déclare son propre cradle typé et ne touche qu'à ses propres dépendances
- **Graphe de dépendances explicite** via `imports` / `exports` — on contrôle ce qui fuit entre modules
- **Typage fort des injections** via `Inject<K>` — chaque classe déclare précisément les dépendances qu'elle consomme

#### Structure du framework

Le framework vit dans `src/infrastructure/container/module-system/` :
- `define-module.ts` — factory curryfiée `defineModule<TExports, TCradle>()({...})` avec inférence des types
- `boot-modules.ts` — orchestrateur en 2 phases :
  - Phase 1 : crée un container racine pour le module sans imports (`shared`), puis un scope par autre module (héritant des deps transverses)
  - Phase 2 : résout eagerly les exports de chaque module importé et les ré-enregistre comme `asValue` dans le container consommateur (évite les boucles de résolution d'Awilix)
- `module-names.ts` — liste canonique typée des modules du projet

Adaptations par rapport à pilote-ppg :
- Renommage des fichiers/types en **camelCase** et noms **anglais** (sauf entités métier) pour respecter la convention de pilote-mb
- `PROXY` + `strict: true` sur le container racine (identique)

#### Module `shared` (racine)

```ts
// src/infrastructure/container/modules/shared.module.ts
type SharedCradle = {
  prisma: PrismaPilote
  transaction: Transaction
  logger: Logger
  config: Config
  tokenSigner: TokenSigner
  apiKeyHasher: ApiKeyHasher
}

export type SharedDependencies = SharedCradle

export const sharedModule = defineModule<NoExports, SharedCradle>()({
  name: 'shared',
  imports: [],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      prisma:       asModuleFunction(() => new PrismaPilote()).singleton(),
      transaction:  asModuleFunction(() => new PrismaTransaction()).singleton(),
      logger:       asModuleFunction(() => buildLogger(config)).singleton(),
      config:       asModuleFunction(() => config).singleton(),
      tokenSigner:  asModuleClass(JsonwebtokenTokenSigner).singleton(),
      apiKeyHasher: asModuleClass(Sha256ApiKeyHasher).singleton(),
    } satisfies VerifyCradle<SharedCradle>)
  },
})
```

#### Module métier consommateur

```ts
// src/infrastructure/container/modules/authentication.module.ts
type AuthenticationCradle = {
  apiKeyRepository: ApiKeyRepository
  utilisateurRepository: UtilisateurRepository
  verifyApiKeyHandler: VerifyApiKeyHandler
  verifyJwtHandler: VerifyJwtHandler
  createSessionHandler: CreateSessionHandler
}

export const authenticationModule = defineModule<NoExports, AuthenticationCradle>()({
  name: 'authentication',
  imports: ['shared'],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      apiKeyRepository:     asModuleClass(ApiKeyPrismaRepository).singleton(),
      utilisateurRepository: asModuleClass(UtilisateurPrismaRepository).singleton(),
      verifyApiKeyHandler:  asModuleClass(VerifyApiKeyHandler).singleton(),
      verifyJwtHandler:     asModuleClass(VerifyJwtHandler).singleton(),
      createSessionHandler: asModuleClass(CreateSessionHandler).singleton(),
    } satisfies VerifyCradle<AuthenticationCradle>)
  },
})

type Scope = ExtractScope<typeof authenticationModule>
export type Inject<K extends keyof Scope> = Pick<Scope, K>
```

#### Bootstrap

```ts
// src/infrastructure/container/build-app-container.ts
export function buildAppContainer() {
  return bootModules([
    sharedModule,
    authenticationModule,
    healthcheckModule,
  ])
}
```

#### Liste des modules de l'init

```ts
// src/infrastructure/container/module-system/module-names.ts
export const moduleNames = [
  'shared',
  'authentication',
  'healthcheck',
] as const

export type ModuleName = (typeof moduleNames)[number]
```

On étend cette liste à chaque nouveau bounded-context (ex: `'entity'`, `'indicateur'`, `'territoire'`).

#### Convention de vie des dépendances

- **Tout en singleton** (pas de scope par requête — les transactions passent par `AsyncLocalStorage`, pas par Awilix scope)
- **Mode Proxy Injection** (un seul argument objet dans le constructeur, déstructuré par le pattern `Inject<K>` ci-dessous)

### 6.2 Transactions — AsyncLocalStorage via `PrismaPilote` injecté

On reprend le pattern pilote-ppg : un `AsyncLocalStorage<PilotePrismaClient>` porte la transaction courante à travers la chaîne d'appels async, et un **wrapper `PrismaPilote`** lu via Awilix encapsule la résolution "tx courante OR client racine". Les repositories **ne touchent jamais** à `PrismaClient` ni à `getPrisma()` directement — ils consomment un `prisma: PrismaPilote` via `Inject<'prisma'>`.

```ts
// src/infrastructure/persistence/prisma/prisma-transaction.ts
export type PilotePrismaClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
export const txStore = new AsyncLocalStorage<PilotePrismaClient>()

export class PrismaTransaction implements Transaction {
  async run<T>(scope: () => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => txStore.run(tx, scope))
  }
}
```

```ts
// src/infrastructure/persistence/prisma/prisma-pilote.ts
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
// src/infrastructure/persistence/prisma/api-key.prisma-repository.ts
import { type Inject } from '@/infrastructure/container/modules/authentication.module'

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
import { type Inject } from '@/infrastructure/container/modules/authentication.module'

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
// src/infrastructure/logging/composite-logger.ts
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

Chaque module expose un alias `Inject<K>` typé, construit depuis son `ExtractScope`. Les classes du bounded-context consomment uniquement les clés dont elles ont besoin — précisément typées, auto-complétées, sans re-déclarer la signature.

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
- Dans un fichier `*.repository.ts` ou `*.handler.ts`, l'import de `Inject` pointe vers le `module.ts` du bounded-context auquel la classe appartient
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
- Schémas Zod **locaux aux routes** quand spécifiques, **partagés dans `src/infrastructure/http/schemas/`** quand réutilisés
- Chaque schéma Zod nommé via `.openapi('NomDuSchema')` → référencement propre dans le JSON
- `/api/openapi.json` et `/api/docs` **accessibles en prod aussi** (objectif produit)

### 8.3 Pattern d'une route

```ts
// src/infrastructure/http/routes/create-session.route.ts
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

**Port `ApiKeyHasher` dans `domain/shared/` + adapter `Sha256ApiKeyHasher` dans `infrastructure/crypto/`** :
```ts
export interface ApiKeyHasher {
  hash(token: string): string              // déterministe
}

export class Sha256ApiKeyHasher implements ApiKeyHasher {
  hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
```

**Génération d'un nouveau token :**
```ts
const rawToken = `pmb_${env}_${crypto.randomBytes(32).toString('hex')}`   // 64 chars hex = 256 bits
const keyHash = apiKeyHasher.hash(rawToken)
const keyPrefix = rawToken.slice(0, 12)    // ex: "pmb_live_abc"
```

**Flow de vérification (middleware auth) :**
1. Le client envoie `Authorization: Bearer pmb_live_xxxxxxxx...`
2. Le middleware calcule `apiKeyHasher.hash(token)`
3. Lookup `findUnique({ where: { key_hash } })`
4. Vérifie `active = true`, pose l'api-key sur le contexte Hono
5. Update `date_derniere_utilisation` (best-effort, async, pas bloquant)

**Création via CLI :**
```bash
pnpm create-api-key --nom "agent-satellite-prod" --env live --scopes "entities:read,indicateurs:read"
# Affiche le token en clair UNE SEULE FOIS dans stdout ; seuls key_hash + key_prefix vont en DB
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
// src/infrastructure/test/with-test-transaction.ts
import { buildAppContainer } from '@/infrastructure/container/build-app-container'
import { txStore } from '@/infrastructure/persistence/prisma/prisma-transaction'
import { PrismaPilote } from '@/infrastructure/persistence/prisma/prisma-pilote'
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
    const sharedContainer = getContainer('shared')
    const prismaPilote = sharedContainer.resolve<PrismaPilote>('prisma')
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
// src/infrastructure/test/test-context.ts
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

Un fichier par entité dans `src/infrastructure/test/fixtures/`. Ce sont des **fonctions utilitaires**, pas des classes injectées par Awilix.

**Exception documentée à la règle 6.2** : les fixtures peuvent utiliser `getPrisma()` directement (import depuis `prisma-transaction.ts`). Raison : les fixtures ne sont pas instanciées via Awilix et on veut éviter le boilerplate d'injection pour des helpers de test. `getPrisma()` retourne automatiquement la transaction courante (celle de `withTestTransaction`) ou le client racine.

```ts
// src/infrastructure/test/fixtures/api-key.fixture.ts
import { getPrisma } from '@/infrastructure/persistence/prisma/prisma-transaction'
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
    setupFiles: ['src/infrastructure/test/vitest.setup.ts'],
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
      "@/domain/*": ["src/domain/*"],
      "@/application/*": ["src/application/*"],
      "@/infrastructure/*": ["src/infrastructure/*"],
      "@/shared/*": ["src/domain/shared/*"],
      "@/config": ["src/config"]
    }
  }
}
```

### 11.4 ESLint

Règles clés :
- `no-restricted-syntax` interdisant `export default` (whitelist pour fichiers de config tierces)
- Convention no-barrel documentée dans CLAUDE.md (pas de règle ESLint native parfaite)
- Règles TypeScript strict standard

### 11.5 Scripts package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts | pino-pretty",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src && tsc --noEmit",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "database:init": "prisma migrate reset --force",
    "database:migration": "prisma migrate dev",
    "create-api-key": "tsx src/infrastructure/scripts/create-api-key.ts"
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
1. `apps/pilote-mb-core/` enregistré dans le monorepo (`pnpm-workspace.yaml`)
2. Fichiers de config : `package.json`, `tsconfig.json`, `vitest.config.ts`, `.eslintrc.cjs`, `.prettierrc`, `docker-compose.yml`
3. Schema Prisma + première migration (`0001_init`)
4. Config Zod-validée (`src/config.ts`)
5. **Module-system** copié/adapté de pilote-ppg (`define-module`, `boot-modules`, `module-names`) + 3 modules (`shared`, `authentication`, `healthcheck`) + `build-app-container`
6. **`PrismaPilote` wrapper** injectable + `PrismaTransaction` + `txStore` (`AsyncLocalStorage`)
7. Logger sinks composables (`CompositeLogger` + `PinoStdoutSink` + `DatabaseSink`)
8. `withTestTransaction` helper + `TestContext` + fixtures `api-key` / `utilisateur`
9. Middlewares HTTP : `request-id`, `logger`, `auth` (dispatch API Key / JWT), `require-scope`, `error-handler`
10. **Error handling complet** : `DomainError` + `DomainErrorKind` (avec `'not-implemented'`), mapping `kind → HTTP status`, `app.onError` + `app.notFound`, helper `respondWithResult`
11. **API Key impl complète** : port `ApiKeyHasher` + adapter `Sha256ApiKeyHasher`, `ApiKeyPrismaRepository`, `VerifyApiKeyHandler`, middleware auth, CLI de création, tests d'intégration
12. **Scaffolding user + JWT** : entité `Utilisateur`, value object `StatutAcces`, `UtilisateurPrismaRepository`, port `TokenSigner` + adapter `JsonwebtokenTokenSigner` (impl fonctionnelle et testée pour émission/vérification du JWT interne), `CreateSessionHandler` stubé
13. **Endpoint `GET /health`** (public, DB ping `SELECT 1`) + test d'intégration
14. **Endpoint `POST /auth/sessions`** retournant 501 avec message clair
15. Swagger UI (`/api/docs`) et JSON (`/api/openapi.json`)
16. CLAUDE.md du projet (reprend les règles de ce design)
17. `docs/architecture/decisions/0001-record-architecture-decisions.md` (ADR base)
18. `docs/architecture/decisions/0002-architecture-init-pilote-mb-core.md` (résume ce design)
19. Mise à jour de `.github/workflows/testAndLint.yml` (ajout filter + jobs `test-mb-core` + `lint-mb-core`)

### Hors scope (tickets suivants)
- **Intégration ProConnect** (flow OIDC complet, validation JWKS, upsert user depuis claims, endpoint `POST /auth/sessions` fonctionnel, `/auth/me`, `/auth/acces/demande`)
- Domain/infra pour `Entity`, `Indicateur`, `Territoire` et leurs use cases CRUD
- Front `pilote-mb-webapp`
- CI/CD (déploiement, pipeline de tests)
- Monitoring/APM (on reste sur sinks DB pour le logging en attendant la contractualisation)
- `dependency-cruiser` ou règle lint cross-layer
- Refresh tokens
- Gestion des rôles fine-grained / RBAC
- Page "Demander l'accès à Pilote" (dépend du ticket ProConnect)

---

## 14. Questions ouvertes / décisions différées

- **Nom du schéma Postgres** : on reste sur `public` par défaut. Multi-tenant (un schéma par client) = ticket dédié si pertinent un jour.
- **Refresh tokens** : pas nécessaire pour le MVP, TTL de 8h suffit. À revoir quand le front sera en place.
- **Idempotency-Key header** : convention prête à être ajoutée, mais pas implémentée tant qu'on n'a pas de mutation critique.
- **Règle lint cross-layer** : pas d'outillage automatique au démarrage, revue manuelle. À ajouter si la convention dérape.
- **ProConnect en maintenance** : au moment de la rédaction de ce design, ProConnect est en maintenance, ce qui justifie le scaffolding différé. Le ticket d'intégration sera lancé dès le retour du service.

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
- ✅ `pnpm lint` passe (eslint + tsc --noEmit)
- ✅ CLAUDE.md et ADR 0002 en place
- ✅ Les jobs CI `test-mb-core` et `lint-mb-core` passent vert sur la PR

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
// src/infrastructure/http/error-mapping.ts
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
// src/infrastructure/http/middlewares/error-handler.middleware.ts
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
// src/infrastructure/http/respond-with-result.ts
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
