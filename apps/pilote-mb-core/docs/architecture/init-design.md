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
- **API Keys** en DB pour les agents/services machine-to-machine (impl complète)
- **ProConnect OIDC** pour les users humains (scaffolding dans ce ticket, intégration dans un ticket suivant)
- **jsonwebtoken** pour le JWT interne (HS256, TTL 8h)
- **openid-client** pour le flow OIDC (à intégrer dans le ticket suivant)
- **bcrypt** pour hasher les API keys

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
│   │   │       ├── prisma.ts                # PrismaClient singleton
│   │   │       ├── prisma-transaction.ts    # AsyncLocalStorage + getPrisma + PrismaTransaction
│   │   │       ├── api-key.prisma-repository.ts
│   │   │       └── utilisateur.prisma-repository.ts
│   │   ├── http/
│   │   │   ├── app.ts                       # buildApp — assemble Hono + OpenAPI + middlewares
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts       # dispatch API-Key / JWT par format
│   │   │   │   ├── require-scope.middleware.ts
│   │   │   │   ├── logger.middleware.ts
│   │   │   │   └── error-handler.middleware.ts
│   │   │   ├── schemas/
│   │   │   │   ├── error.schema.ts          # ErrorSchema partagé
│   │   │   │   └── pagination.schema.ts
│   │   │   └── routes/
│   │   │       ├── health.route.ts
│   │   │       ├── create-session.route.ts
│   │   │       └── me.route.ts
│   │   ├── logging/
│   │   │   ├── composite-logger.ts
│   │   │   ├── log-sink.ts                  # interface
│   │   │   └── sinks/
│   │   │       ├── pino-stdout.sink.ts
│   │   │       └── database.sink.ts
│   │   ├── crypto/
│   │   │   ├── bcrypt-password-hasher.ts    # hash des API keys
│   │   │   └── jsonwebtoken-token-signer.ts
│   │   ├── proconnect/
│   │   │   └── proconnect-client.ts         # scaffolding (à compléter ticket suivant)
│   │   ├── container/
│   │   │   ├── awilix.container.ts          # buildContainer
│   │   │   ├── register-infrastructure.ts
│   │   │   ├── register-repositories.ts
│   │   │   └── register-handlers.ts
│   │   ├── scripts/
│   │   │   └── create-api-key.ts            # CLI
│   │   └── test/
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

### 6.1 Dependency Injection — Awilix ProxyInjection, singletons

```ts
// src/infrastructure/container/awilix.container.ts
export function buildContainer() {
  const container = createContainer({ injectionMode: InjectionMode.PROXY })
  registerInfrastructure(container)
  registerRepositories(container)
  registerHandlers(container)
  return container
}
```

- Toutes les dépendances en **singleton** (pas de scope par requête)
- `PrismaClient` et `Logger` enregistrés via `asValue(...)`
- Les classes reçoivent leurs deps en ProxyInjection : `constructor({ utilisateurRepository, logger }) { ... }`

### 6.2 Transactions — AsyncLocalStorage + getPrisma()

```ts
// src/infrastructure/persistence/prisma/prisma-transaction.ts
export type PilotePrismaClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
export const txStore = new AsyncLocalStorage<PilotePrismaClient>()

export class PrismaTransaction implements Transaction {
  async run<T>(scope: () => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => txStore.run(tx, scope))
  }
}

export const getPrisma = () => txStore.getStore() ?? prisma
```

**Règle d'or** : aucun repository ne dépend directement de `PrismaClient`. Tous appellent `getPrisma()` qui retourne la transaction courante ou le client racine.

```ts
// src/infrastructure/persistence/prisma/api-key.prisma-repository.ts
export class ApiKeyPrismaRepository implements ApiKeyRepository {
  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const row = await getPrisma().api_key.findUnique({ where: { key_hash: keyHash } })
    return row ? ApiKeyMapper.toDomain(row) : null
  }
}
```

Un handler qui a besoin d'une transaction injecte le port `Transaction` et appelle `transaction.run(async () => { ... })`. Toute la chaîne async dans le callback bénéficie automatiquement de la tx via `getPrisma()`.

### 6.3 Result type — neverthrow

Les handlers ne throw pas pour les erreurs métier — ils retournent un `Result`.

```ts
import { err, ok, Result } from 'neverthrow'

export class CreateSessionHandler {
  async executer(command: CreateSessionCommand): Promise<Result<Session, AuthenticationError>> {
    if (!command.idToken) return err(new MissingIdTokenError())
    // TODO: intégrer ProConnect (ticket suivant)
    return err(new NotImplementedError('ProConnect integration — voir ticket suivant'))
  }
}
```

Throws réservés aux erreurs techniques (DB down, config invalide, etc.) qui remontent au middleware d'erreur global.

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

**Wiring au boot :**
```ts
const sinks: LogSink[] = [new PinoStdoutSink()]
if (config.LOG_TO_DATABASE) sinks.push(new DatabaseSink())
container.register({ logger: asValue(new CompositeLogger(sinks)) })
```

**Évolution future** : ajouter un sink APM / HTTP vers app satellite de logs = `sinks.push(new DatadogSink())` au wiring. Zéro refacto.

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
  BCRYPT_ROUNDS: z.coerce.number().int().positive().default(12),
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
    if (result.isErr) return context.json({ code: result.error.code, message: result.error.message }, 501)
    return context.json({ jwt: result.value.jwt, utilisateur: UtilisateurMapper.toHttp(result.value.utilisateur) }, 201)
  })
}
```

---

## 9. Authentification

### 9.1 Deux stratégies parallèles, middleware unifié

Un seul middleware `auth.middleware.ts` détecte le format du Bearer token et délègue à la bonne stratégie :
- Token préfixé `pmb_live_` ou `pmb_test_` → **API Key** (agents/services)
- Token JWT (3 segments séparés par `.`) → **session user**

Le middleware pose sur le contexte Hono :
- `c.set('auth', { type: 'api-key', apiKey })`
- `c.set('auth', { type: 'user', utilisateur, jwt })`

### 9.2 API Keys (impl complète dans ce ticket)

**Table Prisma :**
```prisma
model api_key {
  id                        String    @id @default(uuid())
  nom                       String
  key_hash                  String    @unique
  scopes                    String[]
  active                    Boolean   @default(true)
  date_creation             DateTime  @default(now())
  date_derniere_utilisation DateTime?
}
```

**Flow :**
1. Le client envoie `Authorization: Bearer pmb_live_xxxxxxxx...`
2. Le middleware hash le token (bcrypt compare) et cherche en DB
3. Vérifie `active = true`, pose l'api-key sur le contexte
4. Update `date_derniere_utilisation` (best-effort, async)

**Création via CLI** :
```bash
pnpm create-api-key --nom "agent-satellite-prod" --scopes "entities:read,indicateurs:read"
# Affiche le token en clair UNE SEULE FOIS, le hash seul va en DB
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
- Middleware `auth.middleware.ts` avec dispatch API Key / JWT (branche JWT valide la signature, résout l'utilisateur)
- `CreateSessionHandler` créé avec la structure CQRS complète, mais son impl contient un `TODO: intégrer ProConnect` et retourne `err(new NotImplementedError(...))`
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

```ts
// src/infrastructure/test/with-test-transaction.ts
export function withTestTransaction(
  runTest: (testContext: TestContext) => Promise<void>,
): () => Promise<void> {
  return async () => {
    class RollbackSignal extends Error {}
    try {
      await prisma.$transaction(async (tx) => {
        await txStore.run(tx, async () => {
          const testContext = new TestContext(rootContainer)
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

Un fichier par entité dans `src/infrastructure/test/fixtures/` :

```ts
// src/infrastructure/test/fixtures/api-key.fixture.ts
export async function createApiKeyFixture(
  overrides: Partial<Prisma.api_keyUncheckedCreateInput> = {},
) {
  return getPrisma().api_key.create({
    data: {
      id: randomUUID(),
      nom: `test-key-${randomUUID().slice(0, 6)}`,
      key_hash: await bcrypt.hash(`pmb_test_${randomUUID()}`, 10),
      scopes: [],
      active: true,
      ...overrides,
    },
  })
}
```

Les factories utilisent `getPrisma()` → marchent à la fois en test (dans la tx) et en prod (hors tx) sans adaptation.

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
- `api_key`
- `utilisateur` + enum `statut_acces_enum`
- `application_log` (destination du `DatabaseSink`)

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
5. Container Awilix (`buildContainer` + `register-*`)
6. Logger sinks composables (`CompositeLogger` + `PinoStdoutSink` + `DatabaseSink`)
7. Transactions (`AsyncLocalStorage` + `PrismaTransaction` + `getPrisma`)
8. `withTestTransaction` helper + `TestContext` + fixtures `api-key` / `utilisateur`
9. Middleware auth avec dispatch API Key / JWT
10. **API Key impl complète** : repository, middleware, CLI de création, tests d'intégration
11. **Scaffolding user + JWT** : entité `Utilisateur`, `StatutAcces`, `UtilisateurPrismaRepository`, `TokenSigner` + adapter, `CreateSessionHandler` stubé
12. **Endpoint `GET /health`** (public, DB ping `SELECT 1`) + test d'intégration
13. **Endpoint `POST /auth/sessions`** retournant 501 avec message clair
14. Swagger UI (`/api/docs`) et JSON (`/api/openapi.json`)
15. CLAUDE.md du projet (reprend les règles de ce design)
16. `docs/architecture/decisions/0001-record-architecture-decisions.md` (ADR base)
17. `docs/architecture/decisions/0002-architecture-init-pilote-mb-core.md` (résume ce design)
18. Mise à jour de `.github/workflows/testAndLint.yml` (ajout filter + jobs `test-mb-core` + `lint-mb-core`)

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
- ✅ Une requête sur une route protégée sans Bearer → 401
- ✅ Une requête avec un `pmb_live_*` valide → 200 (si scope OK)
- ✅ Les tests d'intégration du healthcheck et des API keys passent, en parallèle
- ✅ `pnpm lint` passe (eslint + tsc --noEmit)
- ✅ CLAUDE.md et ADR 0002 en place
- ✅ Les jobs CI `test-mb-core` et `lint-mb-core` passent vert sur la PR
