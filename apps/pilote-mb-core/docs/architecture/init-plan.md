# Plan d'implémentation — Initialisation de pilote-mb-core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place le backend `pilote-mb-core` (Hono + DDD by the book + API Keys complètes + scaffolding ProConnect) avec un endpoint `GET /health` fonctionnel et `POST /auth/sessions` retournant 501.

**Architecture:** Context-first (1 dossier racine par BC). DDD stratégique + tactique complet. BCs : `platform` (infra technique transverse), `authentication` (complet), `healthcheck` (minimal). `shared-kernel/` pour les primitives DDD.

**Tech Stack:** TypeScript strict, Hono + `@hono/zod-openapi` + `@hono/swagger-ui`, Prisma 6 + PostgreSQL, Awilix (module-system adapté de pilote-ppg), neverthrow, pino (sinks composables), Vitest (parallèle via `withTestTransaction`), `dependency-cruiser`.

**Spec de référence :** `apps/pilote-mb-core/docs/architecture/init-design.md`

**Conventions obligatoires (voir CLAUDE.md + design doc) :**
- Verbes/tech en anglais, entités en français (`getIndicateurById`, `CreateEntityHandler`)
- Pas de `export default` (sauf config tierces)
- Pas de barrel files
- Tests en TDD strict, parallèle, `withTestTransaction`
- Commits : pas de `Co-Authored-By`, convention `[DITP-pilotage/pilote-2] <type>: <description>`

---

## Vue d'ensemble des phases

| Phase | Contenu | Tâches |
|---|---|---|
| **1. Fondations projet** | Workspace, configs, docker, Prisma, config app | T1–T7 |
| **2. shared-kernel** | Primitives DDD (AggregateRoot, ValueObject, DomainEvent, ports) | T8–T14 |
| **3. Platform infra** | PrismaPilote, Logger, Clock, EventPublisher, module-system | T15–T23 |
| **4. HTTP platform** | Error handling, middlewares, buildApp, Swagger | T24–T30 |
| **5. Test infrastructure** | vitest.setup, FakeClock, withTestTransaction, TestContext | T31–T34 |
| **6. BC healthcheck** | Handler, route, module | T35–T37 |
| **7. BC authentication — domain api-key** | VOs, Errors, Events, AggregateRoot, Repository interface | T38–T42 |
| **8. BC authentication — domain utilisateur** | VOs, Events, AggregateRoot, Repository interface | T43–T45 |
| **9. BC authentication — infrastructure** | Adapters crypto, Prisma repositories, ProConnect stub | T46–T52 |
| **10. BC authentication — application** | Handlers CQRS, Facade | T53–T57 |
| **11. BC authentication — public + module** | Published Language, module.ts | T58–T60 |
| **12. BC authentication — HTTP + CLI** | Route, middleware auth, CLI create-api-key | T61–T64 |
| **13. Bootstrap + assemblage final** | `index.ts`, enregistrement workspace, tests E2E | T65–T68 |
| **14. Documentation + CI** | CLAUDE.md, ADRs, workflow CI | T69–T72 |

---

## Phase 1 — Fondations projet

### Tâche 1 : Enregistrer pilote-mb-core dans le monorepo

**Files:**
- Create: `apps/pilote-mb-core/package.json`
- Modify: `pnpm-workspace.yaml` (pas d'action — le glob `apps/*` couvre déjà)

- [ ] **Step 1: Créer `apps/pilote-mb-core/package.json`**

```json
{
  "name": "@pilote-mb/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": "24.9.0"
  },
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

- [ ] **Step 2: Vérifier que pnpm détecte le package**

Run: `pnpm -F @pilote-mb/core exec pwd`
Expected: affiche `/Users/.../apps/pilote-mb-core`

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/package.json
git commit -m "[DITP-pilotage/pilote-2] feature: creer le package @pilote-mb/core

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, init
Files-changed: 1"
```

---

### Tâche 2 : Installer les dépendances

**Files:**
- Modify: `apps/pilote-mb-core/package.json`

- [ ] **Step 1: Ajouter les dépendances runtime**

```bash
pnpm -F @pilote-mb/core add hono @hono/zod-openapi @hono/swagger-ui zod neverthrow awilix pino @prisma/client jsonwebtoken openid-client
```

- [ ] **Step 2: Ajouter les dépendances dev**

```bash
pnpm -F @pilote-mb/core add -D typescript @types/node @types/jsonwebtoken tsx prisma vitest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier dependency-cruiser pino-pretty
```

- [ ] **Step 3: Vérifier que `pnpm install` passe sans erreur**

Run: `pnpm install`
Expected: Lockfile updated, 0 errors

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/package.json pnpm-lock.yaml
git commit -m "[DITP-pilotage/pilote-2] feature: installer les dependances de pilote-mb-core

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, dependencies
Files-changed: 2"
```

---

### Tâche 3 : Configurer TypeScript

**Files:**
- Create: `apps/pilote-mb-core/tsconfig.json`

- [ ] **Step 1: Écrire `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2023"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@/shared-kernel/*": ["src/shared-kernel/*"],
      "@/platform/*": ["src/platform/*"],
      "@/authentication/*": ["src/authentication/*"],
      "@/healthcheck/*": ["src/healthcheck/*"],
      "@/test/*": ["src/test/*"],
      "@/config": ["src/config"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 2: Vérifier que tsc ne trouve rien à compiler (src/ vide)**

Run: `pnpm -F @pilote-mb/core exec tsc --noEmit`
Expected: passe sans erreur (ou erreur "No inputs were found" — OK, on y reviendra)

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/tsconfig.json
git commit -m "[DITP-pilotage/pilote-2] feature: configurer typescript pour pilote-mb-core

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, config
Files-changed: 1"
```

---

### Tâche 4 : Configurer Vitest, ESLint, Prettier, dependency-cruiser

**Files:**
- Create: `apps/pilote-mb-core/vitest.config.ts`
- Create: `apps/pilote-mb-core/.eslintrc.cjs`
- Create: `apps/pilote-mb-core/.prettierrc`
- Create: `apps/pilote-mb-core/.dependency-cruiser.cjs`

- [ ] **Step 1: Écrire `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    sequence: { concurrent: true },
    pool: 'threads',
    poolOptions: { threads: { maxThreads: 10 } },
    testTimeout: 30_000,
    setupFiles: ['src/test/vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@/shared-kernel': resolve(__dirname, 'src/shared-kernel'),
      '@/platform': resolve(__dirname, 'src/platform'),
      '@/authentication': resolve(__dirname, 'src/authentication'),
      '@/healthcheck': resolve(__dirname, 'src/healthcheck'),
      '@/test': resolve(__dirname, 'src/test'),
      '@/config': resolve(__dirname, 'src/config'),
    },
  },
})
```

- [ ] **Step 2: Écrire `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json', tsconfigRootDir: __dirname },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "ExportDefaultDeclaration",
        message: "export default is forbidden (use named exports instead).",
      },
      {
        selector: "NewExpression[callee.name='Date']",
        message: "new Date() is forbidden in domain/application. Inject Clock instead.",
      },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['*.config.ts', '*.config.cjs', '*.config.js', '.eslintrc.cjs'],
      rules: { 'no-restricted-syntax': 'off' },
    },
    {
      files: ['**/infrastructure/persistence/**/*.ts', '**/*.test.ts', '**/*.fixture.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          { selector: "ExportDefaultDeclaration", message: "export default is forbidden." },
        ],
      },
    },
  ],
}
```

- [ ] **Step 3: Écrire `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "always"
}
```

- [ ] **Step 4: Écrire `.dependency-cruiser.cjs`**

```js
module.exports = {
  forbidden: [
    {
      name: 'no-cross-bc-internals',
      severity: 'error',
      comment: 'A BC cannot import internals from another BC — only from its public/ folder.',
      from: { path: '^src/(authentication|healthcheck)/' },
      to: {
        path: '^src/(authentication|healthcheck)/',
        pathNot: [
          '^src/(authentication|healthcheck)/public/',
        ],
      },
      pathNot: '(.*)/\\1/',
    },
    {
      name: 'no-bc-module-import-outside-bootstrap',
      severity: 'error',
      comment: 'Only build-app-container.ts can import <bc>.module.ts.',
      from: { pathNot: '^src/platform/container/build-app-container\\.ts$' },
      to: { path: '^src/[^/]+/[^/]+\\.module\\.ts$' },
    },
    {
      name: 'shared-kernel-stays-pure',
      severity: 'error',
      comment: 'shared-kernel cannot depend on platform or any BC.',
      from: { path: '^src/shared-kernel/' },
      to: { path: '^src/(platform|authentication|healthcheck)/' },
    },
    {
      name: 'public-folder-depends-only-on-shared-kernel',
      severity: 'error',
      comment: 'A BC public/ folder can only depend on shared-kernel.',
      from: { path: '^src/[^/]+/public/' },
      to: { pathNot: ['^src/shared-kernel/', '^src/[^/]+/public/'] },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
  },
}
```

- [ ] **Step 5: Vérifier que le lint tourne**

Run: `pnpm -F @pilote-mb/core lint`
Expected: pas d'erreur (ou "No files matched" — OK tant que ça ne crash pas)

- [ ] **Step 6: Commit**

```bash
git add apps/pilote-mb-core/vitest.config.ts apps/pilote-mb-core/.eslintrc.cjs apps/pilote-mb-core/.prettierrc apps/pilote-mb-core/.dependency-cruiser.cjs
git commit -m "[DITP-pilotage/pilote-2] feature: configurer vitest, eslint, prettier et dependency-cruiser

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, config, tooling
Files-changed: 4"
```

---

### Tâche 5 : Docker-compose avec DB de dev et de test

**Files:**
- Create: `apps/pilote-mb-core/docker-compose.yml`
- Create: `apps/pilote-mb-core/.env.example`

- [ ] **Step 1: Écrire `docker-compose.yml`**

```yaml
services:
  postgres:
    hostname: pilote_mb_postgres
    container_name: pilote_mb_postgres
    image: postgres:16.6-alpine
    shm_size: 1g
    ports:
      - "${POSTGRES_PORT:-5434}:5432"
    environment:
      - POSTGRES_USER=${PGUSER:-postgres}
      - POSTGRES_PASSWORD=${PGPASSWORD:-postgres}
      - POSTGRES_DB=${PGDATABASE:-pilote_mb}
    volumes:
      - db_pilote_mb:/var/lib/postgresql/data

  postgres_test:
    hostname: pilote_mb_postgres_test
    container_name: pilote_mb_postgres_test
    image: postgres:16.6-alpine
    shm_size: 1g
    command: postgres -c max_connections=500 -c shared_buffers=256MB
    ports:
      - "${POSTGRES_TEST_PORT:-5435}:5432"
    environment:
      - POSTGRES_USER=${PGUSER:-postgres}
      - POSTGRES_PASSWORD=${PGPASSWORD:-postgres}
      - POSTGRES_DB=${PGDATABASE:-pilote_mb_test}

volumes:
  db_pilote_mb:
    driver: local
```

- [ ] **Step 2: Écrire `.env.example`**

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/pilote_mb
LOG_LEVEL=info
LOG_TO_DATABASE=true
JWT_SECRET=dev-secret-at-least-32-characters-long-please-change
JWT_TTL_HOURS=8
# ProConnect (ticket suivant)
# PROCONNECT_ISSUER_URL=https://auth.agentconnect.gouv.fr
# PROCONNECT_CLIENT_ID=
# PROCONNECT_CLIENT_SECRET=
# PROCONNECT_REDIRECT_URI=
```

- [ ] **Step 3: Lancer la DB locale**

Run: `cd apps/pilote-mb-core && docker compose up -d postgres`
Expected: container `pilote_mb_postgres` up, port 5434 ouvert

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/docker-compose.yml apps/pilote-mb-core/.env.example
git commit -m "[DITP-pilotage/pilote-2] feature: ajouter docker-compose avec DB dev et test

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: docker
Tags: pilote-mb, backend, database
Files-changed: 2"
```

---

### Tâche 6 : Prisma schema initial + première migration

**Files:**
- Create: `apps/pilote-mb-core/prisma/schema.prisma`

- [ ] **Step 1: Écrire `schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model api_key {
  id                        String    @id @db.Uuid
  nom                       String
  key_hash                  String    @unique
  key_prefix                String
  scopes                    String[]
  active                    Boolean   @default(true)
  date_creation             DateTime  @default(now())
  date_derniere_utilisation DateTime?

  @@index([active])
}

model utilisateur {
  id                      String            @id @db.Uuid
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

- [ ] **Step 2: Créer la première migration**

Run:
```bash
cd apps/pilote-mb-core
export DATABASE_URL="postgresql://postgres:postgres@localhost:5434/pilote_mb"
pnpm prisma migrate dev --name init
```
Expected: migration `0001_init` créée dans `prisma/migrations/`, client Prisma généré

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/prisma/
git commit -m "[DITP-pilotage/pilote-2] feature: schema prisma initial avec api_key, utilisateur, application_log

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: prisma
Tags: pilote-mb, backend, database
Files-changed: 2"
```

---

### Tâche 7 : Config Zod-validée au boot

**Files:**
- Create: `apps/pilote-mb-core/src/config.ts`
- Create: `apps/pilote-mb-core/src/config.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('config', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('parse une config valide avec defaults', async () => {
    // Given
    process.env.NODE_ENV = 'test'
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5435/pilote_mb_test'
    process.env.JWT_SECRET = 'a'.repeat(32)

    // When
    const { parseConfig } = await import('./config')
    const result = parseConfig(process.env)

    // Then
    expect(result.NODE_ENV).toEqual('test')
    expect(result.PORT).toEqual(3000)
    expect(result.LOG_LEVEL).toEqual('info')
    expect(result.LOG_TO_DATABASE).toEqual(true)
    expect(result.JWT_TTL_HOURS).toEqual(8)
  })

  it('throw si JWT_SECRET est trop court', async () => {
    // Given
    process.env.NODE_ENV = 'test'
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5435/pilote_mb_test'
    process.env.JWT_SECRET = 'short'

    // When / Then
    const { parseConfig } = await import('./config')
    expect(() => parseConfig(process.env)).toThrow()
  })

  it('throw si DATABASE_URL est manquante', async () => {
    // Given
    process.env.NODE_ENV = 'test'
    delete process.env.DATABASE_URL
    process.env.JWT_SECRET = 'a'.repeat(32)

    // When / Then
    const { parseConfig } = await import('./config')
    expect(() => parseConfig(process.env)).toThrow()
  })
})
```

- [ ] **Step 2: Lancer le test (échec attendu)**

Run: `pnpm -F @pilote-mb/core test src/config.test.ts`
Expected: échec car `parseConfig` n'existe pas encore

- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/config.ts
import { z } from 'zod'

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_TO_DATABASE: z.coerce.boolean().default(true),
  JWT_SECRET: z.string().min(32),
  JWT_TTL_HOURS: z.coerce.number().int().positive().default(8),
  PROCONNECT_ISSUER_URL: z.string().url().optional(),
  PROCONNECT_CLIENT_ID: z.string().optional(),
  PROCONNECT_CLIENT_SECRET: z.string().optional(),
  PROCONNECT_REDIRECT_URI: z.string().url().optional(),
})

export type Config = z.infer<typeof ConfigSchema>

export function parseConfig(source: NodeJS.ProcessEnv): Config {
  return ConfigSchema.parse(source)
}

export const config = parseConfig(process.env)
```

- [ ] **Step 4: Lancer les tests (doivent passer)**

Run: `pnpm -F @pilote-mb/core test src/config.test.ts`
Expected: 3 tests passent

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/config.ts apps/pilote-mb-core/src/config.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature: config zod-validee au boot

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, zod
Tags: pilote-mb, backend, config
Files-changed: 2"
```

---

## Phase 2 — shared-kernel (primitives DDD)

### Tâche 8 : Result (re-export neverthrow)

**Files:**
- Create: `apps/pilote-mb-core/src/shared-kernel/result.ts`

- [ ] **Step 1: Écrire le fichier de re-export**

```ts
// src/shared-kernel/result.ts
export { ok, err, Result } from 'neverthrow'
export type { Ok, Err } from 'neverthrow'
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/shared-kernel/result.ts
git commit -m "[DITP-pilotage/pilote-2] feature: shared-kernel — re-export neverthrow comme Result

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, shared-kernel, ddd
Files-changed: 1"
```

---

### Tâche 9 : DomainError + DomainErrorKind

**Files:**
- Create: `apps/pilote-mb-core/src/shared-kernel/domain-error.ts`
- Create: `apps/pilote-mb-core/src/shared-kernel/domain-error.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/shared-kernel/domain-error.test.ts
import { describe, it, expect } from 'vitest'
import { DomainError } from './domain-error'

class FakeNotFoundError extends DomainError {
  readonly code = 'FAKE_NOT_FOUND'
  readonly kind = 'not-found' as const
}

describe('DomainError', () => {
  it('expose code, kind, message, details et name', () => {
    // Given
    const error = new FakeNotFoundError('Resource not found', { resourceId: 'abc' })

    // Then
    expect(error.code).toEqual('FAKE_NOT_FOUND')
    expect(error.kind).toEqual('not-found')
    expect(error.message).toEqual('Resource not found')
    expect(error.details).toEqual({ resourceId: 'abc' })
    expect(error.name).toEqual('FakeNotFoundError')
    expect(error).toBeInstanceOf(Error)
  })

  it('permet details optionnel', () => {
    // Given
    const error = new FakeNotFoundError('msg')

    // Then
    expect(error.details).toBeUndefined()
  })
})
```

- [ ] **Step 2: Lancer le test (échec)**

Run: `pnpm -F @pilote-mb/core test src/shared-kernel/domain-error.test.ts`
Expected: échec (module introuvable)

- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/shared-kernel/domain-error.ts
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
```

- [ ] **Step 4: Lancer le test (pass)**

Run: `pnpm -F @pilote-mb/core test src/shared-kernel/domain-error.test.ts`
Expected: 2 tests passent

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/shared-kernel/domain-error.ts apps/pilote-mb-core/src/shared-kernel/domain-error.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature: shared-kernel — DomainError base class + DomainErrorKind

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, shared-kernel, ddd
Files-changed: 2"
```

---

### Tâche 10 : DomainEvent interface + DomainEventPublisher port

**Files:**
- Create: `apps/pilote-mb-core/src/shared-kernel/domain-event.ts`
- Create: `apps/pilote-mb-core/src/shared-kernel/domain-event-publisher.ts`
- Create: `apps/pilote-mb-core/src/shared-kernel/domain-event-handler.ts`

- [ ] **Step 1: Écrire `domain-event.ts`**

```ts
// src/shared-kernel/domain-event.ts
export interface DomainEvent {
  readonly type: string
  readonly occurredAt: Date
  readonly aggregateId: string
}
```

- [ ] **Step 2: Écrire `domain-event-publisher.ts`**

```ts
// src/shared-kernel/domain-event-publisher.ts
import { type DomainEvent } from './domain-event'

export interface DomainEventPublisher {
  publish(events: ReadonlyArray<DomainEvent>): Promise<void>
}
```

- [ ] **Step 3: Écrire `domain-event-handler.ts`**

```ts
// src/shared-kernel/domain-event-handler.ts
import { type DomainEvent } from './domain-event'

export interface DomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  readonly eventType: string
  handle(event: TEvent): Promise<void>
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/src/shared-kernel/domain-event.ts apps/pilote-mb-core/src/shared-kernel/domain-event-publisher.ts apps/pilote-mb-core/src/shared-kernel/domain-event-handler.ts
git commit -m "[DITP-pilotage/pilote-2] feature: shared-kernel — DomainEvent + ports Publisher/Handler

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, shared-kernel, ddd, events
Files-changed: 3"
```

---

### Tâche 11 : AggregateRoot base class

**Files:**
- Create: `apps/pilote-mb-core/src/shared-kernel/aggregate-root.ts`
- Create: `apps/pilote-mb-core/src/shared-kernel/aggregate-root.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/shared-kernel/aggregate-root.test.ts
import { describe, it, expect } from 'vitest'
import { AggregateRoot } from './aggregate-root'
import { type DomainEvent } from './domain-event'

class FakeEvent implements DomainEvent {
  readonly type = 'FAKE_EVENT'
  constructor(readonly aggregateId: string, readonly occurredAt: Date) {}
}

class FakeAggregate extends AggregateRoot<string> {
  constructor(id: string) { super(id) }
  doSomething(): void {
    this.recordEvent(new FakeEvent(this.id, new Date('2026-04-24T10:00:00Z')))
  }
}

describe('AggregateRoot', () => {
  it('accumule les events via recordEvent', () => {
    // Given
    const aggregate = new FakeAggregate('agg-1')

    // When
    aggregate.doSomething()
    aggregate.doSomething()

    // Then
    const events = aggregate.pullPendingEvents()
    expect(events).toHaveLength(2)
    expect(events[0]!.type).toEqual('FAKE_EVENT')
  })

  it('pullPendingEvents vide le buffer', () => {
    // Given
    const aggregate = new FakeAggregate('agg-1')
    aggregate.doSomething()

    // When
    aggregate.pullPendingEvents()
    const secondPull = aggregate.pullPendingEvents()

    // Then
    expect(secondPull).toEqual([])
  })

  it('expose id en readonly', () => {
    const aggregate = new FakeAggregate('agg-1')
    expect(aggregate.id).toEqual('agg-1')
  })
})
```

- [ ] **Step 2: Lancer le test (échec)**

Run: `pnpm -F @pilote-mb/core test src/shared-kernel/aggregate-root.test.ts`
Expected: échec

- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/shared-kernel/aggregate-root.ts
import { type DomainEvent } from './domain-event'

export abstract class AggregateRoot<TId> {
  private readonly pendingEvents: DomainEvent[] = []

  protected constructor(readonly id: TId) {}

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

- [ ] **Step 4: Lancer le test (pass)**

Run: `pnpm -F @pilote-mb/core test src/shared-kernel/aggregate-root.test.ts`
Expected: 3 tests passent

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/shared-kernel/aggregate-root.ts apps/pilote-mb-core/src/shared-kernel/aggregate-root.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature: shared-kernel — AggregateRoot avec pendingEvents

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, shared-kernel, ddd, aggregate
Files-changed: 2"
```

---

### Tâche 12 : ValueObject base class

**Files:**
- Create: `apps/pilote-mb-core/src/shared-kernel/value-object.ts`
- Create: `apps/pilote-mb-core/src/shared-kernel/value-object.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/shared-kernel/value-object.test.ts
import { describe, it, expect } from 'vitest'
import { ValueObject } from './value-object'

class FakeEmail extends ValueObject<string> {
  constructor(email: string) {
    if (!email.includes('@')) throw new Error('Invalid email')
    super(email)
  }
}

describe('ValueObject', () => {
  it('equals retourne true pour deux VO de même valeur', () => {
    const a = new FakeEmail('foo@bar.com')
    const b = new FakeEmail('foo@bar.com')
    expect(a.equals(b)).toEqual(true)
  })

  it('equals retourne false pour deux VO de valeurs différentes', () => {
    const a = new FakeEmail('foo@bar.com')
    const b = new FakeEmail('other@bar.com')
    expect(a.equals(b)).toEqual(false)
  })

  it('valueOf retourne la valeur brute', () => {
    const email = new FakeEmail('foo@bar.com')
    expect(email.valueOf()).toEqual('foo@bar.com')
  })

  it('throw si la valeur ne respecte pas les invariants du sous-type', () => {
    expect(() => new FakeEmail('invalid')).toThrow('Invalid email')
  })
})
```

- [ ] **Step 2: Lancer le test (échec)**

Run: `pnpm -F @pilote-mb/core test src/shared-kernel/value-object.test.ts`
Expected: échec

- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/shared-kernel/value-object.ts
export abstract class ValueObject<T> {
  constructor(protected readonly value: T) {}

  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this.value) === JSON.stringify(other.value)
  }

  valueOf(): T {
    return this.value
  }
}
```

- [ ] **Step 4: Lancer le test (pass)**

Run: `pnpm -F @pilote-mb/core test src/shared-kernel/value-object.test.ts`
Expected: 4 tests passent

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/shared-kernel/value-object.ts apps/pilote-mb-core/src/shared-kernel/value-object.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature: shared-kernel — ValueObject base class

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, shared-kernel, ddd
Files-changed: 2"
```

---

### Tâche 13 : Uuid VO

**Files:**
- Create: `apps/pilote-mb-core/src/shared-kernel/uuid.ts`
- Create: `apps/pilote-mb-core/src/shared-kernel/uuid.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/shared-kernel/uuid.test.ts
import { describe, it, expect } from 'vitest'
import { Uuid } from './uuid'

describe('Uuid', () => {
  it('generate produit un UUID v4 valide', () => {
    const uuid = Uuid.generate()
    expect(uuid.valueOf()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('from accepte un UUID valide', () => {
    const uuid = Uuid.from('550e8400-e29b-41d4-a716-446655440000')
    expect(uuid.valueOf()).toEqual('550e8400-e29b-41d4-a716-446655440000')
  })

  it('from throw si UUID invalide', () => {
    expect(() => Uuid.from('not-a-uuid')).toThrow()
  })
})
```

- [ ] **Step 2: Lancer le test (échec)**

Run: `pnpm -F @pilote-mb/core test src/shared-kernel/uuid.test.ts`
Expected: échec

- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/shared-kernel/uuid.ts
import { randomUUID } from 'node:crypto'
import { ValueObject } from './value-object'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class Uuid extends ValueObject<string> {
  static generate(): Uuid {
    return new Uuid(randomUUID())
  }

  static from(value: string): Uuid {
    if (!UUID_REGEX.test(value)) {
      throw new Error(`Invalid UUID: ${value}`)
    }
    return new Uuid(value)
  }
}
```

- [ ] **Step 4: Lancer le test (pass)**

Run: `pnpm -F @pilote-mb/core test src/shared-kernel/uuid.test.ts`
Expected: 3 tests passent

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/shared-kernel/uuid.ts apps/pilote-mb-core/src/shared-kernel/uuid.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature: shared-kernel — Uuid VO

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, shared-kernel, ddd
Files-changed: 2"
```

---

### Tâche 14 : Ports techniques (Clock, Transaction, Logger)

**Files:**
- Create: `apps/pilote-mb-core/src/shared-kernel/clock.ts`
- Create: `apps/pilote-mb-core/src/shared-kernel/transaction.ts`
- Create: `apps/pilote-mb-core/src/shared-kernel/logger.ts`

- [ ] **Step 1: Écrire `clock.ts`**

```ts
// src/shared-kernel/clock.ts
export interface Clock {
  now(): Date
}
```

- [ ] **Step 2: Écrire `transaction.ts`**

```ts
// src/shared-kernel/transaction.ts
export interface Transaction {
  run<T>(scope: () => Promise<T>): Promise<T>
}
```

- [ ] **Step 3: Écrire `logger.ts`**

```ts
// src/shared-kernel/logger.ts
export interface Logger {
  info(context: Record<string, unknown>, message: string): void
  warn(context: Record<string, unknown>, message: string): void
  error(context: Record<string, unknown>, message: string): void
  debug(context: Record<string, unknown>, message: string): void
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/src/shared-kernel/clock.ts apps/pilote-mb-core/src/shared-kernel/transaction.ts apps/pilote-mb-core/src/shared-kernel/logger.ts
git commit -m "[DITP-pilotage/pilote-2] feature: shared-kernel — ports techniques Clock, Transaction, Logger

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, shared-kernel, ddd
Files-changed: 3"
```

---

---

## Phase 3 — Platform infrastructure

### Tâche 15 : PrismaPilote wrapper + PrismaTransaction

**Files:**
- Create: `apps/pilote-mb-core/src/platform/persistence/prisma/prisma-transaction.ts`
- Create: `apps/pilote-mb-core/src/platform/persistence/prisma/prisma-pilote.ts`

- [ ] **Step 1: Écrire `prisma-transaction.ts`**

```ts
// src/platform/persistence/prisma/prisma-transaction.ts
import { AsyncLocalStorage } from 'node:async_hooks'
import { PrismaClient } from '@prisma/client'
import { type Transaction } from '@/shared-kernel/transaction'

const prisma = new PrismaClient()

export type PilotePrismaClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
export const txStore = new AsyncLocalStorage<PilotePrismaClient>()

export class PrismaTransaction implements Transaction {
  async run<T>(scope: () => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => txStore.run(tx, scope))
  }
}

export { prisma as prismaClient }
```

- [ ] **Step 2: Écrire `prisma-pilote.ts`**

```ts
// src/platform/persistence/prisma/prisma-pilote.ts
import { PrismaClient } from '@prisma/client'
import { txStore, type PilotePrismaClient, prismaClient } from './prisma-transaction'

export class PrismaPilote {
  getInstance(): PilotePrismaClient {
    return txStore.getStore() ?? prismaClient
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/src/platform/persistence/prisma/
git commit -m "[DITP-pilotage/pilote-2] feature: platform — PrismaPilote wrapper + PrismaTransaction

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, prisma
Tags: pilote-mb, backend, platform, persistence
Files-changed: 2"
```

---

### Tâche 16 : SystemClock adapter

**Files:**
- Create: `apps/pilote-mb-core/src/platform/clock/system-clock.ts`
- Create: `apps/pilote-mb-core/src/platform/clock/system-clock.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/platform/clock/system-clock.test.ts
import { describe, it, expect } from 'vitest'
import { SystemClock } from './system-clock'

describe('SystemClock', () => {
  it('retourne la date courante', () => {
    const clock = new SystemClock()
    const before = Date.now()
    const now = clock.now().getTime()
    const after = Date.now()
    expect(now).toBeGreaterThanOrEqual(before)
    expect(now).toBeLessThanOrEqual(after)
  })
})
```

- [ ] **Step 2: Lancer le test (échec)**

Run: `pnpm -F @pilote-mb/core test src/platform/clock/system-clock.test.ts`
Expected: échec

- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/platform/clock/system-clock.ts
/* eslint-disable no-restricted-syntax */
import { type Clock } from '@/shared-kernel/clock'

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}
```

- [ ] **Step 4: Lancer le test (pass) et commit**

Run: `pnpm -F @pilote-mb/core test src/platform/clock/system-clock.test.ts`

```bash
git add apps/pilote-mb-core/src/platform/clock/
git commit -m "[DITP-pilotage/pilote-2] feature: platform — SystemClock adapter

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, platform
Files-changed: 2"
```

---

### Tâche 17 : LogSink interface + PinoStdoutSink + DatabaseSink + CompositeLogger

**Files:**
- Create: `apps/pilote-mb-core/src/platform/logging/log-sink.ts`
- Create: `apps/pilote-mb-core/src/platform/logging/sinks/pino-stdout.sink.ts`
- Create: `apps/pilote-mb-core/src/platform/logging/sinks/database.sink.ts`
- Create: `apps/pilote-mb-core/src/platform/logging/composite-logger.ts`
- Create: `apps/pilote-mb-core/src/platform/logging/composite-logger.test.ts`
- Create: `apps/pilote-mb-core/src/platform/logging/build-logger.ts`

- [ ] **Step 1: Écrire `log-sink.ts`**

```ts
// src/platform/logging/log-sink.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  readonly level: LogLevel
  readonly timestamp: Date
  readonly message: string
  readonly context: Record<string, unknown>
}

export interface LogSink {
  write(entry: LogEntry): void
}
```

- [ ] **Step 2: Écrire le test du CompositeLogger**

```ts
// src/platform/logging/composite-logger.test.ts
import { describe, it, expect } from 'vitest'
import { CompositeLogger } from './composite-logger'
import { type LogSink, type LogEntry } from './log-sink'

class CapturingSink implements LogSink {
  readonly entries: LogEntry[] = []
  write(entry: LogEntry): void { this.entries.push(entry) }
}

describe('CompositeLogger', () => {
  it('dispatche info vers tous les sinks', () => {
    const sinkA = new CapturingSink()
    const sinkB = new CapturingSink()
    const logger = new CompositeLogger([sinkA, sinkB])

    logger.info({ userId: '42' }, 'hello')

    expect(sinkA.entries).toHaveLength(1)
    expect(sinkA.entries[0]!.level).toEqual('info')
    expect(sinkA.entries[0]!.message).toEqual('hello')
    expect(sinkA.entries[0]!.context).toEqual({ userId: '42' })
    expect(sinkB.entries).toEqual(sinkA.entries)
  })

  it('dispatche error avec bon niveau', () => {
    const sink = new CapturingSink()
    const logger = new CompositeLogger([sink])
    logger.error({ reason: 'boom' }, 'failed')
    expect(sink.entries[0]!.level).toEqual('error')
  })
})
```

- [ ] **Step 3: Écrire `composite-logger.ts`**

```ts
// src/platform/logging/composite-logger.ts
import { type Logger } from '@/shared-kernel/logger'
import { type LogSink, type LogLevel } from './log-sink'

export class CompositeLogger implements Logger {
  constructor(private readonly sinks: ReadonlyArray<LogSink>) {}

  info(context: Record<string, unknown>, message: string): void { this.emit('info', context, message) }
  warn(context: Record<string, unknown>, message: string): void { this.emit('warn', context, message) }
  error(context: Record<string, unknown>, message: string): void { this.emit('error', context, message) }
  debug(context: Record<string, unknown>, message: string): void { this.emit('debug', context, message) }

  private emit(level: LogLevel, context: Record<string, unknown>, message: string): void {
    const entry = { level, timestamp: new Date(), message, context }
    for (const sink of this.sinks) sink.write(entry)
  }
}
```

- [ ] **Step 4: Écrire `pino-stdout.sink.ts`**

```ts
// src/platform/logging/sinks/pino-stdout.sink.ts
import pino from 'pino'
import { type LogSink, type LogEntry } from '../log-sink'

export class PinoStdoutSink implements LogSink {
  private readonly pino: pino.Logger

  constructor(level: string) {
    this.pino = pino({ level })
  }

  write(entry: LogEntry): void {
    this.pino[entry.level](entry.context, entry.message)
  }
}
```

- [ ] **Step 5: Écrire `database.sink.ts`**

```ts
// src/platform/logging/sinks/database.sink.ts
import { type LogSink, type LogEntry, type LogLevel } from '../log-sink'
import { type PrismaPilote } from '@/platform/persistence/prisma/prisma-pilote'

const LEVEL_MAP: Record<LogLevel, 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
}

export class DatabaseSink implements LogSink {
  constructor(private readonly prisma: PrismaPilote) {}

  write(entry: LogEntry): void {
    const requestId = typeof entry.context.requestId === 'string' ? entry.context.requestId : null
    const source = typeof entry.context.source === 'string' ? entry.context.source : null
    const categorie = typeof entry.context.categorie === 'string' ? entry.context.categorie : 'systeme'
    const dureeMs = typeof entry.context.duree_ms === 'number' ? entry.context.duree_ms : null

    void this.prisma
      .getInstance()
      .application_log.create({
        data: {
          level: LEVEL_MAP[entry.level],
          categorie,
          message: entry.message,
          contexte: entry.context as object,
          source,
          duree_ms: dureeMs,
          request_id: requestId,
        },
      })
      .catch(() => { /* best-effort — never crash the app on logging */ })
  }
}
```

- [ ] **Step 6: Écrire `build-logger.ts`**

```ts
// src/platform/logging/build-logger.ts
import { type Config } from '@/config'
import { CompositeLogger } from './composite-logger'
import { PinoStdoutSink } from './sinks/pino-stdout.sink'
import { DatabaseSink } from './sinks/database.sink'
import { type PrismaPilote } from '@/platform/persistence/prisma/prisma-pilote'
import { type LogSink } from './log-sink'

export function buildLogger(config: Config, prisma: PrismaPilote): CompositeLogger {
  const sinks: LogSink[] = [new PinoStdoutSink(config.LOG_LEVEL)]
  if (config.LOG_TO_DATABASE) sinks.push(new DatabaseSink(prisma))
  return new CompositeLogger(sinks)
}
```

- [ ] **Step 7: Lancer les tests et commit**

Run: `pnpm -F @pilote-mb/core test src/platform/logging/`

```bash
git add apps/pilote-mb-core/src/platform/logging/
git commit -m "[DITP-pilotage/pilote-2] feature: platform — CompositeLogger avec sinks composables

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, pino
Tags: pilote-mb, backend, platform, logging
Files-changed: 6"
```

---

### Tâche 18 : InMemoryDomainEventPublisher + AuditLogEventHandler

**Files:**
- Create: `apps/pilote-mb-core/src/platform/events/in-memory-domain-event-publisher.ts`
- Create: `apps/pilote-mb-core/src/platform/events/in-memory-domain-event-publisher.test.ts`
- Create: `apps/pilote-mb-core/src/platform/events/audit-log-event-handler.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/platform/events/in-memory-domain-event-publisher.test.ts
import { describe, it, expect } from 'vitest'
import { InMemoryDomainEventPublisher } from './in-memory-domain-event-publisher'
import { type DomainEventHandler } from '@/shared-kernel/domain-event-handler'
import { type DomainEvent } from '@/shared-kernel/domain-event'

class CapturingHandler implements DomainEventHandler {
  readonly received: DomainEvent[] = []
  constructor(readonly eventType: string) {}
  async handle(event: DomainEvent): Promise<void> { this.received.push(event) }
}

describe('InMemoryDomainEventPublisher', () => {
  it('dispatche chaque event aux handlers qui ont le bon eventType', async () => {
    const fooHandler = new CapturingHandler('FOO')
    const barHandler = new CapturingHandler('BAR')
    const publisher = new InMemoryDomainEventPublisher([fooHandler, barHandler])

    const events: DomainEvent[] = [
      { type: 'FOO', occurredAt: new Date(), aggregateId: 'a1' },
      { type: 'BAR', occurredAt: new Date(), aggregateId: 'a2' },
      { type: 'FOO', occurredAt: new Date(), aggregateId: 'a3' },
    ]
    await publisher.publish(events)

    expect(fooHandler.received).toHaveLength(2)
    expect(barHandler.received).toHaveLength(1)
  })

  it('ignore les events sans handler enregistré', async () => {
    const publisher = new InMemoryDomainEventPublisher([])
    await expect(publisher.publish([
      { type: 'UNKNOWN', occurredAt: new Date(), aggregateId: 'x' },
    ])).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Lancer le test (échec)**

Run: `pnpm -F @pilote-mb/core test src/platform/events/`
Expected: échec

- [ ] **Step 3: Écrire le publisher**

```ts
// src/platform/events/in-memory-domain-event-publisher.ts
import { type DomainEvent } from '@/shared-kernel/domain-event'
import { type DomainEventPublisher } from '@/shared-kernel/domain-event-publisher'
import { type DomainEventHandler } from '@/shared-kernel/domain-event-handler'

export class InMemoryDomainEventPublisher implements DomainEventPublisher {
  private readonly handlersByType: Map<string, DomainEventHandler[]>

  constructor(handlers: ReadonlyArray<DomainEventHandler>) {
    this.handlersByType = new Map()
    for (const handler of handlers) {
      const existing = this.handlersByType.get(handler.eventType) ?? []
      existing.push(handler)
      this.handlersByType.set(handler.eventType, existing)
    }
  }

  async publish(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      const handlers = this.handlersByType.get(event.type) ?? []
      await Promise.all(handlers.map((handler) => handler.handle(event)))
    }
  }
}
```

- [ ] **Step 4: Écrire `audit-log-event-handler.ts`**

```ts
// src/platform/events/audit-log-event-handler.ts
import { type DomainEvent } from '@/shared-kernel/domain-event'
import { type DomainEventHandler } from '@/shared-kernel/domain-event-handler'
import { type Logger } from '@/shared-kernel/logger'

const AUDITED_EVENT_TYPES = ['API_KEY_CREATED', 'API_KEY_REVOKED', 'UTILISATEUR_CREATED'] as const

export class AuditLogEventHandler implements DomainEventHandler {
  readonly eventType = '*'
  private readonly audited = new Set<string>(AUDITED_EVENT_TYPES)

  constructor(private readonly logger: Logger) {}

  async handle(event: DomainEvent): Promise<void> {
    if (!this.audited.has(event.type)) return
    this.logger.info(
      {
        categorie: 'audit',
        source: 'domain-event',
        eventType: event.type,
        aggregateId: event.aggregateId,
      },
      `Domain event: ${event.type}`,
    )
  }
}
```

**Note :** on utilise `eventType = '*'` comme convention pour "handler universel". Le publisher doit alors aussi matcher `*`. Met à jour le publisher pour supporter ça :

- [ ] **Step 5: Mettre à jour le publisher pour supporter `'*'`**

```ts
// Dans InMemoryDomainEventPublisher.publish, remplacer la boucle par :
async publish(events: ReadonlyArray<DomainEvent>): Promise<void> {
  const wildcardHandlers = this.handlersByType.get('*') ?? []
  for (const event of events) {
    const typedHandlers = this.handlersByType.get(event.type) ?? []
    await Promise.all([...typedHandlers, ...wildcardHandlers].map((h) => h.handle(event)))
  }
}
```

Met à jour le test pour couvrir le cas wildcard :

```ts
// Ajouter dans in-memory-domain-event-publisher.test.ts
it('dispatche aux handlers wildcard', async () => {
  const wildcardHandler = new CapturingHandler('*')
  const publisher = new InMemoryDomainEventPublisher([wildcardHandler])
  await publisher.publish([
    { type: 'FOO', occurredAt: new Date(), aggregateId: 'a1' },
    { type: 'BAR', occurredAt: new Date(), aggregateId: 'a2' },
  ])
  expect(wildcardHandler.received).toHaveLength(2)
})
```

- [ ] **Step 6: Lancer les tests et commit**

Run: `pnpm -F @pilote-mb/core test src/platform/events/`

```bash
git add apps/pilote-mb-core/src/platform/events/
git commit -m "[DITP-pilotage/pilote-2] feature: platform — InMemoryDomainEventPublisher + AuditLogEventHandler

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, platform, events, ddd
Files-changed: 3"
```

---

### Tâche 19 : Module-system (define-module, boot-modules, module-names)

**Files:**
- Create: `apps/pilote-mb-core/src/platform/container/module-system/module-names.ts`
- Create: `apps/pilote-mb-core/src/platform/container/module-system/define-module.ts`
- Create: `apps/pilote-mb-core/src/platform/container/module-system/boot-modules.ts`

**Note d'implémentation :** copier/adapter depuis `apps/pilote-ppg/src/server/module-system/` (cf. fichiers `ModuleDef.ts`, `bootModules.ts`, `moduleNames.ts`).

- [ ] **Step 1: Écrire `module-names.ts`**

```ts
// src/platform/container/module-system/module-names.ts
export const moduleNames = [
  'platform',
  'authentication',
  'healthcheck',
] as const

export type ModuleName = (typeof moduleNames)[number]
```

- [ ] **Step 2: Écrire `define-module.ts`**

Copier le contenu depuis `apps/pilote-ppg/src/server/module-system/ModuleDef.ts`, en adaptant :
- Remplacer l'import `"./moduleNames"` par `"./module-names"` et le type `ModuleName` vient du fichier local
- Remplacer l'import `"@/server/shared/module"` par `"@/platform/platform.module"` (le type `PlatformDependencies` sera exporté par `platform.module.ts` créé en T23)
- Garder tous les types `TypedAsFunction`, `TypedAsClass`, `ModuleScope`, `ModuleHelpers`, `ModuleDef`, `defineModule`, `VerifyCradle`, `NoExports`, `ExtractScope`

```ts
// src/platform/container/module-system/define-module.ts
import {
  type AwilixContainer,
  type BuildResolver,
  type BuildResolverOptions,
  type DisposableResolver,
} from 'awilix'
import type { PlatformDependencies } from '@/platform/platform.module'
import type { ModuleName } from './module-names'

export type TypedAsFunction<TCradle> = <T>(
  fn: (cradle: TCradle) => T,
) => BuildResolver<T> & DisposableResolver<T>

export type TypedAsClass<TScope> = <T>(
  Type: new (deps: TScope) => T,
  opts?: BuildResolverOptions<T>,
) => BuildResolver<T> & DisposableResolver<T>

export type ModuleScope<TCradle> = PlatformDependencies & TCradle

export type ModuleHelpers<TCradle> = {
  asModuleFunction: TypedAsFunction<TCradle>
  asModuleClass: TypedAsClass<ModuleScope<TCradle>>
}

export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : K]: T[K]
}

export type ModuleDef<
  TName extends ModuleName,
  TExports extends Record<string, unknown>,
  TCradle extends TExports,
> = {
  name: TName
  imports: ModuleName[]
  exports: (keyof TExports)[]
  register: (
    container: AwilixContainer<RemoveIndexSignature<TCradle>>,
    helpers: ModuleHelpers<TCradle>,
  ) => void
}

export const defineModule =
  <TExports extends Record<string, unknown>, TCradle extends TExports>() =>
  <TName extends ModuleName>(def: ModuleDef<TName, TExports, TCradle>): ModuleDef<TName, TExports, TCradle> =>
    def

export type VerifyCradle<T> = Record<keyof T, unknown>

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NoExports = {}

export type ExtractScope<M> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends ModuleDef<ModuleName, any, infer C> ? ModuleScope<C> : never
```

- [ ] **Step 3: Écrire `boot-modules.ts`**

Même principe : copier depuis `bootModules.ts` de pilote-ppg, renommer les imports pour matcher nos fichiers locaux.

```ts
// src/platform/container/module-system/boot-modules.ts
import {
  asClass,
  asFunction,
  asValue,
  type AwilixContainer,
  createContainer,
  InjectionMode,
} from 'awilix'
import type { ModuleDef, TypedAsClass, TypedAsFunction } from './define-module'
import type { ModuleName } from './module-names'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyModuleDef = ModuleDef<ModuleName, any, any>

export type ExtractCradle<M> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends ModuleDef<ModuleName, any, infer C> ? C : never

export const bootModules = <TModules extends readonly AnyModuleDef[]>(
  modules: [...TModules],
): {
  getContainer: <N extends TModules[number]['name']>(
    name: N,
  ) => AwilixContainer<ExtractCradle<Extract<TModules[number], { name: N }>>>
} => {
  const containers = new Map<string, AwilixContainer>()

  const rootModule = modules.find((m) => m.imports.length === 0)
  if (!rootModule) throw new Error('No root module found (a module with empty imports is required)')

  const rootContainer = createContainer({ injectionMode: InjectionMode.PROXY, strict: true })

  const helpers = {
    asModuleFunction: asFunction as unknown as TypedAsFunction<never>,
    asModuleClass: asClass as unknown as TypedAsClass<never>,
  }

  rootModule.register(rootContainer, helpers)
  containers.set(rootModule.name, rootContainer)

  for (const mod of modules) {
    if (mod === rootModule) continue
    const scope = rootContainer.createScope()
    mod.register(scope, helpers)
    containers.set(mod.name, scope)
  }

  for (const mod of modules) {
    if (mod === rootModule) continue
    const container = containers.get(mod.name)!
    for (const importName of mod.imports) {
      if (importName === rootModule.name) continue
      const importedModule = modules.find((m) => m.name === importName)
      if (!importedModule) throw new Error(`Module "${mod.name}" imports unknown module "${importName}"`)
      const importedContainer = containers.get(importName)!
      for (const exportKey of importedModule.exports) {
        container.register({
          [exportKey as string]: asValue(importedContainer.resolve(exportKey as string)),
        })
      }
    }
  }

  return {
    getContainer: (name) => {
      const container = containers.get(name)
      if (!container) throw new Error(`Module "${name}" not found`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return container as any
    },
  }
}
```

- [ ] **Step 4: Vérifier la compilation**

Run: `pnpm -F @pilote-mb/core exec tsc --noEmit`
Expected: erreur attendue sur `@/platform/platform.module` (pas encore créé) — acceptable, sera résolu en T23

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/platform/container/module-system/
git commit -m "[DITP-pilotage/pilote-2] feature: platform — module-system adapte de pilote-ppg

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, awilix
Tags: pilote-mb, backend, platform, di
Files-changed: 3"
```

---

### Tâche 20 : platform.module.ts

**Files:**
- Create: `apps/pilote-mb-core/src/platform/platform.module.ts`

- [ ] **Step 1: Écrire `platform.module.ts`**

```ts
// src/platform/platform.module.ts
import { defineModule, type NoExports, type VerifyCradle } from './container/module-system/define-module'
import { type Clock } from '@/shared-kernel/clock'
import { type Transaction } from '@/shared-kernel/transaction'
import { type Logger } from '@/shared-kernel/logger'
import { type DomainEventPublisher } from '@/shared-kernel/domain-event-publisher'
import { type Config } from '@/config'
import { config } from '@/config'
import { PrismaPilote } from './persistence/prisma/prisma-pilote'
import { PrismaTransaction } from './persistence/prisma/prisma-transaction'
import { SystemClock } from './clock/system-clock'
import { buildLogger } from './logging/build-logger'
import { InMemoryDomainEventPublisher } from './events/in-memory-domain-event-publisher'
import { AuditLogEventHandler } from './events/audit-log-event-handler'

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
      prisma: asModuleFunction(() => new PrismaPilote()).singleton(),
      transaction: asModuleFunction(() => new PrismaTransaction()).singleton(),
      config: asModuleFunction(() => config).singleton(),
      clock: asModuleClass(SystemClock).singleton(),
      logger: asModuleFunction(({ prisma }) => buildLogger(config, prisma as PrismaPilote)).singleton(),
      domainEventPublisher: asModuleFunction(({ logger }) =>
        new InMemoryDomainEventPublisher([new AuditLogEventHandler(logger as Logger)]),
      ).singleton(),
    } satisfies VerifyCradle<PlatformCradle>)
  },
})
```

- [ ] **Step 2: Vérifier la compilation**

Run: `pnpm -F @pilote-mb/core exec tsc --noEmit`
Expected: compilation OK

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/src/platform/platform.module.ts
git commit -m "[DITP-pilotage/pilote-2] feature: platform — platform.module.ts avec cradle typé

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, awilix
Tags: pilote-mb, backend, platform, di
Files-changed: 1"
```

---

## Phase 4 — HTTP platform (error handling + middlewares + app)

### Tâche 21 : Error mapping + respond-with-result helper

**Files:**
- Create: `apps/pilote-mb-core/src/platform/http/error-mapping.ts`
- Create: `apps/pilote-mb-core/src/platform/http/error-mapping.test.ts`
- Create: `apps/pilote-mb-core/src/platform/http/respond-with-result.ts`
- Create: `apps/pilote-mb-core/src/platform/http/schemas/error.schema.ts`

- [ ] **Step 1: Écrire `error.schema.ts`**

```ts
// src/platform/http/schemas/error.schema.ts
import { z } from '@hono/zod-openapi'

export const ErrorSchema = z.object({
  code: z.string().describe('Code stable identifiant le type d\'erreur (ex: ENTITY_NOT_FOUND)'),
  message: z.string().describe('Message français lisible pour un humain'),
  details: z.record(z.string(), z.unknown()).optional().describe('Détails additionnels optionnels'),
}).openapi('Error')

export type ErrorResponse = z.infer<typeof ErrorSchema>
```

- [ ] **Step 2: Écrire le test du mapping**

```ts
// src/platform/http/error-mapping.test.ts
import { describe, it, expect } from 'vitest'
import { mapDomainErrorToHttpStatus } from './error-mapping'
import { DomainError } from '@/shared-kernel/domain-error'

class FakeError extends DomainError {
  readonly code = 'FAKE'
  constructor(readonly kind: DomainError['kind']) { super('fake') }
}

describe('mapDomainErrorToHttpStatus', () => {
  it.each([
    ['not-found', 404],
    ['validation', 400],
    ['conflict', 409],
    ['forbidden', 403],
    ['unauthorized', 401],
    ['not-implemented', 501],
    ['internal', 500],
  ] as const)('%s -> %d', (kind, expected) => {
    const error = new FakeError(kind)
    expect(mapDomainErrorToHttpStatus(error)).toEqual(expected)
  })
})
```

- [ ] **Step 3: Écrire `error-mapping.ts`**

```ts
// src/platform/http/error-mapping.ts
import { type DomainError, type DomainErrorKind } from '@/shared-kernel/domain-error'

const KIND_TO_STATUS: Record<DomainErrorKind, number> = {
  'not-found': 404,
  'validation': 400,
  'conflict': 409,
  'forbidden': 403,
  'unauthorized': 401,
  'not-implemented': 501,
  'internal': 500,
}

export const mapDomainErrorToHttpStatus = (error: DomainError): number => KIND_TO_STATUS[error.kind]
```

- [ ] **Step 4: Écrire `respond-with-result.ts`**

```ts
// src/platform/http/respond-with-result.ts
import { type Context } from 'hono'
import { type Result } from '@/shared-kernel/result'
import { type DomainError } from '@/shared-kernel/domain-error'
import { mapDomainErrorToHttpStatus } from './error-mapping'

export async function respondWithResult<TValue, TError extends DomainError>(
  context: Context,
  result: Result<TValue, TError>,
  onSuccess: (value: TValue) => Response,
): Promise<Response> {
  if (result.isErr()) {
    return context.json(
      {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mapDomainErrorToHttpStatus(result.error) as any,
    )
  }
  return onSuccess(result.value)
}
```

- [ ] **Step 5: Lancer les tests et commit**

Run: `pnpm -F @pilote-mb/core test src/platform/http/`

```bash
git add apps/pilote-mb-core/src/platform/http/
git commit -m "[DITP-pilotage/pilote-2] feature: platform — error mapping + respond-with-result + ErrorSchema

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, hono, zod
Tags: pilote-mb, backend, platform, http, errors
Files-changed: 4"
```

---

### Tâche 22 : Middlewares HTTP (request-id, logger, error-handler)

**Files:**
- Create: `apps/pilote-mb-core/src/platform/http/middlewares/request-id.middleware.ts`
- Create: `apps/pilote-mb-core/src/platform/http/middlewares/logger.middleware.ts`
- Create: `apps/pilote-mb-core/src/platform/http/middlewares/error-handler.middleware.ts`

- [ ] **Step 1: Écrire `request-id.middleware.ts`**

```ts
// src/platform/http/middlewares/request-id.middleware.ts
import { randomUUID } from 'node:crypto'
import { type MiddlewareHandler } from 'hono'

export const requestIdMiddleware = (): MiddlewareHandler => async (context, next) => {
  const incoming = context.req.header('x-request-id')
  const requestId = incoming && incoming.length > 0 ? incoming : randomUUID()
  context.set('requestId', requestId)
  context.header('x-request-id', requestId)
  await next()
}
```

- [ ] **Step 2: Écrire `logger.middleware.ts`**

```ts
// src/platform/http/middlewares/logger.middleware.ts
import { type MiddlewareHandler } from 'hono'
import { type Logger } from '@/shared-kernel/logger'

export const loggerMiddleware = (logger: Logger): MiddlewareHandler => async (context, next) => {
  const start = Date.now()
  const requestId = context.get('requestId')
  const method = context.req.method
  const url = context.req.url

  logger.info({ requestId, method, url, source: 'http' }, 'request started')

  await next()

  const duree_ms = Date.now() - start
  const status = context.res.status
  logger.info(
    { requestId, method, url, status, duree_ms, source: 'http' },
    `request completed ${status}`,
  )
}
```

- [ ] **Step 3: Écrire `error-handler.middleware.ts`**

```ts
// src/platform/http/middlewares/error-handler.middleware.ts
import { type OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { DomainError } from '@/shared-kernel/domain-error'
import { type Logger } from '@/shared-kernel/logger'
import { mapDomainErrorToHttpStatus } from '../error-mapping'

export function registerErrorHandler(app: OpenAPIHono, logger: Logger): void {
  app.onError((error, context) => {
    const requestId = context.get('requestId') ?? undefined
    const url = context.req.url
    const method = context.req.method

    if (error instanceof DomainError) {
      logger.warn({ code: error.code, url, method, requestId }, error.message)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return context.json(
        { code: error.code, message: error.message, details: error.details },
        mapDomainErrorToHttpStatus(error) as any,
      )
    }

    if (error instanceof HTTPException) {
      logger.warn({ url, method, requestId, status: error.status }, error.message)
      const code = error.status === 401 ? 'UNAUTHORIZED' : error.status === 403 ? 'FORBIDDEN' : 'HTTP_EXCEPTION'
      return context.json({ code, message: error.message }, error.status)
    }

    if (error instanceof ZodError) {
      logger.warn({ url, method, requestId, issues: error.issues }, 'Validation error')
      return context.json(
        { code: 'VALIDATION_ERROR', message: 'Les données fournies sont invalides', details: { issues: error.issues } },
        400,
      )
    }

    logger.error(
      { url, method, requestId, stack: error.stack, name: error.name },
      `Unhandled error: ${error.message}`,
    )
    return context.json({ code: 'INTERNAL_SERVER_ERROR', message: 'Une erreur interne est survenue' }, 500)
  })

  app.notFound((context) =>
    context.json(
      { code: 'ROUTE_NOT_FOUND', message: `Route ${context.req.method} ${context.req.url} introuvable` },
      404,
    ),
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/src/platform/http/middlewares/
git commit -m "[DITP-pilotage/pilote-2] feature: platform — middlewares request-id, logger, error-handler

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, hono
Tags: pilote-mb, backend, platform, http, middlewares
Files-changed: 3"
```

---

### Tâche 23 : buildApp avec Swagger UI

**Files:**
- Create: `apps/pilote-mb-core/src/platform/http/app.ts`

- [ ] **Step 1: Écrire `app.ts`**

```ts
// src/platform/http/app.ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { type AwilixContainer } from 'awilix'
import { requestIdMiddleware } from './middlewares/request-id.middleware'
import { loggerMiddleware } from './middlewares/logger.middleware'
import { registerErrorHandler } from './middlewares/error-handler.middleware'
import { type Logger } from '@/shared-kernel/logger'

export type RegisterRoutes = (app: OpenAPIHono) => void

export function buildApp(params: {
  logger: Logger
  authMiddleware: (app: OpenAPIHono) => void
  registrations: ReadonlyArray<RegisterRoutes>
}): OpenAPIHono {
  const app = new OpenAPIHono()

  app.use('*', requestIdMiddleware())
  app.use('*', loggerMiddleware(params.logger))

  params.authMiddleware(app)

  for (const register of params.registrations) register(app)

  registerErrorHandler(app, params.logger)

  app.doc('/api/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Pilote MB Core API', version: '0.1.0' },
    tags: [
      { name: 'Health', description: 'Healthcheck' },
      { name: 'Authentication', description: 'Gestion des sessions et API keys' },
    ],
  })

  app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))

  return app
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/platform/http/app.ts
git commit -m "[DITP-pilotage/pilote-2] feature: platform — buildApp + Swagger UI + OpenAPI JSON

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, hono
Tags: pilote-mb, backend, platform, http, openapi
Files-changed: 1"
```

---

### Tâche 24 : build-app-container

**Files:**
- Create: `apps/pilote-mb-core/src/platform/container/build-app-container.ts`

- [ ] **Step 1: Écrire `build-app-container.ts`**

```ts
// src/platform/container/build-app-container.ts
import { bootModules } from './module-system/boot-modules'
import { platformModule } from '@/platform/platform.module'
import { authenticationModule } from '@/authentication/authentication.module'
import { healthcheckModule } from '@/healthcheck/healthcheck.module'

export function buildAppContainer() {
  return bootModules([platformModule, authenticationModule, healthcheckModule])
}
```

**Note :** les imports de `authenticationModule` et `healthcheckModule` échoueront tant que ces modules ne sont pas créés. Laisser le fichier avec ces imports — les erreurs de compilation seront résolues à T37 et T60.

- [ ] **Step 2: Commit (même si le TS ne compile pas encore entièrement)**

```bash
git add apps/pilote-mb-core/src/platform/container/build-app-container.ts
git commit -m "[DITP-pilotage/pilote-2] feature: platform — build-app-container (imports encore en attente des BCs)

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, awilix
Tags: pilote-mb, backend, platform, di
Files-changed: 1"
```

---

## Phase 5 — Test infrastructure

### Tâche 25 : FakeClock

**Files:**
- Create: `apps/pilote-mb-core/src/test/fake-clock.ts`
- Create: `apps/pilote-mb-core/src/test/fake-clock.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/test/fake-clock.test.ts
import { describe, it, expect } from 'vitest'
import { FakeClock } from './fake-clock'

describe('FakeClock', () => {
  it('retourne la date fixée à la construction', () => {
    const clock = new FakeClock(new Date('2026-04-24T10:00:00Z'))
    expect(clock.now()).toEqual(new Date('2026-04-24T10:00:00Z'))
  })

  it('setNow change la date retournée', () => {
    const clock = new FakeClock(new Date('2026-04-24T10:00:00Z'))
    clock.setNow(new Date('2026-04-25T00:00:00Z'))
    expect(clock.now()).toEqual(new Date('2026-04-25T00:00:00Z'))
  })
})
```

- [ ] **Step 2: Écrire l'implémentation**

```ts
// src/test/fake-clock.ts
/* eslint-disable no-restricted-syntax */
import { type Clock } from '@/shared-kernel/clock'

export class FakeClock implements Clock {
  private current: Date

  constructor(initial: Date) {
    this.current = new Date(initial.getTime())
  }

  now(): Date {
    return new Date(this.current.getTime())
  }

  setNow(newDate: Date): void {
    this.current = new Date(newDate.getTime())
  }
}
```

- [ ] **Step 3: Lancer les tests et commit**

Run: `pnpm -F @pilote-mb/core test src/test/fake-clock.test.ts`

```bash
git add apps/pilote-mb-core/src/test/fake-clock.ts apps/pilote-mb-core/src/test/fake-clock.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature: test — FakeClock pour tests deterministes

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, test, tooling
Files-changed: 2"
```

---

### Tâche 26 : withTestTransaction + TestContext

**Files:**
- Create: `apps/pilote-mb-core/src/test/test-context.ts`
- Create: `apps/pilote-mb-core/src/test/with-test-transaction.ts`
- Create: `apps/pilote-mb-core/src/test/vitest.setup.ts`

- [ ] **Step 1: Écrire `test-context.ts`**

```ts
// src/test/test-context.ts
import { type AwilixContainer } from 'awilix'
import { type ModuleName } from '@/platform/container/module-system/module-names'
import { type buildAppContainer } from '@/platform/container/build-app-container'

type GetContainer = ReturnType<typeof buildAppContainer>['getContainer']

export class TestContext {
  constructor(private readonly getContainerFn: GetContainer) {}

  container<N extends ModuleName>(name: N): AwilixContainer {
    return this.getContainerFn(name)
  }

  resolve<T>(moduleName: ModuleName, key: string): T {
    return this.getContainerFn(moduleName).resolve<T>(key)
  }
}
```

- [ ] **Step 2: Écrire `with-test-transaction.ts`**

```ts
// src/test/with-test-transaction.ts
import { buildAppContainer } from '@/platform/container/build-app-container'
import { txStore, prismaClient } from '@/platform/persistence/prisma/prisma-transaction'
import { TestContext } from './test-context'

class RollbackSignal extends Error {
  constructor() { super('ROLLBACK') }
}

let cachedBoot: ReturnType<typeof buildAppContainer> | null = null
function getBootedContainer(): ReturnType<typeof buildAppContainer> {
  if (!cachedBoot) cachedBoot = buildAppContainer()
  return cachedBoot
}

export function withTestTransaction(
  runTest: (testContext: TestContext) => Promise<void>,
): () => Promise<void> {
  return async () => {
    const boot = getBootedContainer()
    try {
      await prismaClient.$transaction(async (tx) => {
        await txStore.run(tx, async () => {
          const testContext = new TestContext(boot.getContainer)
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

- [ ] **Step 3: Écrire `vitest.setup.ts`**

```ts
// src/test/vitest.setup.ts
import { afterAll } from 'vitest'
import { prismaClient } from '@/platform/persistence/prisma/prisma-transaction'

afterAll(async () => {
  await prismaClient.$disconnect()
})
```

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/src/test/
git commit -m "[DITP-pilotage/pilote-2] feature: test — withTestTransaction + TestContext + vitest.setup

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, vitest
Tags: pilote-mb, backend, test, tooling
Files-changed: 3"
```

---

---

## Phase 6 — BC healthcheck

### Tâche 27 : CheckHealthHandler + test

**Files:**
- Create: `apps/pilote-mb-core/src/healthcheck/application/queries/check-health/check-health.handler.ts`
- Create: `apps/pilote-mb-core/src/healthcheck/application/queries/check-health/check-health.handler.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/healthcheck/application/queries/check-health/check-health.handler.test.ts
import { describe, it, expect } from 'vitest'
import { withTestTransaction } from '@/test/with-test-transaction'
import { CheckHealthHandler } from './check-health.handler'

describe('CheckHealthHandler', () => {
  it('retourne status ok quand la DB répond', withTestTransaction(async (testContext) => {
    // Given
    const handler = testContext.resolve<CheckHealthHandler>('healthcheck', 'checkHealthHandler')

    // When
    const result = await handler.executer()

    // Then
    expect(result.status).toEqual('ok')
    expect(result.database).toEqual('reachable')
  }))
})
```

- [ ] **Step 2: Écrire l'implémentation**

```ts
// src/healthcheck/application/queries/check-health/check-health.handler.ts
import { type Inject } from '@/healthcheck/healthcheck.module'

export type HealthStatus = {
  status: 'ok' | 'degraded'
  database: 'reachable' | 'unreachable'
}

export class CheckHealthHandler {
  constructor(private readonly deps: Inject<'prisma'>) {}

  async executer(): Promise<HealthStatus> {
    try {
      await this.deps.prisma.getInstance().$queryRaw`SELECT 1`
      return { status: 'ok', database: 'reachable' }
    } catch {
      return { status: 'degraded', database: 'unreachable' }
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/src/healthcheck/application/
git commit -m "[DITP-pilotage/pilote-2] feature: healthcheck — CheckHealthHandler avec ping DB

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, healthcheck
Files-changed: 2"
```

---

### Tâche 28 : healthcheck.module.ts + route

**Files:**
- Create: `apps/pilote-mb-core/src/healthcheck/healthcheck.module.ts`
- Create: `apps/pilote-mb-core/src/healthcheck/infrastructure/http/routes/health.route.ts`
- Create: `apps/pilote-mb-core/src/healthcheck/public/healthcheck.facade.ts`

- [ ] **Step 1: Écrire `healthcheck.facade.ts`**

```ts
// src/healthcheck/public/healthcheck.facade.ts
export interface HealthcheckFacade {
  isHealthy(): Promise<boolean>
}
```

- [ ] **Step 2: Écrire `healthcheck.module.ts`**

```ts
// src/healthcheck/healthcheck.module.ts
import { defineModule, type ExtractScope, type NoExports, type VerifyCradle } from '@/platform/container/module-system/define-module'
import { CheckHealthHandler } from './application/queries/check-health/check-health.handler'

type HealthcheckCradle = {
  checkHealthHandler: CheckHealthHandler
}

export const healthcheckModule = defineModule<NoExports, HealthcheckCradle>()({
  name: 'healthcheck',
  imports: ['platform'],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      checkHealthHandler: asModuleClass(CheckHealthHandler).singleton(),
    } satisfies VerifyCradle<HealthcheckCradle>)
  },
})

type Scope = ExtractScope<typeof healthcheckModule>
export type Inject<K extends keyof Scope> = Pick<Scope, K>
```

- [ ] **Step 3: Écrire `health.route.ts`**

```ts
// src/healthcheck/infrastructure/http/routes/health.route.ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { type AwilixContainer } from 'awilix'
import { type CheckHealthHandler } from '@/healthcheck/application/queries/check-health/check-health.handler'

const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['reachable', 'unreachable']),
}).openapi('Health')

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Healthcheck technique',
  description: 'Vérifie que le backend répond et que la base de données est joignable. Route publique (pas d\'auth requise).',
  responses: {
    200: { description: 'Service en bonne santé', content: { 'application/json': { schema: HealthResponseSchema } } },
  },
})

export function registerHealthRoute(app: OpenAPIHono, container: AwilixContainer): void {
  app.openapi(healthRoute, async (context) => {
    const handler = container.resolve<CheckHealthHandler>('checkHealthHandler')
    const result = await handler.executer()
    return context.json(result, 200)
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/src/healthcheck/
git commit -m "[DITP-pilotage/pilote-2] feature: healthcheck — module.ts + facade + route GET /health

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, hono
Tags: pilote-mb, backend, healthcheck
Files-changed: 3"
```

---

## Phase 7 — BC authentication : domain api-key

### Tâche 29 : VOs api-key-id + scope

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/api-key-id.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/api-key-id.test.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/scope.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/scope.test.ts`

- [ ] **Step 1: Écrire `api-key-id.ts` avec son test**

Test :
```ts
// src/authentication/domain/api-key/api-key-id.test.ts
import { describe, it, expect } from 'vitest'
import { ApiKeyId } from './api-key-id'

describe('ApiKeyId', () => {
  it('generate produit un nouvel ApiKeyId', () => {
    const id = ApiKeyId.generate()
    expect(id.valueOf()).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('from accepte un UUID valide', () => {
    const id = ApiKeyId.from('550e8400-e29b-41d4-a716-446655440000')
    expect(id.valueOf()).toEqual('550e8400-e29b-41d4-a716-446655440000')
  })
})
```

Impl :
```ts
// src/authentication/domain/api-key/api-key-id.ts
import { Uuid } from '@/shared-kernel/uuid'

export class ApiKeyId extends Uuid {
  static override generate(): ApiKeyId {
    return new ApiKeyId(Uuid.generate().valueOf())
  }
  static override from(value: string): ApiKeyId {
    return new ApiKeyId(Uuid.from(value).valueOf())
  }
}
```

- [ ] **Step 2: Écrire `scope.ts` avec son test**

Test :
```ts
// src/authentication/domain/api-key/scope.test.ts
import { describe, it, expect } from 'vitest'
import { Scope } from './scope'

describe('Scope', () => {
  it('accepte le format resource:action', () => {
    const scope = Scope.from('entities:read')
    expect(scope.valueOf()).toEqual('entities:read')
  })

  it('throw si format invalide', () => {
    expect(() => Scope.from('invalid')).toThrow()
    expect(() => Scope.from('no_action:')).toThrow()
    expect(() => Scope.from(':no_resource')).toThrow()
  })

  it('equals compare les valeurs', () => {
    expect(Scope.from('a:b').equals(Scope.from('a:b'))).toEqual(true)
    expect(Scope.from('a:b').equals(Scope.from('a:c'))).toEqual(false)
  })
})
```

Impl :
```ts
// src/authentication/domain/api-key/scope.ts
import { ValueObject } from '@/shared-kernel/value-object'

const SCOPE_REGEX = /^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/

export class Scope extends ValueObject<string> {
  static from(value: string): Scope {
    if (!SCOPE_REGEX.test(value)) throw new Error(`Invalid scope format: ${value}`)
    return new Scope(value)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/domain/api-key/api-key-id.ts apps/pilote-mb-core/src/authentication/domain/api-key/api-key-id.test.ts apps/pilote-mb-core/src/authentication/domain/api-key/scope.ts apps/pilote-mb-core/src/authentication/domain/api-key/scope.test.ts
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — VOs ApiKeyId + Scope

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, domain, ddd
Files-changed: 4"
```

---

### Tâche 30 : Errors api-key (3 erreurs domain)

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/errors/invalid-api-key-name.error.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/errors/api-key-scopes-required.error.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/errors/api-key-already-revoked.error.ts`

- [ ] **Step 1: Écrire les 3 erreurs**

```ts
// src/authentication/domain/api-key/errors/invalid-api-key-name.error.ts
import { DomainError } from '@/shared-kernel/domain-error'

export class InvalidApiKeyNameError extends DomainError {
  readonly code = 'INVALID_API_KEY_NAME'
  readonly kind = 'validation' as const
  constructor() { super('Le nom de la clé API ne peut pas être vide') }
}
```

```ts
// src/authentication/domain/api-key/errors/api-key-scopes-required.error.ts
import { DomainError } from '@/shared-kernel/domain-error'

export class ApiKeyScopesRequiredError extends DomainError {
  readonly code = 'API_KEY_SCOPES_REQUIRED'
  readonly kind = 'validation' as const
  constructor() { super('Au moins un scope est requis pour créer une clé API') }
}
```

```ts
// src/authentication/domain/api-key/errors/api-key-already-revoked.error.ts
import { DomainError } from '@/shared-kernel/domain-error'

export class ApiKeyAlreadyRevokedError extends DomainError {
  readonly code = 'API_KEY_ALREADY_REVOKED'
  readonly kind = 'conflict' as const
  constructor() { super('Cette clé API est déjà révoquée') }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/domain/api-key/errors/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — errors domain pour ApiKey

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, domain, ddd
Files-changed: 3"
```

---

### Tâche 31 : Events api-key (created + revoked)

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/events/api-key-created.event.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/events/api-key-revoked.event.ts`

- [ ] **Step 1: Écrire les events**

```ts
// src/authentication/domain/api-key/events/api-key-created.event.ts
import { type DomainEvent } from '@/shared-kernel/domain-event'

export class ApiKeyCreatedEvent implements DomainEvent {
  readonly type = 'API_KEY_CREATED'
  constructor(
    readonly aggregateId: string,
    readonly nom: string,
    readonly occurredAt: Date,
  ) {}
}
```

```ts
// src/authentication/domain/api-key/events/api-key-revoked.event.ts
import { type DomainEvent } from '@/shared-kernel/domain-event'

export class ApiKeyRevokedEvent implements DomainEvent {
  readonly type = 'API_KEY_REVOKED'
  constructor(readonly aggregateId: string, readonly occurredAt: Date) {}
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/domain/api-key/events/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — events ApiKeyCreated + ApiKeyRevoked

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, domain, ddd, events
Files-changed: 2"
```

---

### Tâche 32 : Ports api-key-hasher + token-generator + api-key-repository

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/api-key-hasher.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/token-generator.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/api-key.repository.ts`

- [ ] **Step 1: Écrire les ports**

```ts
// src/authentication/domain/api-key/api-key-hasher.ts
export interface ApiKeyHasher {
  hash(token: string): string
}
```

```ts
// src/authentication/domain/api-key/token-generator.ts
export interface TokenGenerator {
  generate(prefix: 'pmb_live_' | 'pmb_test_'): string
}
```

```ts
// src/authentication/domain/api-key/api-key.repository.ts
import { type ApiKey } from './api-key'

export interface ApiKeyRepository {
  save(aggregate: ApiKey): Promise<void>
  findByKeyHash(keyHash: string): Promise<ApiKey | null>
  findById(id: string): Promise<ApiKey | null>
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/domain/api-key/api-key-hasher.ts apps/pilote-mb-core/src/authentication/domain/api-key/token-generator.ts apps/pilote-mb-core/src/authentication/domain/api-key/api-key.repository.ts
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — ports ApiKeyHasher, TokenGenerator, ApiKeyRepository

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, domain, ddd
Files-changed: 3"
```

---

### Tâche 33 : AggregateRoot ApiKey + factory create + revoke

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/api-key.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/api-key/api-key.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
// src/authentication/domain/api-key/api-key.test.ts
import { describe, it, expect } from 'vitest'
import { ApiKey } from './api-key'
import { Scope } from './scope'
import { FakeClock } from '@/test/fake-clock'
import { type ApiKeyHasher } from './api-key-hasher'
import { type TokenGenerator } from './token-generator'
import { InvalidApiKeyNameError } from './errors/invalid-api-key-name.error'
import { ApiKeyScopesRequiredError } from './errors/api-key-scopes-required.error'
import { ApiKeyAlreadyRevokedError } from './errors/api-key-already-revoked.error'

const fakeHasher: ApiKeyHasher = { hash: (token) => `hashed:${token}` }
const fakeTokenGenerator: TokenGenerator = { generate: (prefix) => `${prefix}rawtoken123456` }
const fixedClock = new FakeClock(new Date('2026-04-24T10:00:00Z'))

describe('ApiKey.create', () => {
  it('crée un agrégat et retourne le token brut + émet un event', () => {
    // When
    const result = ApiKey.create({
      nom: 'agent-satellite',
      scopes: [Scope.from('entities:read')],
      environment: 'live',
      hasher: fakeHasher,
      tokenGenerator: fakeTokenGenerator,
      clock: fixedClock,
    })

    // Then
    expect(result.isOk()).toEqual(true)
    const value = result._unsafeUnwrap()
    expect(value.rawToken).toEqual('pmb_live_rawtoken123456')
    const events = value.aggregate.pullPendingEvents()
    expect(events).toHaveLength(1)
    expect(events[0]!.type).toEqual('API_KEY_CREATED')
    expect(events[0]!.occurredAt).toEqual(new Date('2026-04-24T10:00:00Z'))
  })

  it('retourne InvalidApiKeyNameError si le nom est vide', () => {
    const result = ApiKey.create({
      nom: '   ',
      scopes: [Scope.from('a:b')],
      environment: 'live',
      hasher: fakeHasher,
      tokenGenerator: fakeTokenGenerator,
      clock: fixedClock,
    })
    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidApiKeyNameError)
  })

  it('retourne ApiKeyScopesRequiredError si la liste de scopes est vide', () => {
    const result = ApiKey.create({
      nom: 'x',
      scopes: [],
      environment: 'live',
      hasher: fakeHasher,
      tokenGenerator: fakeTokenGenerator,
      clock: fixedClock,
    })
    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApiKeyScopesRequiredError)
  })
})

describe('ApiKey.revoke', () => {
  it('passe active à false et émet ApiKeyRevokedEvent', () => {
    const created = ApiKey.create({
      nom: 'x',
      scopes: [Scope.from('a:b')],
      environment: 'live',
      hasher: fakeHasher,
      tokenGenerator: fakeTokenGenerator,
      clock: fixedClock,
    })._unsafeUnwrap().aggregate
    created.pullPendingEvents()

    const result = created.revoke(fixedClock)

    expect(result.isOk()).toEqual(true)
    expect(created.estActive()).toEqual(false)
    const events = created.pullPendingEvents()
    expect(events[0]!.type).toEqual('API_KEY_REVOKED')
  })

  it('retourne ApiKeyAlreadyRevokedError si déjà révoquée', () => {
    const created = ApiKey.create({
      nom: 'x',
      scopes: [Scope.from('a:b')],
      environment: 'live',
      hasher: fakeHasher,
      tokenGenerator: fakeTokenGenerator,
      clock: fixedClock,
    })._unsafeUnwrap().aggregate
    created.revoke(fixedClock)

    const result = created.revoke(fixedClock)

    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ApiKeyAlreadyRevokedError)
  })
})
```

- [ ] **Step 2: Écrire l'implémentation**

```ts
// src/authentication/domain/api-key/api-key.ts
import { AggregateRoot } from '@/shared-kernel/aggregate-root'
import { ok, err, type Result } from '@/shared-kernel/result'
import { type Clock } from '@/shared-kernel/clock'
import { type DomainError } from '@/shared-kernel/domain-error'
import { ApiKeyId } from './api-key-id'
import { Scope } from './scope'
import { type ApiKeyHasher } from './api-key-hasher'
import { type TokenGenerator } from './token-generator'
import { ApiKeyCreatedEvent } from './events/api-key-created.event'
import { ApiKeyRevokedEvent } from './events/api-key-revoked.event'
import { InvalidApiKeyNameError } from './errors/invalid-api-key-name.error'
import { ApiKeyScopesRequiredError } from './errors/api-key-scopes-required.error'
import { ApiKeyAlreadyRevokedError } from './errors/api-key-already-revoked.error'

export type ApiKeyPersistenceShape = {
  id: string
  nom: string
  key_hash: string
  key_prefix: string
  scopes: string[]
  active: boolean
  date_creation: Date
  date_derniere_utilisation: Date | null
}

export class ApiKey extends AggregateRoot<ApiKeyId> {
  private constructor(
    id: ApiKeyId,
    readonly nom: string,
    readonly keyHash: string,
    readonly keyPrefix: string,
    readonly scopes: ReadonlyArray<Scope>,
    private active: boolean,
    readonly dateCreation: Date,
    readonly dateDerniereUtilisation: Date | null,
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

    const prefix: 'pmb_live_' | 'pmb_test_' = params.environment === 'live' ? 'pmb_live_' : 'pmb_test_'
    const rawToken = params.tokenGenerator.generate(prefix)
    const keyHash = params.hasher.hash(rawToken)
    const keyPrefix = rawToken.slice(0, 12)
    const now = params.clock.now()

    const aggregate = new ApiKey(
      ApiKeyId.generate(),
      params.nom.trim(),
      keyHash,
      keyPrefix,
      params.scopes,
      true,
      now,
      null,
    )
    aggregate.recordEvent(new ApiKeyCreatedEvent(aggregate.id.valueOf(), aggregate.nom, now))
    return ok({ aggregate, rawToken })
  }

  static reconstitute(row: ApiKeyPersistenceShape): ApiKey {
    return new ApiKey(
      ApiKeyId.from(row.id),
      row.nom,
      row.key_hash,
      row.key_prefix,
      row.scopes.map((scope) => Scope.from(scope)),
      row.active,
      row.date_creation,
      row.date_derniere_utilisation,
    )
  }

  revoke(clock: Clock): Result<void, DomainError> {
    if (!this.active) return err(new ApiKeyAlreadyRevokedError())
    this.active = false
    this.recordEvent(new ApiKeyRevokedEvent(this.id.valueOf(), clock.now()))
    return ok(undefined)
  }

  estActive(): boolean {
    return this.active
  }

  hasScope(expected: Scope): boolean {
    return this.scopes.some((scope) => scope.equals(expected))
  }
}
```

- [ ] **Step 3: Ajouter une exception ESLint pour le fichier `api-key.ts`**

Dans `.eslintrc.cjs`, section `overrides`, ajouter :
```js
{
  files: ['**/api-key.ts', '**/utilisateur.ts'],
  rules: {
    'no-restricted-syntax': ['error', { selector: "ExportDefaultDeclaration", message: "export default is forbidden." }],
  },
},
```

(Le fichier `api-key.ts` utilise `new ApiKey(...)` dans son constructeur privé et dans `reconstitute`, qui doit être autorisé.)

- [ ] **Step 4: Lancer les tests et commit**

Run: `pnpm -F @pilote-mb/core test src/authentication/domain/api-key/api-key.test.ts`

```bash
git add apps/pilote-mb-core/src/authentication/domain/api-key/api-key.ts apps/pilote-mb-core/src/authentication/domain/api-key/api-key.test.ts apps/pilote-mb-core/.eslintrc.cjs
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — AggregateRoot ApiKey avec create/revoke + events

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, domain, ddd, aggregate
Files-changed: 3"
```

---

## Phase 8 — BC authentication : domain utilisateur

### Tâche 34 : VOs utilisateur-id + email + statut-acces

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/domain/utilisateur/utilisateur-id.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/utilisateur/email.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/utilisateur/email.test.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/utilisateur/statut-acces.ts`

- [ ] **Step 1: `utilisateur-id.ts`**

```ts
// src/authentication/domain/utilisateur/utilisateur-id.ts
import { Uuid } from '@/shared-kernel/uuid'

export class UtilisateurId extends Uuid {
  static override generate(): UtilisateurId { return new UtilisateurId(Uuid.generate().valueOf()) }
  static override from(value: string): UtilisateurId { return new UtilisateurId(Uuid.from(value).valueOf()) }
}
```

- [ ] **Step 2: `email.ts` + test**

Test :
```ts
// src/authentication/domain/utilisateur/email.test.ts
import { describe, it, expect } from 'vitest'
import { Email } from './email'

describe('Email', () => {
  it('accepte un email valide', () => {
    const email = Email.from('user@example.com')
    expect(email.valueOf()).toEqual('user@example.com')
  })

  it('normalise en lowercase', () => {
    expect(Email.from('User@Example.COM').valueOf()).toEqual('user@example.com')
  })

  it('throw si format invalide', () => {
    expect(() => Email.from('invalid')).toThrow()
    expect(() => Email.from('@nodomain')).toThrow()
    expect(() => Email.from('no-at-sign.com')).toThrow()
  })
})
```

Impl :
```ts
// src/authentication/domain/utilisateur/email.ts
import { ValueObject } from '@/shared-kernel/value-object'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class Email extends ValueObject<string> {
  static from(value: string): Email {
    const normalized = value.trim().toLowerCase()
    if (!EMAIL_REGEX.test(normalized)) throw new Error(`Invalid email: ${value}`)
    return new Email(normalized)
  }
}
```

- [ ] **Step 3: `statut-acces.ts`**

```ts
// src/authentication/domain/utilisateur/statut-acces.ts
export const STATUTS_ACCES = ['EN_ATTENTE_ACCES', 'ACTIF', 'REFUSE', 'DESACTIVE'] as const
export type StatutAccesValue = (typeof STATUTS_ACCES)[number]

export class StatutAcces {
  private constructor(readonly value: StatutAccesValue) {}
  static from(value: StatutAccesValue): StatutAcces { return new StatutAcces(value) }
  static EN_ATTENTE_ACCES = new StatutAcces('EN_ATTENTE_ACCES')
  static ACTIF = new StatutAcces('ACTIF')
  static REFUSE = new StatutAcces('REFUSE')
  static DESACTIVE = new StatutAcces('DESACTIVE')
  estActif(): boolean { return this.value === 'ACTIF' }
  estEnAttente(): boolean { return this.value === 'EN_ATTENTE_ACCES' }
  equals(other: StatutAcces): boolean { return this.value === other.value }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/domain/utilisateur/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — VOs UtilisateurId + Email + StatutAcces

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, domain, ddd
Files-changed: 4"
```

---

### Tâche 35 : AggregateRoot Utilisateur + event UtilisateurCreated + repository interface

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/domain/utilisateur/events/utilisateur-created.event.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/utilisateur/utilisateur.repository.ts`
- Create: `apps/pilote-mb-core/src/authentication/domain/utilisateur/utilisateur.ts`

- [ ] **Step 1: `utilisateur-created.event.ts`**

```ts
// src/authentication/domain/utilisateur/events/utilisateur-created.event.ts
import { type DomainEvent } from '@/shared-kernel/domain-event'

export class UtilisateurCreatedEvent implements DomainEvent {
  readonly type = 'UTILISATEUR_CREATED'
  constructor(
    readonly aggregateId: string,
    readonly email: string,
    readonly occurredAt: Date,
  ) {}
}
```

- [ ] **Step 2: `utilisateur.repository.ts`**

```ts
// src/authentication/domain/utilisateur/utilisateur.repository.ts
import { type Utilisateur } from './utilisateur'

export interface UtilisateurRepository {
  save(aggregate: Utilisateur): Promise<void>
  findById(id: string): Promise<Utilisateur | null>
  findBySubProconnect(sub: string): Promise<Utilisateur | null>
}
```

- [ ] **Step 3: `utilisateur.ts`**

```ts
// src/authentication/domain/utilisateur/utilisateur.ts
import { AggregateRoot } from '@/shared-kernel/aggregate-root'
import { UtilisateurId } from './utilisateur-id'
import { Email } from './email'
import { StatutAcces, type StatutAccesValue } from './statut-acces'
import { UtilisateurCreatedEvent } from './events/utilisateur-created.event'
import { type Clock } from '@/shared-kernel/clock'

export type UtilisateurPersistenceShape = {
  id: string
  sub_proconnect: string
  email: string
  nom: string
  prenom: string
  statut_acces: StatutAccesValue
  roles: string[]
  token_version: number
  date_creation: Date
  date_derniere_connexion: Date | null
}

export class Utilisateur extends AggregateRoot<UtilisateurId> {
  private constructor(
    id: UtilisateurId,
    readonly subProconnect: string,
    readonly email: Email,
    readonly nom: string,
    readonly prenom: string,
    readonly statutAcces: StatutAcces,
    readonly roles: ReadonlyArray<string>,
    readonly tokenVersion: number,
    readonly dateCreation: Date,
    readonly dateDerniereConnexion: Date | null,
  ) { super(id) }

  static createFromProConnect(params: {
    subProconnect: string
    email: Email
    nom: string
    prenom: string
    clock: Clock
  }): Utilisateur {
    const now = params.clock.now()
    const aggregate = new Utilisateur(
      UtilisateurId.generate(),
      params.subProconnect,
      params.email,
      params.nom,
      params.prenom,
      StatutAcces.EN_ATTENTE_ACCES,
      [],
      1,
      now,
      null,
    )
    aggregate.recordEvent(new UtilisateurCreatedEvent(aggregate.id.valueOf(), params.email.valueOf(), now))
    return aggregate
  }

  static reconstitute(row: UtilisateurPersistenceShape): Utilisateur {
    return new Utilisateur(
      UtilisateurId.from(row.id),
      row.sub_proconnect,
      Email.from(row.email),
      row.nom,
      row.prenom,
      StatutAcces.from(row.statut_acces),
      row.roles,
      row.token_version,
      row.date_creation,
      row.date_derniere_connexion,
    )
  }

  nomComplet(): string {
    return `${this.prenom} ${this.nom}`
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/domain/utilisateur/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — AggregateRoot Utilisateur + event + repository interface

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, domain, ddd, aggregate
Files-changed: 3"
```

---

## Phase 9 — BC authentication : infrastructure

### Tâche 36 : Adapters crypto (Sha256ApiKeyHasher + CryptoTokenGenerator + JsonwebtokenTokenSigner)

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/crypto/sha256-api-key-hasher.ts`
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/crypto/sha256-api-key-hasher.test.ts`
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/crypto/crypto-token-generator.ts`
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/crypto/token-signer.ts` (port dans domain/jwt/)

**Note :** le port `TokenSigner` pour les JWT internes vit dans `authentication/domain/jwt/` puisqu'il est utilisé par le domain. Déplacer si besoin.

- [ ] **Step 1: Créer le port TokenSigner**

```ts
// src/authentication/domain/jwt/token-signer.ts
export type JwtPayload = {
  sub: string
  email: string
  roles: string[]
  statutAcces: string
  tokenVersion: number
}

export interface TokenSigner {
  sign(payload: JwtPayload, ttlSeconds: number): string
  verify(token: string): JwtPayload | null
}
```

- [ ] **Step 2: `sha256-api-key-hasher.ts` + test**

Test :
```ts
// src/authentication/infrastructure/crypto/sha256-api-key-hasher.test.ts
import { describe, it, expect } from 'vitest'
import { Sha256ApiKeyHasher } from './sha256-api-key-hasher'

describe('Sha256ApiKeyHasher', () => {
  it('hash deterministe (même entrée = même sortie)', () => {
    const hasher = new Sha256ApiKeyHasher()
    expect(hasher.hash('pmb_live_abc')).toEqual(hasher.hash('pmb_live_abc'))
  })

  it('hash différent pour entrées différentes', () => {
    const hasher = new Sha256ApiKeyHasher()
    expect(hasher.hash('a')).not.toEqual(hasher.hash('b'))
  })

  it('retourne 64 chars hex (SHA-256)', () => {
    const hasher = new Sha256ApiKeyHasher()
    expect(hasher.hash('x')).toMatch(/^[0-9a-f]{64}$/)
  })
})
```

Impl :
```ts
// src/authentication/infrastructure/crypto/sha256-api-key-hasher.ts
import { createHash } from 'node:crypto'
import { type ApiKeyHasher } from '@/authentication/domain/api-key/api-key-hasher'

export class Sha256ApiKeyHasher implements ApiKeyHasher {
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}
```

- [ ] **Step 3: `crypto-token-generator.ts`**

```ts
// src/authentication/infrastructure/crypto/crypto-token-generator.ts
import { randomBytes } from 'node:crypto'
import { type TokenGenerator } from '@/authentication/domain/api-key/token-generator'

export class CryptoTokenGenerator implements TokenGenerator {
  generate(prefix: 'pmb_live_' | 'pmb_test_'): string {
    return `${prefix}${randomBytes(32).toString('hex')}`
  }
}
```

- [ ] **Step 4: `jsonwebtoken-token-signer.ts` + test**

Test :
```ts
// src/authentication/infrastructure/crypto/jsonwebtoken-token-signer.test.ts
import { describe, it, expect } from 'vitest'
import { JsonwebtokenTokenSigner } from './jsonwebtoken-token-signer'

describe('JsonwebtokenTokenSigner', () => {
  const secret = 'a'.repeat(32)
  const signer = new JsonwebtokenTokenSigner(secret)
  const payload = {
    sub: '550e8400-e29b-41d4-a716-446655440000',
    email: 'u@x.com',
    roles: ['admin'],
    statutAcces: 'ACTIF',
    tokenVersion: 1,
  }

  it('sign puis verify retourne le payload', () => {
    const token = signer.sign(payload, 3600)
    expect(signer.verify(token)).toMatchObject(payload)
  })

  it('verify retourne null pour un token invalide', () => {
    expect(signer.verify('not.a.jwt')).toBeNull()
  })

  it('verify retourne null pour un token signé avec une autre clé', () => {
    const other = new JsonwebtokenTokenSigner('b'.repeat(32))
    const token = other.sign(payload, 3600)
    expect(signer.verify(token)).toBeNull()
  })
})
```

Impl :
```ts
// src/authentication/infrastructure/crypto/jsonwebtoken-token-signer.ts
import jsonwebtoken from 'jsonwebtoken'
import { type JwtPayload, type TokenSigner } from '@/authentication/domain/jwt/token-signer'

export class JsonwebtokenTokenSigner implements TokenSigner {
  constructor(private readonly secret: string) {}

  sign(payload: JwtPayload, ttlSeconds: number): string {
    return jsonwebtoken.sign(payload, this.secret, { algorithm: 'HS256', expiresIn: ttlSeconds })
  }

  verify(token: string): JwtPayload | null {
    try {
      const decoded = jsonwebtoken.verify(token, this.secret, { algorithms: ['HS256'] })
      if (typeof decoded === 'string') return null
      return decoded as unknown as JwtPayload
    } catch {
      return null
    }
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/domain/jwt/ apps/pilote-mb-core/src/authentication/infrastructure/crypto/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — adapters crypto (SHA-256, CryptoTokenGenerator, JWT signer)

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, jsonwebtoken
Tags: pilote-mb, backend, authentication, crypto
Files-changed: 6"
```

---

### Tâche 37 : ApiKey mapper + ApiKeyPrismaRepository + test d'intégration

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/persistence/api-key.mapper.ts`
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/persistence/api-key.prisma-repository.ts`
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/persistence/api-key.prisma-repository.test.ts`
- Create: `apps/pilote-mb-core/src/test/fixtures/api-key.fixture.ts`

- [ ] **Step 1: `api-key.fixture.ts`**

```ts
// src/test/fixtures/api-key.fixture.ts
import { randomUUID, createHash, randomBytes } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { getPrisma } from '@/platform/persistence/prisma/prisma-pilote-helpers'

// Helper wrapper : expose getPrisma pour les fixtures uniquement
// (exception à la règle 6.2 — fixtures hors Awilix)
```

**Note :** on a besoin d'un helper `getPrisma()` qui retourne le client (tx ou racine) pour les fixtures. Le crée dans `platform/persistence/prisma/prisma-pilote-helpers.ts`.

Crée d'abord :
```ts
// src/platform/persistence/prisma/prisma-pilote-helpers.ts
import { txStore, prismaClient } from './prisma-transaction'

export const getPrisma = () => txStore.getStore() ?? prismaClient
```

Puis la fixture :
```ts
// src/test/fixtures/api-key.fixture.ts
import { randomUUID, createHash, randomBytes } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { getPrisma } from '@/platform/persistence/prisma/prisma-pilote-helpers'

export type ApiKeyFixtureOverrides = Partial<Prisma.api_keyUncheckedCreateInput> & {
  rawToken?: string
}

export async function createApiKeyFixture(overrides: ApiKeyFixtureOverrides = {}) {
  const rawToken = overrides.rawToken ?? `pmb_test_${randomBytes(32).toString('hex')}`
  const keyHash = overrides.key_hash ?? createHash('sha256').update(rawToken).digest('hex')
  const keyPrefix = overrides.key_prefix ?? rawToken.slice(0, 12)

  const { rawToken: _r, ...rest } = overrides

  const row = await getPrisma().api_key.create({
    data: {
      id: randomUUID(),
      nom: `test-key-${randomUUID().slice(0, 6)}`,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes: ['entities:read'],
      active: true,
      ...rest,
    },
  })
  return { row, rawToken }
}
```

- [ ] **Step 2: `api-key.mapper.ts`**

```ts
// src/authentication/infrastructure/persistence/api-key.mapper.ts
import type { api_key } from '@prisma/client'
import { ApiKey, type ApiKeyPersistenceShape } from '@/authentication/domain/api-key/api-key'

export class ApiKeyMapper {
  static toDomain(row: api_key): ApiKey {
    return ApiKey.reconstitute({
      id: row.id,
      nom: row.nom,
      key_hash: row.key_hash,
      key_prefix: row.key_prefix,
      scopes: row.scopes,
      active: row.active,
      date_creation: row.date_creation,
      date_derniere_utilisation: row.date_derniere_utilisation,
    })
  }

  static toPersistence(aggregate: ApiKey): ApiKeyPersistenceShape {
    return {
      id: aggregate.id.valueOf(),
      nom: aggregate.nom,
      key_hash: aggregate.keyHash,
      key_prefix: aggregate.keyPrefix,
      scopes: aggregate.scopes.map((scope) => scope.valueOf()),
      active: aggregate.estActive(),
      date_creation: aggregate.dateCreation,
      date_derniere_utilisation: aggregate.dateDerniereUtilisation,
    }
  }
}
```

- [ ] **Step 3: Test d'intégration du repository**

```ts
// src/authentication/infrastructure/persistence/api-key.prisma-repository.test.ts
import { describe, it, expect } from 'vitest'
import { withTestTransaction } from '@/test/with-test-transaction'
import { createApiKeyFixture } from '@/test/fixtures/api-key.fixture'
import { type ApiKeyRepository } from '@/authentication/domain/api-key/api-key.repository'
import { ApiKey } from '@/authentication/domain/api-key/api-key'
import { Scope } from '@/authentication/domain/api-key/scope'
import { Sha256ApiKeyHasher } from '@/authentication/infrastructure/crypto/sha256-api-key-hasher'
import { CryptoTokenGenerator } from '@/authentication/infrastructure/crypto/crypto-token-generator'
import { FakeClock } from '@/test/fake-clock'

describe('ApiKeyPrismaRepository', () => {
  it('findByKeyHash retourne null si inexistant', withTestTransaction(async (testContext) => {
    const repo = testContext.resolve<ApiKeyRepository>('authentication', 'apiKeyRepository')
    expect(await repo.findByKeyHash('inexistant')).toBeNull()
  }))

  it('findByKeyHash retourne un agrégat si la clé existe', withTestTransaction(async (testContext) => {
    const repo = testContext.resolve<ApiKeyRepository>('authentication', 'apiKeyRepository')
    const { row } = await createApiKeyFixture({ nom: 'target', active: true })

    const found = await repo.findByKeyHash(row.key_hash)

    expect(found).not.toBeNull()
    expect(found!.nom).toEqual('target')
    expect(found!.estActive()).toEqual(true)
  }))

  it('save persiste un nouvel agrégat et publie ses events', withTestTransaction(async (testContext) => {
    const repo = testContext.resolve<ApiKeyRepository>('authentication', 'apiKeyRepository')
    const clock = new FakeClock(new Date('2026-04-24T10:00:00Z'))
    const { aggregate } = ApiKey.create({
      nom: 'new-key',
      scopes: [Scope.from('entities:read')],
      environment: 'test',
      hasher: new Sha256ApiKeyHasher(),
      tokenGenerator: new CryptoTokenGenerator(),
      clock,
    })._unsafeUnwrap()

    await repo.save(aggregate)

    const persisted = await repo.findById(aggregate.id.valueOf())
    expect(persisted).not.toBeNull()
    expect(persisted!.nom).toEqual('new-key')
  }))
})
```

- [ ] **Step 4: `api-key.prisma-repository.ts`**

```ts
// src/authentication/infrastructure/persistence/api-key.prisma-repository.ts
import { type Inject } from '@/authentication/authentication.module'
import { type ApiKey } from '@/authentication/domain/api-key/api-key'
import { type ApiKeyRepository } from '@/authentication/domain/api-key/api-key.repository'
import { ApiKeyMapper } from './api-key.mapper'

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

  async findById(id: string): Promise<ApiKey | null> {
    const row = await this.deps.prisma.getInstance().api_key.findUnique({ where: { id } })
    return row ? ApiKeyMapper.toDomain(row) : null
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/platform/persistence/prisma/prisma-pilote-helpers.ts apps/pilote-mb-core/src/test/fixtures/api-key.fixture.ts apps/pilote-mb-core/src/authentication/infrastructure/persistence/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — ApiKeyPrismaRepository + mapper + fixture

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, prisma
Tags: pilote-mb, backend, authentication, persistence
Files-changed: 5"
```

---

### Tâche 38 : UtilisateurPrismaRepository + mapper + fixture

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/persistence/utilisateur.mapper.ts`
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/persistence/utilisateur.prisma-repository.ts`
- Create: `apps/pilote-mb-core/src/test/fixtures/utilisateur.fixture.ts`

- [ ] **Step 1: `utilisateur.mapper.ts`**

```ts
// src/authentication/infrastructure/persistence/utilisateur.mapper.ts
import type { utilisateur } from '@prisma/client'
import { Utilisateur, type UtilisateurPersistenceShape } from '@/authentication/domain/utilisateur/utilisateur'
import type { StatutAccesValue } from '@/authentication/domain/utilisateur/statut-acces'

export class UtilisateurMapper {
  static toDomain(row: utilisateur): Utilisateur {
    return Utilisateur.reconstitute({
      id: row.id,
      sub_proconnect: row.sub_proconnect,
      email: row.email,
      nom: row.nom,
      prenom: row.prenom,
      statut_acces: row.statut_acces as StatutAccesValue,
      roles: row.roles,
      token_version: row.token_version,
      date_creation: row.date_creation,
      date_derniere_connexion: row.date_derniere_connexion,
    })
  }

  static toPersistence(aggregate: Utilisateur): UtilisateurPersistenceShape {
    return {
      id: aggregate.id.valueOf(),
      sub_proconnect: aggregate.subProconnect,
      email: aggregate.email.valueOf(),
      nom: aggregate.nom,
      prenom: aggregate.prenom,
      statut_acces: aggregate.statutAcces.value,
      roles: [...aggregate.roles],
      token_version: aggregate.tokenVersion,
      date_creation: aggregate.dateCreation,
      date_derniere_connexion: aggregate.dateDerniereConnexion,
    }
  }
}
```

- [ ] **Step 2: `utilisateur.prisma-repository.ts`**

```ts
// src/authentication/infrastructure/persistence/utilisateur.prisma-repository.ts
import { type Inject } from '@/authentication/authentication.module'
import { type Utilisateur } from '@/authentication/domain/utilisateur/utilisateur'
import { type UtilisateurRepository } from '@/authentication/domain/utilisateur/utilisateur.repository'
import { UtilisateurMapper } from './utilisateur.mapper'

export class UtilisateurPrismaRepository implements UtilisateurRepository {
  constructor(private readonly deps: Inject<'prisma' | 'domainEventPublisher'>) {}

  async save(aggregate: Utilisateur): Promise<void> {
    const data = UtilisateurMapper.toPersistence(aggregate)
    await this.deps.prisma.getInstance().utilisateur.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    })
    await this.deps.domainEventPublisher.publish(aggregate.pullPendingEvents())
  }

  async findById(id: string): Promise<Utilisateur | null> {
    const row = await this.deps.prisma.getInstance().utilisateur.findUnique({ where: { id } })
    return row ? UtilisateurMapper.toDomain(row) : null
  }

  async findBySubProconnect(sub: string): Promise<Utilisateur | null> {
    const row = await this.deps.prisma.getInstance().utilisateur.findUnique({ where: { sub_proconnect: sub } })
    return row ? UtilisateurMapper.toDomain(row) : null
  }
}
```

- [ ] **Step 3: `utilisateur.fixture.ts`**

```ts
// src/test/fixtures/utilisateur.fixture.ts
import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { getPrisma } from '@/platform/persistence/prisma/prisma-pilote-helpers'

export async function createUtilisateurFixture(
  overrides: Partial<Prisma.utilisateurUncheckedCreateInput> = {},
) {
  const id = overrides.id ?? randomUUID()
  return getPrisma().utilisateur.create({
    data: {
      id,
      sub_proconnect: overrides.sub_proconnect ?? `sub-${id}`,
      email: overrides.email ?? `user-${id.slice(0, 6)}@example.com`,
      nom: 'Test',
      prenom: 'User',
      statut_acces: 'ACTIF',
      roles: [],
      token_version: 1,
      ...overrides,
    },
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/infrastructure/persistence/utilisateur.mapper.ts apps/pilote-mb-core/src/authentication/infrastructure/persistence/utilisateur.prisma-repository.ts apps/pilote-mb-core/src/test/fixtures/utilisateur.fixture.ts
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — UtilisateurPrismaRepository + mapper + fixture

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, prisma
Tags: pilote-mb, backend, authentication, persistence
Files-changed: 3"
```

---

### Tâche 39 : Proconnect client scaffolding

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/proconnect/proconnect-client.ts`

- [ ] **Step 1: Scaffolding minimal**

```ts
// src/authentication/infrastructure/proconnect/proconnect-client.ts
// Scaffolding — impl complète dans le ticket ProConnect (voir docs/architecture/init-design.md section 9.3)

import { type Config } from '@/config'

export interface ProconnectClient {
  verifyIdToken(idToken: string): Promise<null> // retourne null tant que l'impl n'est pas faite
}

export class NotImplementedProconnectClient implements ProconnectClient {
  constructor(_config: Config) {}
  async verifyIdToken(_idToken: string): Promise<null> {
    return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/infrastructure/proconnect/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — scaffolding ProConnect client

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, proconnect, scaffolding
Files-changed: 1"
```

---

## Phase 10 — BC authentication : application

### Tâche 40 : VerifyApiKeyHandler + test d'intégration

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/application/queries/verify-api-key/verify-api-key.handler.ts`
- Create: `apps/pilote-mb-core/src/authentication/application/queries/verify-api-key/verify-api-key.handler.test.ts`

- [ ] **Step 1: Test**

```ts
// src/authentication/application/queries/verify-api-key/verify-api-key.handler.test.ts
import { describe, it, expect } from 'vitest'
import { withTestTransaction } from '@/test/with-test-transaction'
import { VerifyApiKeyHandler } from './verify-api-key.handler'
import { createApiKeyFixture } from '@/test/fixtures/api-key.fixture'

describe('VerifyApiKeyHandler', () => {
  it('retourne une référence si le token matche une clé active', withTestTransaction(async (testContext) => {
    const handler = testContext.resolve<VerifyApiKeyHandler>('authentication', 'verifyApiKeyHandler')
    const { rawToken, row } = await createApiKeyFixture({ nom: 'target' })

    const result = await handler.executer({ rawToken })

    expect(result).not.toBeNull()
    expect(result!.id).toEqual(row.id)
    expect(result!.nom).toEqual('target')
  }))

  it('retourne null si le token est inconnu', withTestTransaction(async (testContext) => {
    const handler = testContext.resolve<VerifyApiKeyHandler>('authentication', 'verifyApiKeyHandler')
    expect(await handler.executer({ rawToken: 'pmb_test_fake' })).toBeNull()
  }))

  it('retourne null si la clé est désactivée', withTestTransaction(async (testContext) => {
    const handler = testContext.resolve<VerifyApiKeyHandler>('authentication', 'verifyApiKeyHandler')
    const { rawToken } = await createApiKeyFixture({ active: false })
    expect(await handler.executer({ rawToken })).toBeNull()
  }))
})
```

- [ ] **Step 2: Impl**

```ts
// src/authentication/application/queries/verify-api-key/verify-api-key.handler.ts
import { type Inject } from '@/authentication/authentication.module'
import { type ApiKeyReference } from '@/authentication/public/api-key-reference'

export class VerifyApiKeyHandler {
  constructor(private readonly deps: Inject<'apiKeyRepository' | 'apiKeyHasher'>) {}

  async executer(input: { rawToken: string }): Promise<ApiKeyReference | null> {
    const keyHash = this.deps.apiKeyHasher.hash(input.rawToken)
    const aggregate = await this.deps.apiKeyRepository.findByKeyHash(keyHash)
    if (!aggregate || !aggregate.estActive()) return null
    return {
      id: aggregate.id.valueOf(),
      nom: aggregate.nom,
      scopes: aggregate.scopes.map((scope) => scope.valueOf()),
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/application/queries/verify-api-key/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — VerifyApiKeyHandler

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, application
Files-changed: 2"
```

---

### Tâche 41 : VerifyJwtHandler + test

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/application/queries/verify-jwt/verify-jwt.handler.ts`
- Create: `apps/pilote-mb-core/src/authentication/application/queries/verify-jwt/verify-jwt.handler.test.ts`

- [ ] **Step 1: Test**

```ts
// src/authentication/application/queries/verify-jwt/verify-jwt.handler.test.ts
import { describe, it, expect } from 'vitest'
import { withTestTransaction } from '@/test/with-test-transaction'
import { VerifyJwtHandler } from './verify-jwt.handler'
import { createUtilisateurFixture } from '@/test/fixtures/utilisateur.fixture'
import { JsonwebtokenTokenSigner } from '@/authentication/infrastructure/crypto/jsonwebtoken-token-signer'
import { config } from '@/config'

describe('VerifyJwtHandler', () => {
  it('retourne la référence utilisateur si le JWT est valide', withTestTransaction(async (testContext) => {
    const handler = testContext.resolve<VerifyJwtHandler>('authentication', 'verifyJwtHandler')
    const utilisateur = await createUtilisateurFixture({ statut_acces: 'ACTIF' })
    const signer = new JsonwebtokenTokenSigner(config.JWT_SECRET)
    const token = signer.sign(
      { sub: utilisateur.id, email: utilisateur.email, roles: [], statutAcces: 'ACTIF', tokenVersion: 1 },
      3600,
    )

    const result = await handler.executer({ rawJwt: token })

    expect(result).not.toBeNull()
    expect(result!.id).toEqual(utilisateur.id)
  }))

  it('retourne null pour un JWT invalide', withTestTransaction(async (testContext) => {
    const handler = testContext.resolve<VerifyJwtHandler>('authentication', 'verifyJwtHandler')
    expect(await handler.executer({ rawJwt: 'invalid.jwt.token' })).toBeNull()
  }))
})
```

- [ ] **Step 2: Impl**

```ts
// src/authentication/application/queries/verify-jwt/verify-jwt.handler.ts
import { type Inject } from '@/authentication/authentication.module'
import { type UtilisateurReference } from '@/authentication/public/utilisateur-reference'

export class VerifyJwtHandler {
  constructor(private readonly deps: Inject<'tokenSigner' | 'utilisateurRepository'>) {}

  async executer(input: { rawJwt: string }): Promise<UtilisateurReference | null> {
    const payload = this.deps.tokenSigner.verify(input.rawJwt)
    if (!payload) return null
    const utilisateur = await this.deps.utilisateurRepository.findById(payload.sub)
    if (!utilisateur) return null
    if (utilisateur.tokenVersion !== payload.tokenVersion) return null
    return {
      id: utilisateur.id.valueOf(),
      email: utilisateur.email.valueOf(),
      nomComplet: utilisateur.nomComplet(),
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/application/queries/verify-jwt/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — VerifyJwtHandler

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, application
Files-changed: 2"
```

---

### Tâche 42 : CreateSessionHandler stub + NotImplementedError

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/domain/session/errors/not-implemented.error.ts`
- Create: `apps/pilote-mb-core/src/authentication/application/commands/create-session/create-session.command.ts`
- Create: `apps/pilote-mb-core/src/authentication/application/commands/create-session/create-session.handler.ts`
- Create: `apps/pilote-mb-core/src/authentication/application/commands/create-session/create-session.handler.test.ts`

- [ ] **Step 1: `not-implemented.error.ts`**

```ts
// src/authentication/domain/session/errors/not-implemented.error.ts
import { DomainError } from '@/shared-kernel/domain-error'

export class NotImplementedError extends DomainError {
  readonly code = 'NOT_IMPLEMENTED'
  readonly kind = 'not-implemented' as const
  constructor(featureDescription: string) {
    super(`Fonctionnalité non implémentée : ${featureDescription}`)
  }
}
```

- [ ] **Step 2: `create-session.command.ts`**

```ts
// src/authentication/application/commands/create-session/create-session.command.ts
export type CreateSessionCommand = {
  readonly idToken: string
}
```

- [ ] **Step 3: Test**

```ts
// src/authentication/application/commands/create-session/create-session.handler.test.ts
import { describe, it, expect } from 'vitest'
import { withTestTransaction } from '@/test/with-test-transaction'
import { CreateSessionHandler } from './create-session.handler'
import { NotImplementedError } from '@/authentication/domain/session/errors/not-implemented.error'

describe('CreateSessionHandler', () => {
  it('retourne NotImplementedError (scaffolding ProConnect)', withTestTransaction(async (testContext) => {
    const handler = testContext.resolve<CreateSessionHandler>('authentication', 'createSessionHandler')
    const result = await handler.executer({ idToken: 'any' })
    expect(result.isErr()).toEqual(true)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(NotImplementedError)
  }))
})
```

- [ ] **Step 4: Impl**

```ts
// src/authentication/application/commands/create-session/create-session.handler.ts
import { err, type Result } from '@/shared-kernel/result'
import { type DomainError } from '@/shared-kernel/domain-error'
import { type Inject } from '@/authentication/authentication.module'
import { NotImplementedError } from '@/authentication/domain/session/errors/not-implemented.error'
import { type CreateSessionCommand } from './create-session.command'
import { type UtilisateurReference } from '@/authentication/public/utilisateur-reference'

export type Session = {
  readonly jwt: string
  readonly utilisateur: UtilisateurReference
}

export class CreateSessionHandler {
  constructor(
    private readonly deps: Inject<'utilisateurRepository' | 'tokenSigner' | 'clock' | 'config'>,
  ) {}

  async executer(_command: CreateSessionCommand): Promise<Result<Session, DomainError>> {
    // TODO: intégrer ProConnect (ticket suivant)
    //  1. Valider id_token via JWKS ProConnect
    //  2. Upsert utilisateur depuis claims (sub, email, given_name, family_name)
    //  3. Émettre JWT interne via this.deps.tokenSigner.sign(...)
    return err(new NotImplementedError('intégration ProConnect — voir docs/architecture/init-design.md §9.3'))
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/domain/session/ apps/pilote-mb-core/src/authentication/application/commands/create-session/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — CreateSessionHandler stub + NotImplementedError

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, application, scaffolding
Files-changed: 4"
```

---

### Tâche 43 : AuthenticationFacadeImpl

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/application/facades/authentication.facade.impl.ts`

- [ ] **Step 1: Impl**

```ts
// src/authentication/application/facades/authentication.facade.impl.ts
import { type Inject } from '@/authentication/authentication.module'
import { type AuthenticationFacade } from '@/authentication/public/authentication.facade'
import { type UtilisateurReference } from '@/authentication/public/utilisateur-reference'
import { type ApiKeyReference } from '@/authentication/public/api-key-reference'

export class AuthenticationFacadeImpl implements AuthenticationFacade {
  constructor(
    private readonly deps: Inject<
      'utilisateurRepository' | 'verifyApiKeyHandler' | 'verifyJwtHandler'
    >,
  ) {}

  async utilisateurExiste(utilisateurId: string): Promise<boolean> {
    return (await this.deps.utilisateurRepository.findById(utilisateurId)) !== null
  }

  async getUtilisateurReference(utilisateurId: string): Promise<UtilisateurReference | null> {
    const utilisateur = await this.deps.utilisateurRepository.findById(utilisateurId)
    if (!utilisateur) return null
    return {
      id: utilisateur.id.valueOf(),
      email: utilisateur.email.valueOf(),
      nomComplet: utilisateur.nomComplet(),
    }
  }

  async verifyApiKey(rawToken: string): Promise<ApiKeyReference | null> {
    return this.deps.verifyApiKeyHandler.executer({ rawToken })
  }

  async verifyJwt(rawJwt: string): Promise<UtilisateurReference | null> {
    return this.deps.verifyJwtHandler.executer({ rawJwt })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/application/facades/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — AuthenticationFacadeImpl

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, application, facade
Files-changed: 1"
```

---

## Phase 11 — BC authentication : public + module

### Tâche 44 : Published Language (DTOs + facade interface)

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/public/utilisateur-reference.ts`
- Create: `apps/pilote-mb-core/src/authentication/public/api-key-reference.ts`
- Create: `apps/pilote-mb-core/src/authentication/public/authentication.facade.ts`

- [ ] **Step 1: DTOs**

```ts
// src/authentication/public/utilisateur-reference.ts
export type UtilisateurReference = {
  readonly id: string
  readonly email: string
  readonly nomComplet: string
}
```

```ts
// src/authentication/public/api-key-reference.ts
export type ApiKeyReference = {
  readonly id: string
  readonly nom: string
  readonly scopes: ReadonlyArray<string>
}
```

- [ ] **Step 2: Facade**

```ts
// src/authentication/public/authentication.facade.ts
import { type UtilisateurReference } from './utilisateur-reference'
import { type ApiKeyReference } from './api-key-reference'

export interface AuthenticationFacade {
  utilisateurExiste(utilisateurId: string): Promise<boolean>
  getUtilisateurReference(utilisateurId: string): Promise<UtilisateurReference | null>
  verifyApiKey(rawToken: string): Promise<ApiKeyReference | null>
  verifyJwt(rawJwt: string): Promise<UtilisateurReference | null>
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/public/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — Published Language (DTOs + facade interface)

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, public, ddd
Files-changed: 3"
```

---

### Tâche 45 : authentication.module.ts

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/authentication.module.ts`

- [ ] **Step 1: Impl**

```ts
// src/authentication/authentication.module.ts
import { defineModule, type ExtractScope, type VerifyCradle } from '@/platform/container/module-system/define-module'
import { type ApiKeyHasher } from './domain/api-key/api-key-hasher'
import { type TokenGenerator } from './domain/api-key/token-generator'
import { type ApiKeyRepository } from './domain/api-key/api-key.repository'
import { type UtilisateurRepository } from './domain/utilisateur/utilisateur.repository'
import { type TokenSigner } from './domain/jwt/token-signer'
import { type AuthenticationFacade } from './public/authentication.facade'
import { Sha256ApiKeyHasher } from './infrastructure/crypto/sha256-api-key-hasher'
import { CryptoTokenGenerator } from './infrastructure/crypto/crypto-token-generator'
import { JsonwebtokenTokenSigner } from './infrastructure/crypto/jsonwebtoken-token-signer'
import { ApiKeyPrismaRepository } from './infrastructure/persistence/api-key.prisma-repository'
import { UtilisateurPrismaRepository } from './infrastructure/persistence/utilisateur.prisma-repository'
import { VerifyApiKeyHandler } from './application/queries/verify-api-key/verify-api-key.handler'
import { VerifyJwtHandler } from './application/queries/verify-jwt/verify-jwt.handler'
import { CreateSessionHandler } from './application/commands/create-session/create-session.handler'
import { AuthenticationFacadeImpl } from './application/facades/authentication.facade.impl'
import { asFunction } from 'awilix'
import { config } from '@/config'

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
  imports: ['platform'],
  exports: ['authenticationFacade'],
  register: (container, { asModuleClass }) => {
    container.register({
      apiKeyHasher: asModuleClass(Sha256ApiKeyHasher).singleton(),
      tokenGenerator: asModuleClass(CryptoTokenGenerator).singleton(),
      tokenSigner: asFunction(() => new JsonwebtokenTokenSigner(config.JWT_SECRET)).singleton(),
      apiKeyRepository: asModuleClass(ApiKeyPrismaRepository).singleton(),
      utilisateurRepository: asModuleClass(UtilisateurPrismaRepository).singleton(),
      verifyApiKeyHandler: asModuleClass(VerifyApiKeyHandler).singleton(),
      verifyJwtHandler: asModuleClass(VerifyJwtHandler).singleton(),
      createSessionHandler: asModuleClass(CreateSessionHandler).singleton(),
      authenticationFacade: asModuleClass(AuthenticationFacadeImpl).singleton(),
    } satisfies VerifyCradle<AuthenticationCradle>)
  },
})

type Scope = ExtractScope<typeof authenticationModule>
export type Inject<K extends keyof Scope> = Pick<Scope, K>
```

- [ ] **Step 2: Vérifier la compilation complète**

Run: `pnpm -F @pilote-mb/core exec tsc --noEmit`
Expected: compilation OK

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/authentication.module.ts
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — module.ts avec cradle typé et facade exportée

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, awilix
Tags: pilote-mb, backend, authentication, di
Files-changed: 1"
```

---

## Phase 12 — BC authentication : HTTP + middleware + CLI

### Tâche 46 : Route POST /auth/sessions (retourne 501)

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/http/routes/create-session.route.ts`

- [ ] **Step 1: Impl**

```ts
// src/authentication/infrastructure/http/routes/create-session.route.ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { type AwilixContainer } from 'awilix'
import { ErrorSchema } from '@/platform/http/schemas/error.schema'
import { respondWithResult } from '@/platform/http/respond-with-result'
import { type CreateSessionHandler } from '@/authentication/application/commands/create-session/create-session.handler'

const CreateSessionInputSchema = z.object({
  id_token: z.string().describe('id_token OIDC émis par ProConnect'),
}).openapi('CreateSessionInput')

const SessionSchema = z.object({
  jwt: z.string(),
  utilisateur: z.object({
    id: z.string().uuid(),
    email: z.string(),
    nomComplet: z.string(),
  }),
}).openapi('Session')

const createSessionRoute = createRoute({
  method: 'post',
  path: '/auth/sessions',
  tags: ['Authentication'],
  summary: "Échange un id_token ProConnect contre un JWT interne",
  description: "Valide la signature de l'id_token via JWKS ProConnect, upsert l'utilisateur en DB, retourne un JWT interne HS256. Actuellement retourne 501 en attendant l'intégration ProConnect (voir docs/architecture/init-design.md §9.3).",
  request: { body: { content: { 'application/json': { schema: CreateSessionInputSchema } } } },
  responses: {
    201: { description: 'Session créée', content: { 'application/json': { schema: SessionSchema } } },
    400: { description: 'Requête invalide', content: { 'application/json': { schema: ErrorSchema } } },
    501: { description: 'Non implémenté (scaffolding ProConnect)', content: { 'application/json': { schema: ErrorSchema } } },
  },
})

export function registerCreateSessionRoute(app: OpenAPIHono, container: AwilixContainer): void {
  app.openapi(createSessionRoute, async (context) => {
    const body = context.req.valid('json')
    const handler = container.resolve<CreateSessionHandler>('createSessionHandler')
    const result = await handler.executer({ idToken: body.id_token })
    return respondWithResult(context, result, (session) =>
      context.json({
        jwt: session.jwt,
        utilisateur: session.utilisateur,
      }, 201),
    )
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/infrastructure/http/routes/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — route POST /auth/sessions (501)

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, hono
Tags: pilote-mb, backend, authentication, http
Files-changed: 1"
```

---

### Tâche 47 : auth middleware + require-scope middleware

**Files:**
- Create: `apps/pilote-mb-core/src/platform/http/middlewares/auth.middleware.ts`
- Create: `apps/pilote-mb-core/src/platform/http/middlewares/require-scope.middleware.ts`

- [ ] **Step 1: `auth.middleware.ts`**

```ts
// src/platform/http/middlewares/auth.middleware.ts
import { type MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { type AuthenticationFacade } from '@/authentication/public/authentication.facade'

const API_KEY_PREFIXES = ['pmb_live_', 'pmb_test_']
const PUBLIC_PATHS = new Set(['/health', '/api/openapi.json', '/api/docs'])

export const authMiddleware = (facade: AuthenticationFacade): MiddlewareHandler => async (context, next) => {
  const path = new URL(context.req.url).pathname
  if (PUBLIC_PATHS.has(path) || path.startsWith('/api/docs')) {
    await next()
    return
  }

  const header = context.req.header('authorization')
  if (!header || !header.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Authorization Bearer header required' })
  }
  const token = header.slice(7)

  if (API_KEY_PREFIXES.some((prefix) => token.startsWith(prefix))) {
    const apiKey = await facade.verifyApiKey(token)
    if (!apiKey) throw new HTTPException(401, { message: 'Invalid API key' })
    context.set('auth', { type: 'api-key', apiKey })
  } else if (token.split('.').length === 3) {
    const utilisateur = await facade.verifyJwt(token)
    if (!utilisateur) throw new HTTPException(401, { message: 'Invalid JWT' })
    context.set('auth', { type: 'user', utilisateur })
  } else {
    throw new HTTPException(401, { message: 'Unknown token format' })
  }

  await next()
}
```

- [ ] **Step 2: `require-scope.middleware.ts`**

```ts
// src/platform/http/middlewares/require-scope.middleware.ts
import { type MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const requireScope = (scope: string): MiddlewareHandler => async (context, next) => {
  const auth = context.get('auth') as { type: 'api-key' | 'user'; apiKey?: { scopes: string[] } } | undefined
  if (!auth) throw new HTTPException(401, { message: 'Not authenticated' })
  if (auth.type === 'api-key' && (!auth.apiKey?.scopes.includes(scope))) {
    throw new HTTPException(403, { message: `Missing required scope: ${scope}` })
  }
  await next()
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/src/platform/http/middlewares/auth.middleware.ts apps/pilote-mb-core/src/platform/http/middlewares/require-scope.middleware.ts
git commit -m "[DITP-pilotage/pilote-2] feature: platform — auth middleware dispatch API-Key/JWT + require-scope

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, hono
Tags: pilote-mb, backend, platform, http, auth
Files-changed: 2"
```

---

### Tâche 48 : CLI create-api-key

**Files:**
- Create: `apps/pilote-mb-core/src/authentication/infrastructure/scripts/create-api-key.ts`

- [ ] **Step 1: Impl**

```ts
// src/authentication/infrastructure/scripts/create-api-key.ts
import { parseArgs } from 'node:util'
import { buildAppContainer } from '@/platform/container/build-app-container'
import { ApiKey } from '@/authentication/domain/api-key/api-key'
import { Scope } from '@/authentication/domain/api-key/scope'
import { type ApiKeyRepository } from '@/authentication/domain/api-key/api-key.repository'
import { type ApiKeyHasher } from '@/authentication/domain/api-key/api-key-hasher'
import { type TokenGenerator } from '@/authentication/domain/api-key/token-generator'
import { type Clock } from '@/shared-kernel/clock'

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      nom: { type: 'string' },
      env: { type: 'string' },
      scopes: { type: 'string' },
    },
  })

  if (!values.nom || !values.env || !values.scopes) {
    console.error('Usage: pnpm create-api-key --nom <nom> --env live|test --scopes "resource:action,resource:action"')
    process.exit(1)
  }
  if (values.env !== 'live' && values.env !== 'test') {
    console.error('--env doit être "live" ou "test"')
    process.exit(1)
  }

  const { getContainer } = buildAppContainer()
  const auth = getContainer('authentication')
  const platform = getContainer('platform')

  const scopes = values.scopes.split(',').map((scope) => Scope.from(scope.trim()))
  const result = ApiKey.create({
    nom: values.nom,
    scopes,
    environment: values.env,
    hasher: auth.resolve<ApiKeyHasher>('apiKeyHasher'),
    tokenGenerator: auth.resolve<TokenGenerator>('tokenGenerator'),
    clock: platform.resolve<Clock>('clock'),
  })

  if (result.isErr()) {
    console.error(`Erreur : ${result.error.code} — ${result.error.message}`)
    process.exit(1)
  }

  const { aggregate, rawToken } = result.value
  await auth.resolve<ApiKeyRepository>('apiKeyRepository').save(aggregate)

  console.log('API Key créée avec succès.')
  console.log(`Nom       : ${aggregate.nom}`)
  console.log(`Prefix    : ${aggregate.keyPrefix}`)
  console.log(`Token     : ${rawToken}`)
  console.log('⚠️  Ce token ne sera plus jamais affiché. Conserve-le en lieu sûr.')
}

main().then(() => process.exit(0)).catch((error) => {
  console.error('Erreur inattendue :', error)
  process.exit(1)
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/authentication/infrastructure/scripts/
git commit -m "[DITP-pilotage/pilote-2] feature: authentication — CLI create-api-key

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript
Tags: pilote-mb, backend, authentication, cli
Files-changed: 1"
```

---

## Phase 13 — Bootstrap + assemblage final

### Tâche 49 : index.ts (bootstrap du serveur)

**Files:**
- Create: `apps/pilote-mb-core/src/index.ts`

- [ ] **Step 1: Impl**

```ts
// src/index.ts
import { serve } from '@hono/node-server'
import { buildAppContainer } from '@/platform/container/build-app-container'
import { buildApp } from '@/platform/http/app'
import { authMiddleware } from '@/platform/http/middlewares/auth.middleware'
import { registerHealthRoute } from '@/healthcheck/infrastructure/http/routes/health.route'
import { registerCreateSessionRoute } from '@/authentication/infrastructure/http/routes/create-session.route'
import { type Logger } from '@/shared-kernel/logger'
import { type AuthenticationFacade } from '@/authentication/public/authentication.facade'
import { config } from '@/config'

const { getContainer } = buildAppContainer()
const platformContainer = getContainer('platform')
const authenticationContainer = getContainer('authentication')
const healthcheckContainer = getContainer('healthcheck')

const logger = platformContainer.resolve<Logger>('logger')
const authenticationFacade = authenticationContainer.resolve<AuthenticationFacade>('authenticationFacade')

const app = buildApp({
  logger,
  authMiddleware: (app) => app.use('*', authMiddleware(authenticationFacade)),
  registrations: [
    (app) => registerHealthRoute(app, healthcheckContainer),
    (app) => registerCreateSessionRoute(app, authenticationContainer),
  ],
})

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  logger.info({ port: info.port, source: 'bootstrap' }, `pilote-mb-core listening on :${info.port}`)
})
```

- [ ] **Step 2: Installer `@hono/node-server`**

Run: `pnpm -F @pilote-mb/core add @hono/node-server`

- [ ] **Step 3: Vérifier que le build passe**

Run: `pnpm -F @pilote-mb/core build`
Expected: compilation OK, pas d'erreur

- [ ] **Step 4: Lancer le serveur en dev et tester manuellement**

Run (terminal 1): `pnpm -F @pilote-mb/core dev`

Run (terminal 2):
```bash
curl -sS http://localhost:3000/health
# Expected: {"status":"ok","database":"reachable"}

curl -sS http://localhost:3000/api/openapi.json | head -c 200
# Expected: JSON OpenAPI 3.1

curl -sS -X POST http://localhost:3000/auth/sessions -H 'Content-Type: application/json' -d '{"id_token":"foo"}'
# Expected: {"code":"NOT_IMPLEMENTED","message":"Fonctionnalité non implémentée : intégration ProConnect..."}
```

Arrêter le serveur (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-mb-core/src/index.ts apps/pilote-mb-core/package.json pnpm-lock.yaml
git commit -m "[DITP-pilotage/pilote-2] feature: bootstrap — index.ts assemble le serveur complet

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, hono
Tags: pilote-mb, backend, bootstrap
Files-changed: 3"
```

---

### Tâche 50 : Test E2E healthcheck via HTTP

**Files:**
- Create: `apps/pilote-mb-core/src/healthcheck/infrastructure/http/routes/health.route.test.ts`

- [ ] **Step 1: Test E2E**

```ts
// src/healthcheck/infrastructure/http/routes/health.route.test.ts
import { describe, it, expect } from 'vitest'
import { OpenAPIHono } from '@hono/zod-openapi'
import { buildAppContainer } from '@/platform/container/build-app-container'
import { registerHealthRoute } from './health.route'

describe('GET /health', () => {
  it('retourne 200 avec status ok quand la DB est joignable', async () => {
    const { getContainer } = buildAppContainer()
    const app = new OpenAPIHono()
    registerHealthRoute(app, getContainer('healthcheck'))

    const response = await app.request('/health')

    expect(response.status).toEqual(200)
    const body = await response.json() as { status: string; database: string }
    expect(body.status).toEqual('ok')
    expect(body.database).toEqual('reachable')
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/healthcheck/infrastructure/http/routes/health.route.test.ts
git commit -m "[DITP-pilotage/pilote-2] test: e2e GET /health retourne 200

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, vitest, hono
Tags: pilote-mb, backend, healthcheck, e2e
Files-changed: 1"
```

---

### Tâche 51 : Test E2E auth middleware (401 sans bearer, 200 avec API key)

**Files:**
- Create: `apps/pilote-mb-core/src/platform/http/middlewares/auth.middleware.test.ts`

- [ ] **Step 1: Test**

```ts
// src/platform/http/middlewares/auth.middleware.test.ts
import { describe, it, expect } from 'vitest'
import { OpenAPIHono } from '@hono/zod-openapi'
import { withTestTransaction } from '@/test/with-test-transaction'
import { authMiddleware } from './auth.middleware'
import { registerErrorHandler } from './error-handler.middleware'
import { createApiKeyFixture } from '@/test/fixtures/api-key.fixture'
import { type AuthenticationFacade } from '@/authentication/public/authentication.facade'
import { type Logger } from '@/shared-kernel/logger'

describe('auth middleware', () => {
  it('401 si aucun bearer', withTestTransaction(async (testContext) => {
    const facade = testContext.resolve<AuthenticationFacade>('authentication', 'authenticationFacade')
    const logger = testContext.resolve<Logger>('platform', 'logger')
    const app = new OpenAPIHono()
    app.use('*', authMiddleware(facade))
    app.get('/protected', (context) => context.json({ ok: true }))
    registerErrorHandler(app, logger)

    const response = await app.request('/protected')

    expect(response.status).toEqual(401)
    const body = await response.json() as { code: string }
    expect(body.code).toEqual('UNAUTHORIZED')
  }))

  it('200 avec une API key valide', withTestTransaction(async (testContext) => {
    const facade = testContext.resolve<AuthenticationFacade>('authentication', 'authenticationFacade')
    const logger = testContext.resolve<Logger>('platform', 'logger')
    const { rawToken } = await createApiKeyFixture({ active: true })
    const app = new OpenAPIHono()
    app.use('*', authMiddleware(facade))
    app.get('/protected', (context) => context.json({ ok: true }))
    registerErrorHandler(app, logger)

    const response = await app.request('/protected', {
      headers: { authorization: `Bearer ${rawToken}` },
    })

    expect(response.status).toEqual(200)
  }))

  it('laisse passer /health sans bearer', withTestTransaction(async (testContext) => {
    const facade = testContext.resolve<AuthenticationFacade>('authentication', 'authenticationFacade')
    const app = new OpenAPIHono()
    app.use('*', authMiddleware(facade))
    app.get('/health', (context) => context.json({ status: 'ok' }))

    const response = await app.request('/health')

    expect(response.status).toEqual(200)
  }))
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/src/platform/http/middlewares/auth.middleware.test.ts
git commit -m "[DITP-pilotage/pilote-2] test: auth middleware — 401/200 + routes publiques

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: typescript, vitest, hono
Tags: pilote-mb, backend, platform, auth, e2e
Files-changed: 1"
```

---

## Phase 14 — Documentation + CI

### Tâche 52 : CLAUDE.md du projet pilote-mb-core

**Files:**
- Create: `apps/pilote-mb-core/CLAUDE.md`

- [ ] **Step 1: Écrire le CLAUDE.md**

Contenu : reprendre les règles de l'init-design (conventions nommage, DDD stratégique + tactique, module-system, Published Language / ACL, règle getPrisma interdite sauf fixtures, règle no-barrel, règle no-export-default, règle no-`new Date()` hors platform/test, `withTestTransaction` obligatoire pour tests d'intégration, parallélisme max, ports locaux 5434/5435, commandes `pnpm dev`/`test`/`lint`/`create-api-key`, liens vers init-design.md).

Structure recommandée (copier depuis `apps/pilote-ppg/CLAUDE.md` puis adapter) :
- Project Overview
- Development Commands
- Architecture (lien vers init-design)
- Patterns fondamentaux (DDD by the book, module-system, transactions, logger, config)
- Conventions (nommage, exports, barrel, comments)
- API design (8 règles agent-ready)
- Authentication
- Testing (parallèle, withTestTransaction, factories, règles)
- Project advices (DRY, YAGNI, TDD, `expect(result).toEqual(...)`, pas de variables 1-2 char)

- [ ] **Step 2: Commit**

```bash
git add apps/pilote-mb-core/CLAUDE.md
git commit -m "[DITP-pilotage/pilote-2] docs: CLAUDE.md pour pilote-mb-core

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: markdown
Tags: pilote-mb, backend, documentation
Files-changed: 1"
```

---

### Tâche 53 : ADRs 0001 + 0002

**Files:**
- Create: `apps/pilote-mb-core/docs/architecture/decisions/0001-record-architecture-decisions.md`
- Create: `apps/pilote-mb-core/docs/architecture/decisions/0002-architecture-init-pilote-mb-core.md`

- [ ] **Step 1: Copier l'ADR 0001 depuis pilote-ppg**

Reprendre le contenu de `apps/pilote-ppg/docs/architecture/decisions/0001-record-architecture-decisions.md`, mettre la date du jour.

- [ ] **Step 2: Écrire l'ADR 0002**

```markdown
# 2. Architecture initiale de pilote-mb-core

Date : <date du jour>

## Statut

Accepté

## Contexte

Création du backend `pilote-mb-core`, version générique et paramétrable de `pilote-ppg`. Besoin de poser des fondations solides pour une app prévue pour durer et grossir, potentiellement multi-tenant et consommée par un agent IA satellite.

## Décision

Nous adoptons :
- **DDD by the book** (stratégique + tactique complet) avec bounded contexts isolés
- **Architecture context-first** (1 dossier racine par BC)
- **Module-system Awilix** adapté de pilote-ppg pour le câblage DI
- **Stack Hono + Prisma + Vitest + neverthrow + pino**
- **API-first design** avec Swagger exposé en prod
- **Authentification à deux stratégies** : API Keys (SHA-256, complet) + ProConnect OIDC (scaffolding)

Les détails exhaustifs sont dans `docs/architecture/init-design.md`.

## Conséquences

- Code isolé par BC, mutations dans un BC sans impact sur les autres
- Overhead upfront (~15-20% de code supplémentaire vs archi plate) mais dette technique quasi nulle
- Extraction future en microservices facilitée
- `dependency-cruiser` obligatoire pour maintenir l'isolation
- Tous les nouveaux BCs suivront ce template (cf. `authentication/` comme référence)
```

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-mb-core/docs/architecture/decisions/
git commit -m "[DITP-pilotage/pilote-2] docs: ADRs 0001 + 0002 pour pilote-mb-core

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: feature
Stack: markdown
Tags: pilote-mb, backend, documentation, adr
Files-changed: 2"
```

---

### Tâche 54 : Mise à jour de `.github/workflows/testAndLint.yml`

**Files:**
- Modify: `.github/workflows/testAndLint.yml`

- [ ] **Step 1: Ajouter le filter `pilote-mb-core`**

Dans la section `jobs.changes.steps[1].with.filters`, ajouter :
```yaml
pilote-mb-core:
  - 'apps/pilote-mb-core/**'
  - 'package.json'
  - 'pnpm-lock.yaml'
```

Et dans `jobs.changes.outputs`, ajouter :
```yaml
pilote-mb-core: ${{ steps.filter.outputs.pilote-mb-core }}
```

- [ ] **Step 2: Ajouter les jobs `test-mb-core` et `lint-mb-core`**

Après le job `lint`, ajouter (cf. init-design §12.2 pour le bloc complet) :
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
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
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

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/testAndLint.yml
git commit -m "[DITP-pilotage/pilote-2] ci: ajouter jobs test et lint pour pilote-mb-core

Refs:
Project: pilote-2
Client: DITP-pilotage
Category: infra
Stack: github-actions
Tags: pilote-mb, backend, ci
Files-changed: 1"
```

---

## Self-review checklist

Avant de considérer le ticket comme terminé, vérifier :

- [ ] **Spec coverage** : chacune des 15 sections du design a un(des) livrable(s) implémenté(s)
- [ ] **Tous les critères de succès de l'init-design.md §15 sont vérifiés** (curl /health, curl /api/docs, 401 sans bearer, 200 avec API key, etc.)
- [ ] **`pnpm -F @pilote-mb/core lint`** passe (eslint + tsc + dependency-cruiser)
- [ ] **`pnpm -F @pilote-mb/core test`** : tous les tests passent en parallèle
- [ ] **`pnpm -F @pilote-mb/core build`** : compilation OK
- [ ] **Workflows CI** `test-mb-core` et `lint-mb-core` passent vert sur la PR
- [ ] **`dependency-cruiser`** : tenter un import interdit (ex: `import { UtilisateurRepository } from '@/authentication/domain/...'` depuis `@/healthcheck/`) doit échouer au lint
- [ ] **ESLint `new ApiKey()`** : tenter une instanciation directe hors `api-key.ts` ou tests doit échouer au lint
- [ ] **Event audit** : créer une API key via CLI doit logguer `API_KEY_CREATED` dans `application_log`
- [ ] **Isolation tests** : lancer 20 tests en parallèle sans collision

