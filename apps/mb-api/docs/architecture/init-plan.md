# Plan d'implémentation — Initialisation de mb-api

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place le backend `mb-api` (Hono + CQS lite + functional core / imperative shell + API Keys complètes + scaffolding ProConnect) avec un endpoint `GET /health` fonctionnel et `POST /auth/sessions` retournant 501.

**Architecture:** Modules Awilix — `framework` (tech transverse), `authentication` (métier), `healthcheck` (utilitaire). **Pas de DDD by the book** : pas d'AggregateRoot, pas de Domain Events, pas de bounded contexts. Modèles = types + factory functions pures (functional core). Use cases = handlers (imperative shell). Ports & adapters côté écriture, queries plus libres côté lecture. ResultAsync + railway oriented programming. AsyncLocalStorage pour transactions ET pour identité authentifiée. ApiModel comme published language back/front.

**Tech Stack:** TypeScript strict, Hono + `@hono/zod-openapi` + `@hono/swagger-ui`, Prisma 6 + PostgreSQL, Awilix (module-system adapté de pilote-ppg), neverthrow (Result + ResultAsync), pino (sinks composables), Vitest (parallèle via `withTestTransaction`), `dependency-cruiser`.

**Spec de référence :** `apps/mb-api/docs/architecture/init-design.md`

**Conventions obligatoires (voir CLAUDE.md + design doc) :**

- Verbes/tech en anglais, entités en français (`getIndicateurById`, `CreateEntityHandler`)
- Pas de classes pour les modèles — types + factory functions + branded types
- Pas d'`export default` (sauf config tierces)
- Pas de barrel files (sauf `public/`)
- Tests en TDD strict, parallèle, `withTestTransaction`
- Commits : pas de `Co-Authored-By`, convention `[DITP-pilotage/pilote-2] <type>: <description>`

---

## Vue d'ensemble des phases

| Phase                                           | Contenu                                                                      | Tâches  |
| ----------------------------------------------- | ---------------------------------------------------------------------------- | ------- |
| **1. Fondations projet**                        | Workspace, configs, docker, Prisma, config app                               | T1–T7   |
| **2. Framework — primitives**                   | Result, AppError, ports (Clock, Transaction, Logger, AuthContext)            | T8–T10  |
| **3. Framework — infrastructure**               | PrismaPilote, SystemClock, Logger sinks, AsyncLocalStorageAuthContext        | T11–T15 |
| **4. Framework — module-system + container**    | define-module, boot-modules, frameworkModule, build-app-container            | T16–T19 |
| **5. Framework — HTTP**                         | error-mapping, respondWithResult, middlewares, buildApp, Swagger             | T20–T26 |
| **6. Test infrastructure**                      | vitest.setup, FakeClock, withTestTransaction, TestContext                    | T27–T30 |
| **7. Module healthcheck**                       | Handler, route, module                                                       | T31–T33 |
| **8. Module authentication — functional core**  | Branded types, types `ApiKey`/`Utilisateur`, factory functions pures, errors | T34–T38 |
| **9. Module authentication — ports**            | ApiKeyHasher, TokenGenerator, TokenSigner, repositories                      | T39     |
| **10. Module authentication — infrastructure**  | Adapters crypto, repositories Prisma + mappers, ProConnect stub, CLI         | T40–T46 |
| **11. Module authentication — use cases**       | VerifyApiKeyHandler, VerifyJwtHandler, CreateSessionHandler stub             | T47–T49 |
| **12. Module authentication — public + module** | ApiModels + facade + authentication.module.ts                                | T50–T52 |
| **13. Module authentication — HTTP + CLI**      | Route create-session, middlewares auth + auth-context, CLI create-api-key    | T53–T56 |
| **14. Bootstrap + assemblage final**            | `index.ts`, enregistrement workspace, tests E2E                              | T57–T60 |
| **15. Documentation + CI**                      | CLAUDE.md, ADRs, workflow CI                                                 | T61–T64 |

---

## Phase 1 — Fondations projet

### Tâche 1 : Enregistrer mb-api dans le monorepo

**Files:** Create: `apps/mb-api/package.json`

- [ ] **Step 1: Créer `package.json`**

```json
{
  "name": "@pilote/mb-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": "24.9.0" },
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

- [ ] **Step 2: Vérifier détection** — `pnpm -F @pilote/mb-api exec pwd`
- [ ] **Step 3: Commit**

```bash
git commit -m "[DITP-pilotage/pilote-2] feature: creer le package @pilote/mb-api"
```

---

### Tâche 2 : Installer les dépendances

- [ ] **Step 1: Runtime** — `pnpm -F @pilote/mb-api add hono @hono/zod-openapi @hono/swagger-ui zod neverthrow awilix pino @prisma/client jsonwebtoken openid-client`
- [ ] **Step 2: Dev** — `pnpm -F @pilote/mb-api add -D typescript @types/node @types/jsonwebtoken tsx prisma vitest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier dependency-cruiser pino-pretty`
- [ ] **Step 3: Vérifier** — `pnpm install`
- [ ] **Step 4: Commit** — `feature: installer les dependances de mb-api`

---

### Tâche 3 : Configurer TypeScript

**Files:** Create: `apps/mb-api/tsconfig.json`

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
      "@/framework/*": ["src/framework/*"],
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

- [ ] **Step 2: Vérifier** — `pnpm -F @pilote/mb-api exec tsc --noEmit`
- [ ] **Step 3: Commit** — `feature: configurer typescript pour mb-api`

---

### Tâche 4 : Configurer Vitest, ESLint, Prettier, dependency-cruiser

**Files:**

- Create: `apps/mb-api/vitest.config.ts`
- Create: `apps/mb-api/.eslintrc.cjs`
- Create: `apps/mb-api/.prettierrc`
- Create: `apps/mb-api/.dependency-cruiser.cjs`

- [ ] **Step 1: Écrire `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    sequence: { concurrent: true },
    pool: "threads",
    poolOptions: { threads: { maxThreads: 10 } },
    testTimeout: 30_000,
    setupFiles: ["src/test/vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@/framework": resolve(__dirname, "src/framework"),
      "@/authentication": resolve(__dirname, "src/authentication"),
      "@/healthcheck": resolve(__dirname, "src/healthcheck"),
      "@/test": resolve(__dirname, "src/test"),
      "@/config": resolve(__dirname, "src/config"),
    },
  },
});
```

- [ ] **Step 2: Écrire `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { project: "./tsconfig.json", tsconfigRootDir: __dirname },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "ExportDefaultDeclaration",
        message: "export default is forbidden (use named exports instead).",
      },
      {
        selector: "NewExpression[callee.name='Date']",
        message:
          "new Date() is forbidden in model/commands/queries. Inject Clock instead.",
      },
    ],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
  overrides: [
    {
      files: ["*.config.ts", "*.config.cjs", "*.config.js", ".eslintrc.cjs"],
      rules: { "no-restricted-syntax": "off" },
    },
    {
      files: [
        "**/infrastructure/persistence/**/*.ts",
        "**/framework/**/*.ts",
        "**/*.test.ts",
        "**/*.fixture.ts",
      ],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: "ExportDefaultDeclaration",
            message: "export default is forbidden.",
          },
        ],
      },
    },
  ],
};
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
      name: "no-cross-module-internals",
      severity: "error",
      comment:
        "A module cannot import internals from another module — only from its public/.",
      from: { path: "^src/(authentication|healthcheck)/" },
      to: {
        path: "^src/(authentication|healthcheck)/",
        pathNot: ["^src/(authentication|healthcheck)/public/"],
      },
      pathNot: "(.*)/\\1/",
    },
    {
      name: "no-module-import-outside-bootstrap",
      severity: "error",
      comment: "Only build-app-container.ts can import <module>.module.ts.",
      from: { pathNot: "^src/framework/container/build-app-container\\.ts$" },
      to: { path: "^src/[^/]+/[^/]+\\.module\\.ts$" },
    },
    {
      name: "framework-stays-neutral",
      severity: "error",
      comment: "framework/ cannot depend on any business module.",
      from: { path: "^src/framework/" },
      to: { path: "^src/(authentication|healthcheck)/" },
    },
    {
      name: "public-folder-depends-only-on-framework",
      severity: "error",
      comment: "A module public/ folder can only depend on framework/.",
      from: { path: "^src/[^/]+/public/" },
      to: { pathNot: ["^src/framework/", "^src/[^/]+/public/"] },
    },
    {
      name: "model-stays-pure",
      severity: "error",
      comment:
        "model/ cannot depend on infrastructure, commands, queries, http.",
      from: { path: "^src/[^/]+/model/" },
      to: { path: "^src/[^/]+/(infrastructure|commands|queries)/" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    doNotFollow: { path: "node_modules" },
  },
};
```

- [ ] **Step 5: Vérifier** — `pnpm -F @pilote/mb-api lint`
- [ ] **Step 6: Commit** — `feature: configurer vitest, eslint, prettier et dependency-cruiser`

---

### Tâche 5 : Docker-compose avec DB de dev et de test

**Files:**

- Create: `apps/mb-api/docker-compose.yml`
- Create: `apps/mb-api/.env.example`

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

- [ ] **Step 3: Lancer la DB locale** — `cd apps/mb-api && docker compose up -d postgres`
- [ ] **Step 4: Commit** — `feature: ajouter docker-compose avec DB dev et test`

---

### Tâche 6 : Prisma schema initial + première migration

**Files:** Create: `apps/mb-api/prisma/schema.prisma`

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

- [ ] **Step 2: Migrer** — `cd apps/mb-api && export DATABASE_URL=... && pnpm prisma migrate dev --name init`
- [ ] **Step 3: Commit** — `feature: schema prisma initial avec api_key, utilisateur, application_log`

---

### Tâche 7 : Config Zod-validée au boot

**Files:**

- Create: `apps/mb-api/src/config.ts`
- Create: `apps/mb-api/src/config.test.ts`

- [ ] **Step 1: Écrire le test** (3 cas : valide avec defaults, JWT_SECRET trop court, DATABASE_URL manquante)
- [ ] **Step 2: Lancer (échec)**
- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/config.ts
import { z } from "zod";

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production", "test"]),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  LOG_TO_DATABASE: z.coerce.boolean().default(true),
  JWT_SECRET: z.string().min(32),
  JWT_TTL_HOURS: z.coerce.number().int().positive().default(8),
  PROCONNECT_ISSUER_URL: z.string().url().optional(),
  PROCONNECT_CLIENT_ID: z.string().optional(),
  PROCONNECT_CLIENT_SECRET: z.string().optional(),
  PROCONNECT_REDIRECT_URI: z.string().url().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

export function parseConfig(source: NodeJS.ProcessEnv): Config {
  return ConfigSchema.parse(source);
}

export const config = parseConfig(process.env);
```

- [ ] **Step 4: Lancer (pass) + commit** — `feature: config zod-validee au boot`

---

## Phase 2 — Framework — primitives

### Tâche 8 : Result + ResultAsync (re-exports neverthrow)

**Files:** Create: `apps/mb-api/src/framework/result/index.ts`

- [ ] **Step 1: Écrire les re-exports**

```ts
// src/framework/result/index.ts
export { ok, err, okAsync, errAsync, Result, ResultAsync } from "neverthrow";
export type { Ok, Err } from "neverthrow";
```

- [ ] **Step 2: Commit** — `feature: framework — re-export neverthrow (Result + ResultAsync)`

---

### Tâche 9 : AppError + ErrorKind

**Files:**

- Create: `apps/mb-api/src/framework/errors/kinds.ts`
- Create: `apps/mb-api/src/framework/errors/app-error.ts`
- Create: `apps/mb-api/src/framework/errors/app-error.test.ts`
- Create: `apps/mb-api/src/framework/errors/common-errors.ts` — `UnauthenticatedError`, `ForbiddenError`, `NotImplementedError`, `RepositoryError`

- [ ] **Step 1: Écrire `kinds.ts`**

```ts
// src/framework/errors/kinds.ts
export type ErrorKind =
  | "not-found"
  | "validation"
  | "conflict"
  | "forbidden"
  | "unauthenticated"
  | "not-implemented"
  | "internal";
```

- [ ] **Step 2: Écrire le test sur `app-error.ts`** (vérifie `code`, `kind`, `message`, `details`, `name`, `instanceof Error`)
- [ ] **Step 3: Implémentation `app-error.ts`**

```ts
// src/framework/errors/app-error.ts
import { type ErrorKind } from "./kinds";

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly kind: ErrorKind;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}
```

- [ ] **Step 4: Implémentation `common-errors.ts`**

```ts
// src/framework/errors/common-errors.ts
import { AppError } from "./app-error";

export class UnauthenticatedError extends AppError {
  readonly code = "UNAUTHENTICATED";
  readonly kind = "unauthenticated" as const;
}

export class ForbiddenError extends AppError {
  readonly code = "FORBIDDEN";
  readonly kind = "forbidden" as const;
}

export class NotImplementedError extends AppError {
  readonly code = "NOT_IMPLEMENTED";
  readonly kind = "not-implemented" as const;
}

export class RepositoryError extends AppError {
  readonly code = "REPOSITORY_ERROR";
  readonly kind = "internal" as const;
}
```

- [ ] **Step 5: Commit** — `feature: framework — AppError + ErrorKind + erreurs communes`

---

### Tâche 10 : Ports techniques (Clock, Transaction, Logger, AuthContext)

**Files:**

- Create: `apps/mb-api/src/framework/clock/clock.ts`
- Create: `apps/mb-api/src/framework/persistence/prisma/transaction.ts`
- Create: `apps/mb-api/src/framework/logging/logger.ts`
- Create: `apps/mb-api/src/framework/auth-context/auth-context.ts`
- Create: `apps/mb-api/src/framework/auth-context/auth.ts` — types `Auth`, `ApiKeyAuth`, `UserAuth`

- [ ] **Step 1: `clock.ts`**

```ts
// src/framework/clock/clock.ts
export interface Clock {
  now(): Date;
}
```

- [ ] **Step 2: `transaction.ts`**

```ts
// src/framework/persistence/prisma/transaction.ts
export interface Transaction {
  run<T>(scope: () => Promise<T>): Promise<T>;
}
```

- [ ] **Step 3: `logger.ts`**

```ts
// src/framework/logging/logger.ts
export interface Logger {
  info(context: Record<string, unknown>, message: string): void;
  warn(context: Record<string, unknown>, message: string): void;
  error(context: Record<string, unknown>, message: string): void;
  debug(context: Record<string, unknown>, message: string): void;
}
```

- [ ] **Step 4: `auth.ts`** — types

```ts
// src/framework/auth-context/auth.ts
export type ApiKeyAuth = {
  readonly kind: "api-key";
  readonly apiKeyId: string;
  readonly nom: string;
  readonly scopes: ReadonlyArray<string>;
};

export type UserAuth = {
  readonly kind: "user";
  readonly utilisateurId: string;
  readonly email: string;
  readonly nomComplet: string;
  readonly statutAcces: string;
  readonly roles: ReadonlyArray<string>;
};

export type Auth = ApiKeyAuth | UserAuth;
```

- [ ] **Step 5: `auth-context.ts`** — port

```ts
// src/framework/auth-context/auth-context.ts
import { type Auth } from "./auth";

export interface AuthContext {
  run<T>(auth: Auth, scope: () => Promise<T>): Promise<T>;
  current(): Auth | undefined;
}
```

- [ ] **Step 6: Commit** — `feature: framework — ports techniques (Clock, Transaction, Logger, AuthContext)`

---

## Phase 3 — Framework — infrastructure

### Tâche 11 : PrismaPilote wrapper + PrismaTransaction

**Files:**

- Create: `apps/mb-api/src/framework/persistence/prisma/prisma-transaction.ts`
- Create: `apps/mb-api/src/framework/persistence/prisma/prisma-pilote.ts`

- [ ] **Step 1: Écrire `prisma-transaction.ts`**

```ts
// src/framework/persistence/prisma/prisma-transaction.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaClient } from "@prisma/client";
import { type Transaction } from "./transaction";

const prisma = new PrismaClient();

export type PilotePrismaClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];
export const txStore = new AsyncLocalStorage<PilotePrismaClient>();

export class PrismaTransaction implements Transaction {
  async run<T>(scope: () => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => txStore.run(tx, scope));
  }
}

export { prisma as prismaClient };
export const getPrisma = (): PilotePrismaClient =>
  txStore.getStore() ?? prismaClient;
```

- [ ] **Step 2: Écrire `prisma-pilote.ts`**

```ts
// src/framework/persistence/prisma/prisma-pilote.ts
import {
  txStore,
  type PilotePrismaClient,
  prismaClient,
} from "./prisma-transaction";

export class PrismaPilote {
  getInstance(): PilotePrismaClient {
    return txStore.getStore() ?? prismaClient;
  }
}
```

- [ ] **Step 3: Commit** — `feature: framework — PrismaPilote wrapper + PrismaTransaction`

---

### Tâche 12 : SystemClock adapter

**Files:**

- Create: `apps/mb-api/src/framework/clock/system-clock.ts`
- Create: `apps/mb-api/src/framework/clock/system-clock.test.ts`

- [ ] **Step 1: Test** (vérifie `clock.now()` retourne une `Date` cohérente avec `Date.now()`)
- [ ] **Step 2: Implémentation**

```ts
// src/framework/clock/system-clock.ts
/* eslint-disable no-restricted-syntax */
import { type Clock } from "./clock";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
```

- [ ] **Step 3: Commit** — `feature: framework — SystemClock adapter`

---

### Tâche 13 : Logger sinks composables

**Files:**

- Create: `src/framework/logging/log-sink.ts`
- Create: `src/framework/logging/sinks/pino-stdout.sink.ts`
- Create: `src/framework/logging/sinks/database.sink.ts`
- Create: `src/framework/logging/composite-logger.ts`
- Create: `src/framework/logging/composite-logger.test.ts`
- Create: `src/framework/logging/build-logger.ts`

- [ ] **Step 1: `log-sink.ts`** — `LogLevel`, `LogEntry`, `LogSink`

```ts
export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogEntry {
  readonly level: LogLevel;
  readonly timestamp: Date;
  readonly message: string;
  readonly context: Record<string, unknown>;
}
export interface LogSink {
  write(entry: LogEntry): void;
}
```

- [ ] **Step 2: Test du `CompositeLogger`** (dispatche à tous les sinks, niveau correct)
- [ ] **Step 3: `composite-logger.ts`**

```ts
// src/framework/logging/composite-logger.ts
import { type Logger } from "./logger";
import { type LogSink, type LogLevel } from "./log-sink";

export class CompositeLogger implements Logger {
  constructor(private readonly sinks: ReadonlyArray<LogSink>) {}
  info(context, message) {
    this.emit("info", context, message);
  }
  warn(context, message) {
    this.emit("warn", context, message);
  }
  error(context, message) {
    this.emit("error", context, message);
  }
  debug(context, message) {
    this.emit("debug", context, message);
  }

  private emit(
    level: LogLevel,
    context: Record<string, unknown>,
    message: string
  ): void {
    const entry = { level, timestamp: new Date(), message, context };
    for (const sink of this.sinks) sink.write(entry);
  }
}
```

- [ ] **Step 4: `pino-stdout.sink.ts`** — wraps pino, JSON en prod, pretty en dev
- [ ] **Step 5: `database.sink.ts`** — insert dans `application_log` via `getPrisma()`, best-effort (try/catch silencieux)
- [ ] **Step 6: `build-logger.ts`**

```ts
// src/framework/logging/build-logger.ts
import { type Config } from "@/config";
import { CompositeLogger } from "./composite-logger";
import { PinoStdoutSink } from "./sinks/pino-stdout.sink";
import { DatabaseSink } from "./sinks/database.sink";
import { type LogSink } from "./log-sink";

export function buildLogger(config: Config): CompositeLogger {
  const sinks: LogSink[] = [new PinoStdoutSink(config)];
  if (config.LOG_TO_DATABASE) sinks.push(new DatabaseSink());
  return new CompositeLogger(sinks);
}
```

- [ ] **Step 7: Commit** — `feature: framework — logger composable avec sinks pino + database`

---

### Tâche 14 : AsyncLocalStorageAuthContext + helpers

**Files:**

- Create: `src/framework/auth-context/async-local-storage-auth-context.ts`
- Create: `src/framework/auth-context/current-auth.ts`
- Create: `src/framework/auth-context/current-auth.test.ts`

- [ ] **Step 1: Test** — vérifier que dans un `run(auth, scope)`, `current()` et `requireUser()` retournent l'identité ; hors scope, `requireUser()` throw `UnauthenticatedError`

- [ ] **Step 2: `async-local-storage-auth-context.ts`**

```ts
// src/framework/auth-context/async-local-storage-auth-context.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { type Auth } from "./auth";
import { type AuthContext } from "./auth-context";

export const authStore = new AsyncLocalStorage<Auth>();

export class AsyncLocalStorageAuthContext implements AuthContext {
  run<T>(auth: Auth, scope: () => Promise<T>): Promise<T> {
    return authStore.run(auth, scope);
  }
  current(): Auth | undefined {
    return authStore.getStore();
  }
}
```

- [ ] **Step 3: `current-auth.ts`** — helpers globaux

```ts
// src/framework/auth-context/current-auth.ts
import { authStore } from "./async-local-storage-auth-context";
import { type Auth, type ApiKeyAuth, type UserAuth } from "./auth";
import { UnauthenticatedError } from "@/framework/errors/common-errors";

export const currentAuth = (): Auth | undefined => authStore.getStore();

export const requireUser = (): UserAuth => {
  const auth = currentAuth();
  if (auth?.kind !== "user")
    throw new UnauthenticatedError("user authentication required");
  return auth;
};

export const requireApiKey = (): ApiKeyAuth => {
  const auth = currentAuth();
  if (auth?.kind !== "api-key")
    throw new UnauthenticatedError("api-key authentication required");
  return auth;
};
```

- [ ] **Step 4: Commit** — `feature: framework — AuthContext via AsyncLocalStorage + requireUser/requireApiKey`

---

### Tâche 15 : DomainEventPublisher remplacé — pas d'event bus à l'init

**Note** : pas de tâche dédiée. Le design (5.11) explicite l'absence d'events bus à l'init. Si on a besoin d'un audit log, on l'écrit en **logging structuré** dans le use case correspondant. Plus tard, un module `audit` pourra émerger comme consommateur de logs structurés ou via un mécanisme dédié.

---

## Phase 4 — Framework — module-system + container

### Tâche 16 : Adapter le module-system depuis pilote-ppg

**Files:**

- Create: `src/framework/module-system/define-module.ts`
- Create: `src/framework/module-system/boot-modules.ts`
- Create: `src/framework/module-system/module-names.ts`
- Create: `src/framework/module-system/types.ts`

- [ ] **Step 1: Lire le module-system de pilote-ppg** (`apps/pilote-ppg/src/server/.../module-system/` ou équivalent) pour comprendre le pattern existant
- [ ] **Step 2: `module-names.ts`**

```ts
// src/framework/module-system/module-names.ts
export const moduleNames = [
  "framework",
  "authentication",
  "healthcheck",
] as const;
export type ModuleName = (typeof moduleNames)[number];
```

- [ ] **Step 3: `types.ts`** — `NoExports`, `VerifyCradle`, `ExtractScope`, `ModuleDefinition`
- [ ] **Step 4: `define-module.ts`** — factory curryfiée typée
- [ ] **Step 5: `boot-modules.ts`** — orchestrateur 2 phases (container racine + scopes par module + résolution eager des exports)
- [ ] **Step 6: Tests d'intégration du boot** (un module simple `A` exporte vers `B`, vérifier que B reçoit la valeur résolue)
- [ ] **Step 7: Commit** — `feature: framework — module-system Awilix adapte de pilote-ppg`

---

### Tâche 17 : frameworkModule (cradle root)

**Files:** Create: `src/framework/framework.module.ts`

- [ ] **Step 1: Écrire le module**

```ts
// src/framework/framework.module.ts
import { defineModule } from "./module-system/define-module";
import type {
  NoExports,
  VerifyCradle,
  ExtractScope,
} from "./module-system/types";
import { config, type Config } from "@/config";
import { PrismaPilote } from "./persistence/prisma/prisma-pilote";
import { PrismaTransaction } from "./persistence/prisma/prisma-transaction";
import type { Transaction } from "./persistence/prisma/transaction";
import type { Clock } from "./clock/clock";
import { SystemClock } from "./clock/system-clock";
import type { Logger } from "./logging/logger";
import { buildLogger } from "./logging/build-logger";
import type { AuthContext } from "./auth-context/auth-context";
import { AsyncLocalStorageAuthContext } from "./auth-context/async-local-storage-auth-context";

export type FrameworkCradle = {
  prisma: PrismaPilote;
  transaction: Transaction;
  logger: Logger;
  config: Config;
  clock: Clock;
  authContext: AuthContext;
};

export const frameworkModule = defineModule<NoExports, FrameworkCradle>()({
  name: "framework",
  imports: [],
  exports: [],
  register: (container, { asModuleFunction, asModuleClass }) => {
    container.register({
      prisma: asModuleFunction(() => new PrismaPilote()).singleton(),
      transaction: asModuleFunction(() => new PrismaTransaction()).singleton(),
      logger: asModuleFunction(() => buildLogger(config)).singleton(),
      config: asModuleFunction(() => config).singleton(),
      clock: asModuleClass(SystemClock).singleton(),
      authContext: asModuleClass(AsyncLocalStorageAuthContext).singleton(),
    } satisfies VerifyCradle<FrameworkCradle>);
  },
});

type Scope = ExtractScope<typeof frameworkModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
```

- [ ] **Step 2: Commit** — `feature: framework — frameworkModule racine avec cradle technique`

---

### Tâche 18 : build-app-container (placeholder, modules ajoutés au fur et à mesure)

**Files:** Create: `src/framework/container/build-app-container.ts`

- [ ] **Step 1: Écrire la version initiale (framework seul)**

```ts
// src/framework/container/build-app-container.ts
import { bootModules } from "@/framework/module-system/boot-modules";
import { frameworkModule } from "@/framework/framework.module";

export function buildAppContainer() {
  return bootModules([frameworkModule]);
}
```

- [ ] **Step 2: Test d'intégration** — résoudre `prisma`, `clock`, `logger`, `authContext` du container `framework`
- [ ] **Step 3: Commit** — `feature: framework — build-app-container initial avec frameworkModule`

---

### Tâche 19 : Vérifier le bootstrap fonctionne via un test

- [ ] **Step 1: Test d'intégration** — initialiser `buildAppContainer()`, résoudre les services, vérifier que `transaction.run()` propage la tx
- [ ] **Step 2: Commit** (s'il y a des ajustements nécessaires sur les modules)

---

## Phase 5 — Framework — HTTP

### Tâche 20 : ErrorSchema + error-mapping

**Files:**

- Create: `src/framework/http/schemas/error.schema.ts`
- Create: `src/framework/http/error-mapping.ts`
- Create: `src/framework/http/error-mapping.test.ts`

- [ ] **Step 1: `error.schema.ts`**

```ts
// src/framework/http/schemas/error.schema.ts
import { z } from "@hono/zod-openapi";

export const ErrorSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  })
  .openapi("ErrorSchema");
```

- [ ] **Step 2: Test du mapping** (chaque kind → status correct)
- [ ] **Step 3: `error-mapping.ts`**

```ts
// src/framework/http/error-mapping.ts
import { type ErrorKind } from "@/framework/errors/kinds";
import { type AppError } from "@/framework/errors/app-error";

const KIND_TO_STATUS: Record<ErrorKind, number> = {
  "not-found": 404,
  validation: 400,
  conflict: 409,
  forbidden: 403,
  unauthenticated: 401,
  "not-implemented": 501,
  internal: 500,
};

export const mapAppErrorToHttpStatus = (error: AppError): number =>
  KIND_TO_STATUS[error.kind];
```

- [ ] **Step 4: Commit** — `feature: framework http — ErrorSchema + mapping kind vers HTTP status`

---

### Tâche 21 : respondWithResult helper

**Files:**

- Create: `src/framework/http/respond-with-result.ts`
- Create: `src/framework/http/respond-with-result.test.ts`

- [ ] **Step 1: Test** (cas Result ok, cas Result err, cas ResultAsync ok/err)
- [ ] **Step 2: Implémentation**

```ts
// src/framework/http/respond-with-result.ts
import type { Context } from "hono";
import { type Result, type ResultAsync } from "@/framework/result";
import { type AppError } from "@/framework/errors/app-error";
import { mapAppErrorToHttpStatus } from "./error-mapping";

export async function respondWithResult<TValue, TError extends AppError>(
  context: Context,
  source: Result<TValue, TError> | ResultAsync<TValue, TError>,
  onSuccess: (value: TValue) => Response
): Promise<Response> {
  const result = "isErr" in source ? source : await source;
  if (result.isErr()) {
    const error = result.error;
    return context.json(
      { code: error.code, message: error.message, details: error.details },
      mapAppErrorToHttpStatus(error)
    );
  }
  return onSuccess(result.value);
}
```

- [ ] **Step 3: Commit** — `feature: framework http — helper respondWithResult avec support Result et ResultAsync`

---

### Tâche 22 : Middlewares HTTP — request-id, logger, error-handler

**Files:**

- Create: `src/framework/http/middlewares/request-id.middleware.ts`
- Create: `src/framework/http/middlewares/logger.middleware.ts`
- Create: `src/framework/http/middlewares/error-handler.middleware.ts`

- [ ] **Step 1: `request-id.middleware.ts`** — génère un UUID, pose `c.set('requestId', ...)`
- [ ] **Step 2: `logger.middleware.ts`** — log d'entrée/sortie (méthode, URL, status, durée, requestId)
- [ ] **Step 3: `error-handler.middleware.ts`** — `app.onError` + `app.notFound` (cf. design 16.3)
- [ ] **Step 4: Test** d'intégration via `app.request()` (route qui throw → 500 ; route qui throw `AppError` → status mappé)
- [ ] **Step 5: Commit** — `feature: framework http — middlewares request-id, logger, error-handler`

---

### Tâche 23 : Middleware auth-context

**Files:** Create: `src/framework/http/middlewares/auth-context.middleware.ts`

- [ ] **Step 1: Implémentation**

```ts
// src/framework/http/middlewares/auth-context.middleware.ts
import type { Context, Next } from "hono";
import { type AuthContext } from "@/framework/auth-context/auth-context";
import { type Auth } from "@/framework/auth-context/auth";

export function authContextMiddleware(deps: { authContext: AuthContext }) {
  return async (context: Context, next: Next): Promise<Response | void> => {
    const auth = context.get("auth") as Auth | undefined;
    if (!auth) {
      await next();
      return;
    }
    await deps.authContext.run(auth, () => next());
  };
}
```

- [ ] **Step 2: Test** — middleware exécuté avec `auth` ; un `requireUser()` appelé en aval retourne l'identité
- [ ] **Step 3: Commit** — `feature: framework http — middleware auth-context (alimente AsyncLocalStorage)`

---

### Tâche 24 : Middleware require-scope

**Files:** Create: `src/framework/http/middlewares/require-scope.middleware.ts`

- [ ] **Step 1: Implémentation**

```ts
// src/framework/http/middlewares/require-scope.middleware.ts
import type { Context, Next } from "hono";
import {
  ForbiddenError,
  UnauthenticatedError,
} from "@/framework/errors/common-errors";
import { currentAuth } from "@/framework/auth-context/current-auth";

export function requireScope(scope: string) {
  return async (_context: Context, next: Next) => {
    const auth = currentAuth();
    if (!auth) throw new UnauthenticatedError("authentication required");
    if (auth.kind !== "api-key" || !auth.scopes.includes(scope)) {
      throw new ForbiddenError(`scope ${scope} required`);
    }
    await next();
  };
}
```

- [ ] **Step 2: Tests** — sans auth → 401 ; user (pas api-key) → 403 ; api-key sans scope → 403 ; api-key avec scope → 200
- [ ] **Step 3: Commit** — `feature: framework http — middleware require-scope`

---

### Tâche 25 : buildApp avec Swagger UI

**Files:**

- Create: `src/framework/http/app.ts`
- Create: `src/framework/http/schemas/pagination.schema.ts`

- [ ] **Step 1: `pagination.schema.ts`**

```ts
import { z } from "@hono/zod-openapi";

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
```

- [ ] **Step 2: `app.ts`** — `buildApp(container)` qui crée un `OpenAPIHono`, enregistre middlewares (request-id, logger, auth-context, error-handler), expose `/api/openapi.json` et `/api/docs` (swagger-ui)

```ts
// src/framework/http/app.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import type { AwilixContainer } from "awilix";
import { requestIdMiddleware } from "./middlewares/request-id.middleware";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import { authContextMiddleware } from "./middlewares/auth-context.middleware";
import { registerErrorHandler } from "./middlewares/error-handler.middleware";

export function buildApp(container: AwilixContainer): OpenAPIHono {
  const app = new OpenAPIHono();
  app.use("*", requestIdMiddleware());
  app.use("*", loggerMiddleware(container.resolve("logger")));
  app.use(
    "*",
    authContextMiddleware({ authContext: container.resolve("authContext") })
  );
  registerErrorHandler(app, container);

  app.doc("/api/openapi.json", {
    openapi: "3.1.0",
    info: { title: "mb-api", version: "0.1.0" },
  });
  app.get("/api/docs", swaggerUI({ url: "/api/openapi.json" }));

  return app;
}
```

- [ ] **Step 3: Test** — `app.request('/api/openapi.json')` retourne 200 + JSON OpenAPI
- [ ] **Step 4: Commit** — `feature: framework http — buildApp avec middlewares + Swagger UI`

---

### Tâche 26 : Auth middleware (cadre, sans implémentation des stratégies)

**Files:** Create: `src/framework/http/middlewares/auth.middleware.ts`

- [ ] **Step 1: Implémentation cadre**

```ts
// src/framework/http/middlewares/auth.middleware.ts
import type { Context, Next } from "hono";
import { UnauthenticatedError } from "@/framework/errors/common-errors";
import type { AuthenticationFacade } from "@/authentication/public/authentication.facade";
import type { Auth } from "@/framework/auth-context/auth";

const PUBLIC_ROUTES = ["/health", "/api/openapi.json", "/api/docs"];

export function authMiddleware(deps: {
  authenticationFacade: AuthenticationFacade;
}) {
  return async (context: Context, next: Next) => {
    if (PUBLIC_ROUTES.some((route) => context.req.path.startsWith(route)))
      return next();

    const header = context.req.header("Authorization");
    if (!header?.startsWith("Bearer "))
      throw new UnauthenticatedError("Bearer token required");
    const token = header.slice("Bearer ".length);

    const auth: Auth | undefined = await resolveAuth(
      token,
      deps.authenticationFacade
    );
    if (!auth) throw new UnauthenticatedError("Invalid or revoked credentials");

    context.set("auth", auth);
    await next();
  };
}

async function resolveAuth(
  token: string,
  facade: AuthenticationFacade
): Promise<Auth | undefined> {
  if (token.startsWith("pmb_live_") || token.startsWith("pmb_test_")) {
    const result = await facade.verifyApiKey(token);
    if (result.isErr() || !result.value) return undefined;
    return {
      kind: "api-key",
      apiKeyId: result.value.id,
      nom: result.value.nom,
      scopes: result.value.scopes,
    };
  }
  if (token.split(".").length === 3) {
    const result = await facade.verifyJwt(token);
    if (result.isErr() || !result.value) return undefined;
    const utilisateur = result.value;
    return {
      kind: "user",
      utilisateurId: utilisateur.id,
      email: utilisateur.email,
      nomComplet: utilisateur.nomComplet,
      statutAcces: utilisateur.statutAcces,
      roles: utilisateur.roles,
    };
  }
  return undefined;
}
```

- [ ] **Step 2: Note** — l'implémentation finale dépend de la facade `authentication` (créée en Phase 12). Le test d'intégration est différé jusqu'à la Phase 14.
- [ ] **Step 3: Commit** — `feature: framework http — middleware auth qui dispatch API key vs JWT`

---

## Phase 6 — Test infrastructure

### Tâche 27 : vitest.setup.ts

**Files:** Create: `src/test/vitest.setup.ts`

- [ ] **Step 1: Implémentation** — charge `dotenv` (`.env.test`), affirme `NODE_ENV === 'test'`, garantit que les migrations sont appliquées
- [ ] **Step 2: Commit** — `feature: test — vitest.setup.ts initial`

---

### Tâche 28 : FakeClock

**Files:**

- Create: `src/test/fake-clock.ts`
- Create: `src/test/fake-clock.test.ts`

- [ ] **Step 1: Test** — `set(date)` puis `now()` retourne la date figée ; `tick(ms)` avance
- [ ] **Step 2: Implémentation**

```ts
// src/test/fake-clock.ts
import { type Clock } from "@/framework/clock/clock";

export class FakeClock implements Clock {
  constructor(private current: Date = new Date("2026-01-01T00:00:00Z")) {}
  now(): Date {
    return new Date(this.current);
  }
  set(date: Date): void {
    this.current = date;
  }
  tick(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
```

- [ ] **Step 3: Commit** — `feature: test — FakeClock figé pour tests deterministes`

---

### Tâche 29 : withTestTransaction + TestContext

**Files:**

- Create: `src/test/test-context.ts`
- Create: `src/test/with-test-transaction.ts`
- Create: `src/test/with-test-transaction.test.ts`

- [ ] **Step 1: `test-context.ts`**

```ts
// src/test/test-context.ts
import type { ModuleName } from "@/framework/module-system/module-names";

export class TestContext {
  constructor(private readonly getContainer: (name: ModuleName) => any) {}
  resolveHandler<T>(moduleName: ModuleName, key: string): T {
    return this.getContainer(moduleName).resolve(key) as T;
  }
  resolveRepository<T>(moduleName: ModuleName, key: string): T {
    return this.getContainer(moduleName).resolve(key) as T;
  }
}
```

- [ ] **Step 2: `with-test-transaction.ts`** (cf. design 10.3)
- [ ] **Step 3: Test** — créer une row dans la tx, vérifier qu'elle est rollback en sortie de test
- [ ] **Step 4: Commit** — `feature: test — withTestTransaction + TestContext`

---

### Tâche 30 : Fixtures (squelette commun)

**Files:** Create: `src/test/fixtures/.gitkeep` (les fixtures concrètes arrivent dans les Phases métier)

- [ ] **Step 1:** placeholder, créé pour valider la structure
- [ ] **Step 2: Commit** — `chore: test — placeholder pour fixtures`

---

## Phase 7 — Module healthcheck

### Tâche 31 : CheckHealthHandler

**Files:**

- Create: `src/healthcheck/queries/check-health/check-health.handler.ts`
- Create: `src/healthcheck/queries/check-health/check-health.handler.test.ts`

- [ ] **Step 1: Test** — `withTestTransaction` qui résout le handler et vérifie `execute()` retourne `{ status: 'ok' }`
- [ ] **Step 2: Implémentation**

```ts
// src/healthcheck/queries/check-health/check-health.handler.ts
import { type Inject } from "@/healthcheck/healthcheck.module";

export class CheckHealthHandler {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(): Promise<{ status: "ok" }> {
    await this.deps.prisma.getInstance().$queryRaw`SELECT 1`;
    return { status: "ok" };
  }
}
```

- [ ] **Step 3: Commit** — `feature: healthcheck — CheckHealthHandler ping DB`

---

### Tâche 32 : Route GET /health

**Files:**

- Create: `src/healthcheck/infrastructure/http/routes/health.route.ts`

- [ ] **Step 1: Implémentation**

```ts
// src/healthcheck/infrastructure/http/routes/health.route.ts
import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import type { AwilixContainer } from "awilix";
import { CheckHealthHandler } from "@/healthcheck/queries/check-health/check-health.handler";

const HealthSchema = z
  .object({ status: z.literal("ok") })
  .openapi("HealthApiModel");

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Vérifie la santé du backend",
  description: "Ping DB et retourne ok. Route publique.",
  responses: {
    200: {
      description: "OK",
      content: { "application/json": { schema: HealthSchema } },
    },
  },
});

export function registerHealthRoute(
  app: OpenAPIHono,
  container: AwilixContainer
) {
  app.openapi(healthRoute, async (context) => {
    const handler = container.resolve<CheckHealthHandler>("checkHealthHandler");
    const result = await handler.execute();
    return context.json(result, 200);
  });
}
```

- [ ] **Step 2: Commit** — `feature: healthcheck — route GET /health publique`

---

### Tâche 33 : healthcheck.module.ts + branchement

**Files:**

- Create: `src/healthcheck/healthcheck.module.ts`
- Modify: `src/framework/container/build-app-container.ts`
- Modify: `src/framework/module-system/module-names.ts`

- [ ] **Step 1: `healthcheck.module.ts`**

```ts
// src/healthcheck/healthcheck.module.ts
import { defineModule } from "@/framework/module-system/define-module";
import type {
  VerifyCradle,
  ExtractScope,
} from "@/framework/module-system/types";
import { CheckHealthHandler } from "./queries/check-health/check-health.handler";

type HealthcheckCradle = {
  checkHealthHandler: CheckHealthHandler;
};

type HealthcheckExports = Record<string, never>;

export const healthcheckModule = defineModule<
  HealthcheckExports,
  HealthcheckCradle
>()({
  name: "healthcheck",
  imports: ["framework"],
  exports: [],
  register: (container, { asModuleClass }) => {
    container.register({
      checkHealthHandler: asModuleClass(CheckHealthHandler).singleton(),
    } satisfies VerifyCradle<HealthcheckCradle>);
  },
});

type Scope = ExtractScope<typeof healthcheckModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
```

- [ ] **Step 2: Brancher dans `build-app-container.ts`** + ajouter `'healthcheck'` aux `module-names.ts`
- [ ] **Step 3: Test E2E via `app.request('/health')` → 200 `{ status: 'ok' }`**
- [ ] **Step 4: Commit** — `feature: healthcheck — module + branchement bootstrap`

---

## Phase 8 — Module authentication — functional core

### Tâche 34 : Branded types pour les IDs et VOs simples

**Files:**

- Create: `src/authentication/model/api-key-id.ts` + test
- Create: `src/authentication/model/utilisateur-id.ts` + test
- Create: `src/authentication/model/email.ts` + test
- Create: `src/authentication/model/scope.ts` + test
- Create: `src/authentication/model/statut-acces.ts`

- [ ] **Step 1: Test `api-key-id.ts`** (UUID valide → ok ; invalide → err)
- [ ] **Step 2: Implémentation `api-key-id.ts`**

```ts
// src/authentication/model/api-key-id.ts
import { randomUUID } from "node:crypto";
import { ok, err, type Result } from "@/framework/result";
import { AppError } from "@/framework/errors/app-error";

export type ApiKeyId = string & { readonly __brand: "ApiKeyId" };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class InvalidApiKeyIdError extends AppError {
  readonly code = "INVALID_API_KEY_ID";
  readonly kind = "validation" as const;
}

export const apiKeyId = (
  raw: string
): Result<ApiKeyId, InvalidApiKeyIdError> => {
  if (!UUID_REGEX.test(raw))
    return err(new InvalidApiKeyIdError(`invalid uuid: ${raw}`));
  return ok(raw as ApiKeyId);
};

export const generateApiKeyId = (): ApiKeyId => randomUUID() as ApiKeyId;
```

- [ ] **Step 3: Idem pour `utilisateur-id.ts`**, `email.ts` (validation regex email), `scope.ts` (format `<resource>:<action>`)
- [ ] **Step 4: `statut-acces.ts`** — union de littéraux

```ts
// src/authentication/model/statut-acces.ts
export const STATUT_ACCES_VALUES = [
  "EN_ATTENTE_ACCES",
  "ACTIF",
  "REFUSE",
  "DESACTIVE",
] as const;
export type StatutAcces = (typeof STATUT_ACCES_VALUES)[number];
```

- [ ] **Step 5: Commit** — `feature: authentication — branded types ApiKeyId, UtilisateurId, Email, Scope, StatutAcces`

---

### Tâche 35 : Erreurs métier authentication

**Files:** Create: `src/authentication/model/errors.ts`

- [ ] **Step 1: Implémentation**

```ts
// src/authentication/model/errors.ts
import { AppError } from "@/framework/errors/app-error";

export class InvalidApiKeyNameError extends AppError {
  readonly code = "INVALID_API_KEY_NAME";
  readonly kind = "validation" as const;
}

export class ApiKeyScopesRequiredError extends AppError {
  readonly code = "API_KEY_SCOPES_REQUIRED";
  readonly kind = "validation" as const;
}

export class ApiKeyAlreadyRevokedError extends AppError {
  readonly code = "API_KEY_ALREADY_REVOKED";
  readonly kind = "conflict" as const;
}

export class MissingIdTokenError extends AppError {
  readonly code = "MISSING_ID_TOKEN";
  readonly kind = "validation" as const;
}
```

- [ ] **Step 2: Commit** — `feature: authentication — erreurs metier`

---

### Tâche 36 : Type ApiKey + factory functions pures

**Files:**

- Create: `src/authentication/model/api-key.ts`
- Create: `src/authentication/model/api-key.test.ts`

- [ ] **Step 1: Tests** :

  - `createApiKey` refuse nom vide → `InvalidApiKeyNameError`
  - `createApiKey` refuse scopes vides → `ApiKeyScopesRequiredError`
  - `createApiKey` génère un token préfixé `pmb_live_` ou `pmb_test_`
  - `createApiKey` retourne `apiKey.keyHash === hasher.hash(rawToken)`
  - `createApiKey` enregistre `dateCreation === clock.now()`
  - `revokeApiKey(active)` retourne `{ ...apiKey, active: false }`
  - `revokeApiKey(revoked)` retourne `ApiKeyAlreadyRevokedError`

- [ ] **Step 2: Implémentation**

```ts
// src/authentication/model/api-key.ts
import { ok, err, type Result } from "@/framework/result";
import { type ApiKeyId, generateApiKeyId } from "./api-key-id";
import { type Scope } from "./scope";
import { type Clock } from "@/framework/clock/clock";
import { type ApiKeyHasher } from "@/authentication/ports/api-key-hasher";
import { type TokenGenerator } from "@/authentication/ports/token-generator";
import {
  InvalidApiKeyNameError,
  ApiKeyScopesRequiredError,
  ApiKeyAlreadyRevokedError,
} from "./errors";

export type ApiKey = {
  readonly id: ApiKeyId;
  readonly nom: string;
  readonly keyHash: string;
  readonly keyPrefix: string;
  readonly scopes: ReadonlyArray<Scope>;
  readonly active: boolean;
  readonly dateCreation: Date;
  readonly dateDerniereUtilisation?: Date;
};

export type CreateApiKeyParams = {
  readonly nom: string;
  readonly scopes: ReadonlyArray<Scope>;
  readonly environment: "live" | "test";
  readonly hasher: ApiKeyHasher;
  readonly tokenGenerator: TokenGenerator;
  readonly clock: Clock;
};

export type CreateApiKeyError =
  | InvalidApiKeyNameError
  | ApiKeyScopesRequiredError;

export const createApiKey = (
  params: CreateApiKeyParams
): Result<{ apiKey: ApiKey; rawToken: string }, CreateApiKeyError> => {
  if (params.nom.trim() === "")
    return err(new InvalidApiKeyNameError("nom is empty"));
  if (params.scopes.length === 0)
    return err(new ApiKeyScopesRequiredError("at least one scope required"));

  const prefix = params.environment === "live" ? "pmb_live_" : "pmb_test_";
  const rawToken = params.tokenGenerator.generate(prefix);
  const keyHash = params.hasher.hash(rawToken);
  const keyPrefix = rawToken.slice(0, 12);

  const apiKey: ApiKey = {
    id: generateApiKeyId(),
    nom: params.nom,
    keyHash,
    keyPrefix,
    scopes: params.scopes,
    active: true,
    dateCreation: params.clock.now(),
  };
  return ok({ apiKey, rawToken });
};

export const revokeApiKey = (
  apiKey: ApiKey
): Result<ApiKey, ApiKeyAlreadyRevokedError> => {
  if (!apiKey.active)
    return err(new ApiKeyAlreadyRevokedError(`${apiKey.id} already revoked`));
  return ok({ ...apiKey, active: false });
};

export const apiKeyHasScope = (apiKey: ApiKey, scope: Scope): boolean =>
  apiKey.scopes.includes(scope);
```

- [ ] **Step 3: Tests passent en pur unit (sans container, sans DB, sans mock — `hasher`/`tokenGenerator`/`clock` fournis comme stubs simples)**
- [ ] **Step 4: Commit** — `feature: authentication model — type ApiKey + factory functions pures`

---

### Tâche 37 : Type Utilisateur + factory functions (stubées)

**Files:**

- Create: `src/authentication/model/utilisateur.ts`
- Create: `src/authentication/model/utilisateur.test.ts`

- [ ] **Step 1: Tests** :

  - `createUtilisateurFromProConnect(claims, clock)` retourne un `Utilisateur` avec `statutAcces = 'EN_ATTENTE_ACCES'`, `tokenVersion = 1`, `dateCreation === clock.now()`
  - Test sur invariant minimal (email vide → erreur)

- [ ] **Step 2: Implémentation (factory partielle, le mapping ProConnect réel arrive plus tard)**

```ts
// src/authentication/model/utilisateur.ts
import { ok, err, type Result } from "@/framework/result";
import { generateUtilisateurId, type UtilisateurId } from "./utilisateur-id";
import { parseEmail, type Email } from "./email";
import { type StatutAcces } from "./statut-acces";
import { type Clock } from "@/framework/clock/clock";

export type Utilisateur = {
  readonly id: UtilisateurId;
  readonly subProconnect: string;
  readonly email: Email;
  readonly nom: string;
  readonly prenom: string;
  readonly statutAcces: StatutAcces;
  readonly roles: ReadonlyArray<string>;
  readonly tokenVersion: number;
  readonly dateCreation: Date;
  readonly dateDerniereConnexion?: Date;
};

export type ProConnectClaims = {
  readonly sub: string;
  readonly email: string;
  readonly given_name: string;
  readonly family_name: string;
};

export const createUtilisateurFromProConnect = (
  claims: ProConnectClaims,
  clock: Clock
): Result<Utilisateur, Error> => {
  const emailResult = parseEmail(claims.email);
  if (emailResult.isErr()) return err(emailResult.error);
  return ok({
    id: generateUtilisateurId(),
    subProconnect: claims.sub,
    email: emailResult.value,
    nom: claims.family_name,
    prenom: claims.given_name,
    statutAcces: "EN_ATTENTE_ACCES",
    roles: [],
    tokenVersion: 1,
    dateCreation: clock.now(),
  });
};
```

- [ ] **Step 3: Commit** — `feature: authentication model — type Utilisateur + factory createUtilisateurFromProConnect (scaffolding)`

---

### Tâche 38 : Mappers pures domain ↔ persistence

**Files:**

- Create: `src/authentication/infrastructure/persistence/api-key.mapper.ts`
- Create: `src/authentication/infrastructure/persistence/utilisateur.mapper.ts`

- [ ] **Step 1: Implémenter les fonctions pures `apiKeyToPersistence` / `apiKeyFromPersistence` (idem Utilisateur)**
- [ ] **Step 2: Tests unitaires sur les mappers (round-trip)**
- [ ] **Step 3: Commit** — `feature: authentication infra — mappers ApiKey/Utilisateur ↔ persistence`

---

## Phase 9 — Module authentication — ports

### Tâche 39 : Ports (hasher, generator, signer, repositories)

**Files:**

- Create: `src/authentication/ports/api-key-hasher.ts`
- Create: `src/authentication/ports/token-generator.ts`
- Create: `src/authentication/ports/token-signer.ts`
- Create: `src/authentication/ports/api-key.repository.ts`
- Create: `src/authentication/ports/utilisateur.repository.ts`

- [ ] **Step 1: Écrire les interfaces**

```ts
// api-key-hasher.ts
export interface ApiKeyHasher {
  hash(token: string): string;
}

// token-generator.ts
export interface TokenGenerator {
  generate(prefix: "pmb_live_" | "pmb_test_"): string;
}

// token-signer.ts
import { type ResultAsync } from "@/framework/result";
import { AppError } from "@/framework/errors/app-error";
export class JwtVerificationError extends AppError {
  readonly code = "JWT_INVALID";
  readonly kind = "unauthenticated" as const;
}
export type JwtPayload = {
  utilisateurId: string;
  statutAcces: string;
  roles: ReadonlyArray<string>;
  tokenVersion: number;
};
export interface TokenSigner {
  sign(payload: JwtPayload): string;
  verify(token: string): ResultAsync<JwtPayload, JwtVerificationError>;
}

// api-key.repository.ts
import { type ResultAsync } from "@/framework/result";
import { type RepositoryError } from "@/framework/errors/common-errors";
import { type ApiKey } from "@/authentication/model/api-key";
import { type ApiKeyId } from "@/authentication/model/api-key-id";
export interface ApiKeyRepository {
  save(apiKey: ApiKey): ResultAsync<void, RepositoryError>;
  findByKeyHash(keyHash: string): ResultAsync<ApiKey | null, RepositoryError>;
  findById(id: ApiKeyId): ResultAsync<ApiKey | null, RepositoryError>;
}

// utilisateur.repository.ts
import { type Utilisateur } from "@/authentication/model/utilisateur";
import { type UtilisateurId } from "@/authentication/model/utilisateur-id";
export interface UtilisateurRepository {
  save(utilisateur: Utilisateur): ResultAsync<void, RepositoryError>;
  findById(id: UtilisateurId): ResultAsync<Utilisateur | null, RepositoryError>;
  findBySubProconnect(
    sub: string
  ): ResultAsync<Utilisateur | null, RepositoryError>;
}
```

- [ ] **Step 2: Commit** — `feature: authentication ports — hasher, generator, signer, repositories`

---

## Phase 10 — Module authentication — infrastructure

### Tâche 40 : Sha256ApiKeyHasher

**Files:**

- Create: `src/authentication/infrastructure/crypto/sha256-api-key-hasher.ts`
- Create: `src/authentication/infrastructure/crypto/sha256-api-key-hasher.test.ts`

- [ ] **Step 1: Test** — vérifier déterminisme (`hash(t) === hash(t)`)
- [ ] **Step 2: Implémentation** (cf. design 9.2)
- [ ] **Step 3: Commit** — `feature: authentication infra — Sha256ApiKeyHasher`

---

### Tâche 41 : CryptoTokenGenerator

**Files:**

- Create: `src/authentication/infrastructure/crypto/crypto-token-generator.ts`
- Create: `src/authentication/infrastructure/crypto/crypto-token-generator.test.ts`

- [ ] **Step 1: Test** — vérifier longueur ≥ 64, préfixe correct, deux appels différents
- [ ] **Step 2: Implémentation** (cf. design 9.2)
- [ ] **Step 3: Commit** — `feature: authentication infra — CryptoTokenGenerator`

---

### Tâche 42 : JsonwebtokenTokenSigner

**Files:**

- Create: `src/authentication/infrastructure/crypto/jsonwebtoken-token-signer.ts`
- Create: `src/authentication/infrastructure/crypto/jsonwebtoken-token-signer.test.ts`

- [ ] **Step 1: Tests** — round-trip (`sign(payload) → verify` retourne le payload), token altéré → `JwtVerificationError`, token expiré → erreur, payload incorrect → erreur
- [ ] **Step 2: Implémentation** (utilise `jsonwebtoken`, HS256, lit `JWT_SECRET` + `JWT_TTL_HOURS` via config injectée, retourne `ResultAsync` pour `verify`)
- [ ] **Step 3: Commit** — `feature: authentication infra — JsonwebtokenTokenSigner avec ResultAsync`

---

### Tâche 43 : ApiKeyPrismaRepository

**Files:**

- Create: `src/authentication/infrastructure/persistence/api-key.prisma-repository.ts`
- Create: `src/authentication/infrastructure/persistence/api-key.prisma-repository.test.ts`

- [ ] **Step 1: Tests `withTestTransaction`** — `save` puis `findByKeyHash` retourne l'`ApiKey` ; `findByKeyHash` non existant → `null` ; `save` upsert (idempotent)
- [ ] **Step 2: Implémentation**

```ts
// src/authentication/infrastructure/persistence/api-key.prisma-repository.ts
import { ResultAsync } from "@/framework/result";
import { RepositoryError } from "@/framework/errors/common-errors";
import { type Inject } from "@/authentication/authentication.module";
import { type ApiKey } from "@/authentication/model/api-key";
import { type ApiKeyId } from "@/authentication/model/api-key-id";
import { type ApiKeyRepository } from "@/authentication/ports/api-key.repository";
import { apiKeyToPersistence, apiKeyFromPersistence } from "./api-key.mapper";

export class ApiKeyPrismaRepository implements ApiKeyRepository {
  constructor(private readonly deps: Inject<"prisma">) {}

  save(apiKey: ApiKey): ResultAsync<void, RepositoryError> {
    const data = apiKeyToPersistence(apiKey);
    return ResultAsync.fromPromise(
      this.deps.prisma
        .getInstance()
        .api_key.upsert({ where: { id: data.id }, create: data, update: data })
        .then(() => undefined),
      (cause) => new RepositoryError("save api_key failed", { cause })
    );
  }

  findByKeyHash(keyHash: string): ResultAsync<ApiKey | null, RepositoryError> {
    return ResultAsync.fromPromise(
      this.deps.prisma
        .getInstance()
        .api_key.findUnique({ where: { key_hash: keyHash } }),
      (cause) => new RepositoryError("findByKeyHash failed", { cause })
    ).map((row) => (row ? apiKeyFromPersistence(row) : null));
  }

  findById(id: ApiKeyId): ResultAsync<ApiKey | null, RepositoryError> {
    return ResultAsync.fromPromise(
      this.deps.prisma.getInstance().api_key.findUnique({ where: { id } }),
      (cause) => new RepositoryError("findById failed", { cause })
    ).map((row) => (row ? apiKeyFromPersistence(row) : null));
  }
}
```

- [ ] **Step 3: Commit** — `feature: authentication infra — ApiKeyPrismaRepository avec ResultAsync`

---

### Tâche 44 : UtilisateurPrismaRepository

**Files:**

- Create: `src/authentication/infrastructure/persistence/utilisateur.prisma-repository.ts`
- Create: `src/authentication/infrastructure/persistence/utilisateur.prisma-repository.test.ts`

- [ ] **Step 1: Tests `withTestTransaction`** — `save` + `findById` + `findBySubProconnect` ; row absente → `null`
- [ ] **Step 2: Implémentation** (similaire à `ApiKeyPrismaRepository`)
- [ ] **Step 3: Commit** — `feature: authentication infra — UtilisateurPrismaRepository`

---

### Tâche 45 : ProConnect client (scaffolding)

**Files:** Create: `src/authentication/infrastructure/proconnect/proconnect-client.ts`

- [ ] **Step 1: Implémentation stub** — méthodes `validateIdToken(idToken): ResultAsync<ProConnectClaims, …>` qui retourne `errAsync(NotImplementedError)`. Imports `openid-client` mais ne crée pas encore le client (config optionnelle).
- [ ] **Step 2: Commit** — `feature: authentication infra — ProconnectClient scaffolding`

---

### Tâche 46 : Fixtures api-key + utilisateur

**Files:**

- Create: `src/test/fixtures/api-key.fixture.ts`
- Create: `src/test/fixtures/utilisateur.fixture.ts`

- [ ] **Step 1: Implémentations** (cf. design 10.6 — utilise `getPrisma()` directement, override possible)
- [ ] **Step 2: Commit** — `feature: test — fixtures api-key et utilisateur`

---

## Phase 11 — Module authentication — use cases

### Tâche 47 : VerifyApiKeyHandler (query)

**Files:**

- Create: `src/authentication/queries/verify-api-key/verify-api-key.handler.ts`
- Create: `src/authentication/queries/verify-api-key/verify-api-key.handler.test.ts`

- [ ] **Step 1: Tests `withTestTransaction`** :

  - Token inconnu → `null`
  - Token connu et actif → retourne l'`ApiKey`
  - Token connu mais révoqué → `null`

- [ ] **Step 2: Implémentation**

```ts
// src/authentication/queries/verify-api-key/verify-api-key.handler.ts
import { type ResultAsync } from "@/framework/result";
import { type RepositoryError } from "@/framework/errors/common-errors";
import { type Inject } from "@/authentication/authentication.module";
import { type ApiKey } from "@/authentication/model/api-key";

export class VerifyApiKeyHandler {
  constructor(
    private readonly deps: Inject<"apiKeyHasher" | "apiKeyRepository">
  ) {}

  execute(rawToken: string): ResultAsync<ApiKey | null, RepositoryError> {
    const keyHash = this.deps.apiKeyHasher.hash(rawToken);
    return this.deps.apiKeyRepository
      .findByKeyHash(keyHash)
      .map((apiKey) => (apiKey?.active ? apiKey : null));
  }
}
```

- [ ] **Step 3: Commit** — `feature: authentication query — VerifyApiKeyHandler avec railway oriented`

---

### Tâche 48 : VerifyJwtHandler (query)

**Files:**

- Create: `src/authentication/queries/verify-jwt/verify-jwt.handler.ts`
- Create: `src/authentication/queries/verify-jwt/verify-jwt.handler.test.ts`

- [ ] **Step 1: Tests** :

  - JWT signé manuellement avec `JWT_SECRET` + utilisateur en DB → retourne l'`Utilisateur`
  - JWT altéré → `JwtVerificationError`
  - JWT valide mais utilisateur supprimé → `null` (ou erreur typée)
  - JWT avec `tokenVersion` obsolète → `null`

- [ ] **Step 2: Implémentation railway**

```ts
// src/authentication/queries/verify-jwt/verify-jwt.handler.ts
import { type ResultAsync, errAsync } from "@/framework/result";
import { type Inject } from "@/authentication/authentication.module";
import { type Utilisateur } from "@/authentication/model/utilisateur";
import { utilisateurId } from "@/authentication/model/utilisateur-id";
import { JwtVerificationError } from "@/authentication/ports/token-signer";

export type VerifyJwtError = JwtVerificationError | RepositoryError;

export class VerifyJwtHandler {
  constructor(
    private readonly deps: Inject<"tokenSigner" | "utilisateurRepository">
  ) {}

  execute(rawJwt: string): ResultAsync<Utilisateur | null, VerifyJwtError> {
    return this.deps.tokenSigner.verify(rawJwt).andThen((payload) => {
      const idResult = utilisateurId(payload.utilisateurId);
      if (idResult.isErr())
        return errAsync(new JwtVerificationError("invalid utilisateurId"));
      return this.deps.utilisateurRepository
        .findById(idResult.value)
        .map((utilisateur) => {
          if (!utilisateur) return null;
          if (utilisateur.tokenVersion !== payload.tokenVersion) return null;
          return utilisateur;
        });
    });
  }
}
```

- [ ] **Step 3: Commit** — `feature: authentication query — VerifyJwtHandler railway`

---

### Tâche 49 : CreateSessionHandler (command, scaffolding)

**Files:**

- Create: `src/authentication/commands/create-session/create-session.command.ts`
- Create: `src/authentication/commands/create-session/create-session.handler.ts`
- Create: `src/authentication/commands/create-session/create-session.handler.test.ts`

- [ ] **Step 1: Tests** :

  - `idToken` vide → `MissingIdTokenError`
  - `idToken` non vide → `NotImplementedError` (kind `not-implemented`)

- [ ] **Step 2: Implémentation**

```ts
// src/authentication/commands/create-session/create-session.command.ts
export type CreateSessionCommand = { readonly idToken: string };
```

```ts
// src/authentication/commands/create-session/create-session.handler.ts
import { type ResultAsync, errAsync } from "@/framework/result";
import { NotImplementedError } from "@/framework/errors/common-errors";
import { type Inject } from "@/authentication/authentication.module";
import { MissingIdTokenError } from "@/authentication/model/errors";
import { type CreateSessionCommand } from "./create-session.command";

export type Session = {
  readonly jwt: string;
  readonly utilisateur: {
    id: string;
    email: string;
    nomComplet: string;
    statutAcces: string;
    roles: ReadonlyArray<string>;
  };
};

export type CreateSessionError = MissingIdTokenError | NotImplementedError;

export class CreateSessionHandler {
  constructor(
    private readonly deps: Inject<
      | "utilisateurRepository"
      | "tokenSigner"
      | "transaction"
      | "logger"
      | "clock"
    >
  ) {}

  execute(
    command: CreateSessionCommand
  ): ResultAsync<Session, CreateSessionError> {
    if (!command.idToken)
      return errAsync(new MissingIdTokenError("idToken is required"));
    return errAsync(
      new NotImplementedError("ProConnect — voir ticket suivant")
    );
  }
}
```

- [ ] **Step 3: Commit** — `feature: authentication command — CreateSessionHandler stub avec NotImplementedError`

---

## Phase 12 — Module authentication — public + module

### Tâche 50 : ApiModels publics (UtilisateurApiModel, ApiKeyApiModel, SessionApiModel)

**Files:**

- Create: `src/authentication/public/utilisateur.api-model.ts`
- Create: `src/authentication/public/api-key.api-model.ts`
- Create: `src/authentication/public/session.api-model.ts`

- [ ] **Step 1: Implémentation**

```ts
// src/authentication/public/utilisateur.api-model.ts
import { z } from "@hono/zod-openapi";

export const UtilisateurApiModelSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    nomComplet: z.string(),
    statutAcces: z.enum(["EN_ATTENTE_ACCES", "ACTIF", "REFUSE", "DESACTIVE"]),
    roles: z.array(z.string()),
  })
  .openapi("UtilisateurApiModel");

export type UtilisateurApiModel = z.infer<typeof UtilisateurApiModelSchema>;

// src/authentication/public/api-key.api-model.ts
export const ApiKeyApiModelSchema = z
  .object({
    id: z.string().uuid(),
    nom: z.string(),
    scopes: z.array(z.string()),
  })
  .openapi("ApiKeyApiModel");
export type ApiKeyApiModel = z.infer<typeof ApiKeyApiModelSchema>;

// src/authentication/public/session.api-model.ts
export const SessionApiModelSchema = z
  .object({
    jwt: z.string(),
    utilisateur: UtilisateurApiModelSchema,
  })
  .openapi("SessionApiModel");
export type SessionApiModel = z.infer<typeof SessionApiModelSchema>;
```

- [ ] **Step 2: Commit** — `feature: authentication public — ApiModels (utilisateur, api-key, session)`

---

### Tâche 51 : AuthenticationFacade interface + impl

**Files:**

- Create: `src/authentication/public/authentication.facade.ts`
- Create: `src/authentication/infrastructure/facades/authentication.facade.impl.ts`

- [ ] **Step 1: Interface**

```ts
// src/authentication/public/authentication.facade.ts
import { type ResultAsync } from "@/framework/result";
import { type AppError } from "@/framework/errors/app-error";
import { type ApiKeyApiModel } from "./api-key.api-model";
import { type UtilisateurApiModel } from "./utilisateur.api-model";

export interface AuthenticationFacade {
  verifyApiKey(rawToken: string): ResultAsync<ApiKeyApiModel | null, AppError>;
  verifyJwt(rawJwt: string): ResultAsync<UtilisateurApiModel | null, AppError>;
  getUtilisateurParId(
    utilisateurId: string
  ): ResultAsync<UtilisateurApiModel | null, AppError>;
}
```

- [ ] **Step 2: Implémentation**

```ts
// src/authentication/infrastructure/facades/authentication.facade.impl.ts
import { type ResultAsync, okAsync, errAsync } from "@/framework/result";
import { type AppError } from "@/framework/errors/app-error";
import { type Inject } from "@/authentication/authentication.module";
import { type AuthenticationFacade } from "@/authentication/public/authentication.facade";
import { utilisateurId } from "@/authentication/model/utilisateur-id";
import { apiKeyToApiModel } from "./api-key-to-api-model";
import { utilisateurToApiModel } from "./utilisateur-to-api-model";

export class AuthenticationFacadeImpl implements AuthenticationFacade {
  constructor(
    private readonly deps: Inject<
      "verifyApiKeyHandler" | "verifyJwtHandler" | "utilisateurRepository"
    >
  ) {}

  verifyApiKey(rawToken: string) {
    return this.deps.verifyApiKeyHandler
      .execute(rawToken)
      .map((apiKey) => (apiKey ? apiKeyToApiModel(apiKey) : null));
  }

  verifyJwt(rawJwt: string) {
    return this.deps.verifyJwtHandler
      .execuexecuteter(rawJwt)
      .map((utilisateur) =>
        utilisateur ? utilisateurToApiModel(utilisateur) : null
      );
  }

  getUtilisateurParId(rawId: string) {
    const idResult = utilisateurId(rawId);
    if (idResult.isErr()) return okAsync(null);
    return this.deps.utilisateurRepository
      .findById(idResult.value)
      .map((utilisateur) =>
        utilisateur ? utilisateurToApiModel(utilisateur) : null
      );
  }
}
```

- [ ] **Step 3: Mappers `apiKeyToApiModel` et `utilisateurToApiModel`** dans `src/authentication/infrastructure/facades/`
- [ ] **Step 4: Commit** — `feature: authentication public — AuthenticationFacade interface + impl`

---

### Tâche 52 : authentication.module.ts + branchement

**Files:**

- Create: `src/authentication/authentication.module.ts`
- Modify: `src/framework/container/build-app-container.ts`
- Modify: `src/framework/module-system/module-names.ts`

- [ ] **Step 1: Module**

```ts
// src/authentication/authentication.module.ts
import { defineModule } from "@/framework/module-system/define-module";
import type {
  VerifyCradle,
  ExtractScope,
} from "@/framework/module-system/types";
import { Sha256ApiKeyHasher } from "./infrastructure/crypto/sha256-api-key-hasher";
import { CryptoTokenGenerator } from "./infrastructure/crypto/crypto-token-generator";
import { JsonwebtokenTokenSigner } from "./infrastructure/crypto/jsonwebtoken-token-signer";
import { ApiKeyPrismaRepository } from "./infrastructure/persistence/api-key.prisma-repository";
import { UtilisateurPrismaRepository } from "./infrastructure/persistence/utilisateur.prisma-repository";
import { VerifyApiKeyHandler } from "./queries/verify-api-key/verify-api-key.handler";
import { VerifyJwtHandler } from "./queries/verify-jwt/verify-jwt.handler";
import { CreateSessionHandler } from "./commands/create-session/create-session.handler";
import { AuthenticationFacadeImpl } from "./infrastructure/facades/authentication.facade.impl";
import type { ApiKeyHasher } from "./ports/api-key-hasher";
import type { TokenGenerator } from "./ports/token-generator";
import type { TokenSigner } from "./ports/token-signer";
import type { ApiKeyRepository } from "./ports/api-key.repository";
import type { UtilisateurRepository } from "./ports/utilisateur.repository";
import type { AuthenticationFacade } from "./public/authentication.facade";

type AuthenticationCradle = {
  apiKeyHasher: ApiKeyHasher;
  tokenGenerator: TokenGenerator;
  tokenSigner: TokenSigner;
  apiKeyRepository: ApiKeyRepository;
  utilisateurRepository: UtilisateurRepository;
  verifyApiKeyHandler: VerifyApiKeyHandler;
  verifyJwtHandler: VerifyJwtHandler;
  createSessionHandler: CreateSessionHandler;
  authenticationFacade: AuthenticationFacade;
};

type AuthenticationExports = { authenticationFacade: AuthenticationFacade };

export const authenticationModule = defineModule<
  AuthenticationExports,
  AuthenticationCradle
>()({
  name: "authentication",
  imports: ["framework"],
  exports: ["authenticationFacade"],
  register: (container, { asModuleClass }) => {
    container.register({
      apiKeyHasher: asModuleClass(Sha256ApiKeyHasher).singleton(),
      tokenGenerator: asModuleClass(CryptoTokenGenerator).singleton(),
      tokenSigner: asModuleClass(JsonwebtokenTokenSigner).singleton(),
      apiKeyRepository: asModuleClass(ApiKeyPrismaRepository).singleton(),
      utilisateurRepository: asModuleClass(
        UtilisateurPrismaRepository
      ).singleton(),
      verifyApiKeyHandler: asModuleClass(VerifyApiKeyHandler).singleton(),
      verifyJwtHandler: asModuleClass(VerifyJwtHandler).singleton(),
      createSessionHandler: asModuleClass(CreateSessionHandler).singleton(),
      authenticationFacade: asModuleClass(AuthenticationFacadeImpl).singleton(),
    } satisfies VerifyCradle<AuthenticationCradle>);
  },
});

type Scope = ExtractScope<typeof authenticationModule>;
export type Inject<K extends keyof Scope> = Pick<Scope, K>;
```

- [ ] **Step 2: Brancher dans `build-app-container.ts`** + ajouter `'authentication'` aux `module-names.ts`
- [ ] **Step 3: Test E2E** — `buildAppContainer()` résout `authenticationFacade` depuis le scope `framework` après bootstrap (résolution eager des exports)
- [ ] **Step 4: Commit** — `feature: authentication — module + branchement bootstrap`

---

## Phase 13 — Module authentication — HTTP + CLI

### Tâche 53 : Route POST /auth/sessions

**Files:** Create: `src/authentication/infrastructure/http/routes/create-session.route.ts`

- [ ] **Step 1: Implémentation** (cf. design 8.3 — retourne 501 via `respondWithResult`)
- [ ] **Step 2: Commit** — `feature: authentication http — route POST /auth/sessions retourne 501`

---

### Tâche 54 : Brancher le middleware auth + auth-context dans buildApp

**Files:** Modify: `src/framework/http/app.ts`

- [ ] **Step 1: Ajouter `authMiddleware` après `authContextMiddleware`**

```ts
app.use(
  "*",
  authMiddleware({
    authenticationFacade: container.resolve("authenticationFacade"),
  })
);
```

- [ ] **Step 2: Tests E2E** :

  - `GET /health` sans Bearer → 200 (route publique)
  - `POST /auth/sessions` sans Bearer → 401
  - `POST /auth/sessions` avec API key valide → 501
  - `POST /auth/sessions` avec API key révoquée → 401
  - `POST /auth/sessions` avec JWT manuellement signé → 501

- [ ] **Step 3: Commit** — `feature: framework — brancher auth + auth-context middlewares dans buildApp`

---

### Tâche 55 : CLI create-api-key

**Files:** Create: `src/authentication/infrastructure/scripts/create-api-key.ts`

- [ ] **Step 1: Implémentation**

```ts
// src/authentication/infrastructure/scripts/create-api-key.ts
import { buildAppContainer } from "@/framework/container/build-app-container";
import { createApiKey } from "@/authentication/model/api-key";
import { scope as parseScope } from "@/authentication/model/scope";
import type { ApiKeyHasher } from "@/authentication/ports/api-key-hasher";
import type { TokenGenerator } from "@/authentication/ports/token-generator";
import type { ApiKeyRepository } from "@/authentication/ports/api-key.repository";
import type { Clock } from "@/framework/clock/clock";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { getContainer } = buildAppContainer();

  const authContainer = getContainer("authentication");
  const frameworkContainer = getContainer("framework");

  const hasher = authContainer.resolve<ApiKeyHasher>("apiKeyHasher");
  const tokenGenerator =
    authContainer.resolve<TokenGenerator>("tokenGenerator");
  const repository =
    authContainer.resolve<ApiKeyRepository>("apiKeyRepository");
  const clock = frameworkContainer.resolve<Clock>("clock");

  const scopes = args.scopes.split(",").map((raw) => {
    const result = parseScope(raw.trim());
    if (result.isErr()) {
      console.error(`Invalid scope: ${raw}`);
      process.exit(1);
    }
    return result.value;
  });

  const result = createApiKey({
    nom: args.nom,
    scopes,
    environment: args.env,
    hasher,
    tokenGenerator,
    clock,
  });
  if (result.isErr()) {
    console.error(`Failed to create API key: ${result.error.message}`);
    process.exit(1);
  }

  const saveResult = await repository.save(result.value.apiKey);
  if (saveResult.isErr()) {
    console.error(`Failed to persist API key: ${saveResult.error.message}`);
    process.exit(1);
  }

  console.log(
    "--- API KEY CREATED — SAVE THIS, IT WILL NOT BE SHOWN AGAIN ---"
  );
  console.log(`Token: ${result.value.rawToken}`);
  console.log(`Id:    ${result.value.apiKey.id}`);
  console.log(`Nom:   ${result.value.apiKey.nom}`);
  console.log(`Env:   ${args.env}`);
  console.log(`Scopes: ${scopes.join(", ")}`);
}

function parseArgs(argv: ReadonlyArray<string>) {
  /* parse --nom --env --scopes */
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Test manuel** — `pnpm -F @pilote/mb-api create-api-key --nom test --env test --scopes entities:read`
- [ ] **Step 3: Commit** — `feature: authentication infra — CLI create-api-key`

---

### Tâche 56 : Test E2E auth API key

**Files:** Create: `src/test/e2e/auth-api-key.test.ts`

- [ ] **Step 1: Test** — créer une API key via fixture, faire `app.request('/auth/sessions', { headers: { Authorization: 'Bearer pmb_test_xxx' } })`, vérifier 501 (token reconnu, route appelée). Tester aussi rejet 401 si token inconnu/révoqué.
- [ ] **Step 2: Commit** — `test: e2e auth flow API key`

---

## Phase 14 — Bootstrap + assemblage final

### Tâche 57 : index.ts (entrypoint serveur)

**Files:** Create: `src/index.ts`

- [ ] **Step 1: Implémentation**

```ts
// src/index.ts
import { serve } from "@hono/node-server";
import { config } from "@/config";
import { buildAppContainer } from "@/framework/container/build-app-container";
import { buildApp } from "@/framework/http/app";
import { registerHealthRoute } from "@/healthcheck/infrastructure/http/routes/health.route";
import { registerCreateSessionRoute } from "@/authentication/infrastructure/http/routes/create-session.route";

const { getContainer } = buildAppContainer();
const frameworkContainer = getContainer("framework");

const app = buildApp(frameworkContainer);
registerHealthRoute(app, getContainer("healthcheck"));
registerCreateSessionRoute(app, getContainer("authentication"));

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`mb-api listening on :${info.port}`);
});
```

- [ ] **Step 2: Commit** — `feature: bootstrap — index.ts entrypoint serveur`

---

### Tâche 58 : Vérifier lancement local

- [ ] **Step 1: Démarrer la DB locale** — `docker compose up -d postgres`
- [ ] **Step 2: Migrer** — `pnpm prisma migrate dev`
- [ ] **Step 3: Lancer le serveur** — `pnpm dev`
- [ ] **Step 4: Smoke tests manuels** :
  - `curl localhost:3000/health` → 200
  - `curl localhost:3000/api/openapi.json` → 200
  - `curl localhost:3000/api/docs` → 200
  - `curl -X POST localhost:3000/auth/sessions -H 'Authorization: Bearer pmb_test_xxx' -d '{}'` → 401 (token inconnu)
  - Créer une API key via CLI puis re-tester avec → 501

---

### Tâche 59 : Vérifier suite tests complète

- [ ] **Step 1: Postgres test up** — `docker compose up -d postgres_test`
- [ ] **Step 2: Migrer** — `DATABASE_URL=...test pnpm prisma migrate deploy`
- [ ] **Step 3: Lancer** — `pnpm test`
- [ ] **Step 4: Vérifier** que tous les tests passent en parallèle, pas de timeout, pas de fuite de connexion

---

### Tâche 60 : Vérifier lint + dependency-cruiser

- [ ] **Step 1: `pnpm lint`** — eslint + tsc + depcruise
- [ ] **Step 2: Vérifier** que les règles bloquent bien :
  - Import direct de `@/authentication/model/api-key` depuis `healthcheck/` → erreur
  - `new Date()` dans `model/` → erreur ESLint
  - `export default` → erreur ESLint
- [ ] **Step 3: Commit** d'éventuels fix

---

## Phase 15 — Documentation + CI

### Tâche 61 : CLAUDE.md de mb-api

**Files:** Create: `apps/mb-api/CLAUDE.md`

- [ ] **Step 1: Contenu** — résumé de l'arch (modules, functional core, ports & adapters, ApiModels, ResultAsync, AuthContext), conventions code, pyramide tests, commandes essentielles
- [ ] **Step 2: Commit** — `docs: CLAUDE.md de mb-api`

---

### Tâche 62 : ADR 0001 (record-architecture-decisions)

**Files:** Create: `apps/mb-api/docs/architecture/decisions/0001-record-architecture-decisions.md`

- [ ] **Step 1: Recopier** la structure standard (cf. `apps/pilote-ppg/docs/architecture/decisions/0001-...`)
- [ ] **Step 2: Commit** — `docs: ADR 0001 record architecture decisions`

---

### Tâche 63 : ADR 0002 (architecture init mb-api)

**Files:** Create: `apps/mb-api/docs/architecture/decisions/0002-architecture-init-mb-api.md`

- [ ] **Step 1: Contenu** :
  - **Statut** : Accepté
  - **Contexte** : décrire pourquoi on initialise mb-api, la posture Marque Blanche
  - **Décision** : poser CQS lite + functional core / imperative shell + modules Awilix + ports & adapters côté écriture + ApiModels + AuthContext via ALS + ResultAsync. Justifier explicitement le **non-choix de DDD by the book** (scope produit non stabilisé, TS full-stack, équipe unique).
  - **Conséquences** : modèles immuables sérialisables, tests purs sur le functional core, bascule possible vers DDD plus tactique si invariants émergent, refactor si on doit séparer command/query facade
- [ ] **Step 2: Commit** — `docs: ADR 0002 architecture init mb-api`

---

### Tâche 64 : Workflow CI

**Files:** Modify: `.github/workflows/testAndLint.yml`

- [ ] **Step 1: Ajouter** le filter `mb-api` (cf. design 12.2)
- [ ] **Step 2: Ajouter** les jobs `test-mb-core` et `lint-mb-core`
- [ ] **Step 3: Commit** — `ci: ajouter jobs test-mb-core et lint-mb-core`
- [ ] **Step 4: Push + observer le run CI**
- [ ] **Step 5: (Manuel)** Configurer `test-mb-core` et `lint-mb-core` comme **required status checks** sur la branche `dev`

---

## Critères de validation finale

- ✅ `pnpm dev` démarre sans erreur, log pretty
- ✅ `curl /health` → 200
- ✅ `curl /api/openapi.json` → contenu OpenAPI 3.1 valide
- ✅ `/api/docs` affiche Swagger UI
- ✅ `POST /auth/sessions` → 501 avec body `{ code: 'NOT_IMPLEMENTED', ... }`
- ✅ Route protégée sans Bearer → 401
- ✅ Route protégée avec API key valide → status attendu (200 ou 501 selon route)
- ✅ Route inexistante → 404 `{ code: 'ROUTE_NOT_FOUND', ... }`
- ✅ `pnpm test` passe en parallèle
- ✅ Tests `model/*.test.ts` passent **sans container ni DB**
- ✅ Tests `commands/`, `queries/`, `repositories/` passent dans `withTestTransaction`
- ✅ `pnpm lint` passe (eslint + tsc + depcruise)
- ✅ Import cross-module hors `public/` → bloqué par depcruise
- ✅ `new Date()` dans `model/`, `commands/`, `queries/` → bloqué par ESLint
- ✅ CI verte sur la PR
- ✅ ADR 0002 explique la posture architecturale
- ✅ CLAUDE.md à jour
