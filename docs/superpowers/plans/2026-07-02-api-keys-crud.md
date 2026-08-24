# CRUD clés API (mb-api) + IHM d'administration (mb-admin) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exposer un CRUD (créer / lister / révoquer) des clés API côté mb-api, réservé aux clés API de rôle ADMIN, et une IHM d'administration dans mb-admin.

**Architecture:** Nouvelle feature `src/apiKey/` dans mb-api (routes OpenAPIHono + commands/queries appelant Prisma via `db()`), gardée par des primitives d'autorisation composables (`principalPredicates` + `ensurePrincipal`). Schémas partagés dans `@pilote/mb-shared`. Côté mb-admin, feature `_authed/api-keys/` (SPA Vite + TanStack Query) qui consomme le BFF Hono (proxy allowlisté) relayant vers mb-api avec la clé de session.

**Tech Stack:** TypeScript, Hono + `@hono/zod-openapi`, Prisma (adapter PrismaPg), neverthrow, zod v4, vitest ; mb-admin : Vite, TanStack Router/Query, ky, Tailwind v4.

## Global Constraints

- Package manager : **pnpm** (jamais npm). Filtres : `@pilote/mb-api`, `@pilote/mb-admin`, `@pilote/mb-shared`.
- Commits : **pas** de `Co-Authored-By`. Lancer le lint de l'app concernée **avant** chaque commit.
- Nommage : verbes/tech en anglais, entités en français si applicable. Ici la ressource est technique → anglais (`apiKey`, `/api-keys`).
- Autorisation des routes de gestion des clés : **clé API de rôle ADMIN uniquement** (OIDC et CONTRIBUTOR rejetés en 403).
- Clé en clair (`rawKey`) exposée **une seule fois** à la création (stockage HMAC-only).
- Révocation = **soft-delete** (`revokedAt`), jamais de hard delete.
- Tailwind : utiliser les tokens du thème (`text-primary`, `text-accent`, `text-text-muted`…), **pas** de couleurs flat (`text-green-700`, etc.).
- **mb-api ESLint** : `new Date()` (tout `new Date(...)`) est **interdit** dans `src/**/{model,commands,queries}/**` (règle `no-restricted-syntax`, message « Inject Clock instead »). Conséquences : convertir/lire l'horloge hors de ces chemins. Helpers dans `src/framework/date.ts` (chemin autorisé) : `parseIsoDate(iso)` (ISO→Date) et `now()` (horloge centralisée). Les fichiers `*.test.ts` sous `commands/queries` sont aussi soumis à la règle → utiliser `parseIsoDate('YYYY-MM-DD')` au lieu de `new Date('YYYY-MM-DD')` pour les fixtures.
- Tests front mb-admin : **aucun** (convention projet). Vérification front = `lint` (inclut `tsr generate` + `tsc`).
- Les tests d'intégration mb-api (commands/queries/routes) nécessitent la **base de test lancée** (cf. `apps/mb-api/.env.test`). Suite complète : `pnpm --filter @pilote/mb-api test`.

---

## File Structure

**mb-api**
- Create `apps/mb-api/src/framework/auth/principalPredicates.ts` — prédicats purs sur `Principal`.
- Create `apps/mb-api/src/framework/auth/ensurePrincipal.ts` — guard générique à partir d'un prédicat.
- Delete `apps/mb-api/src/framework/auth/ensureApiKeyAdmin.ts` (+ `.test.ts`).
- Modify `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts` — migre vers `ensurePrincipal`.
- Modify `apps/mb-api/src/referentiel/commands/upsertReferentiel.ts` — migre vers `ensurePrincipal`.
- Create `apps/mb-api/src/apiKey/utils.ts` — mapper DB → API + calcul du statut.
- Create `apps/mb-api/src/apiKey/commands/createApiKey.ts`.
- Create `apps/mb-api/src/apiKey/commands/revokeApiKey.ts`.
- Create `apps/mb-api/src/apiKey/queries/listApiKeys.ts`.
- Create `apps/mb-api/src/apiKey/routes.ts`.
- Modify `apps/mb-api/src/app.ts` — enregistre `apiKeyRoutes`.

**mb-shared**
- Create `packages/mb-shared/src/apiKey.ts` — schémas zod partagés.
- Modify `packages/mb-shared/package.json` — export `./apiKey`.

**mb-admin**
- Modify `apps/mb-admin/src/server/api/router.ts` — étend `SAFE_PATH`.
- Create `apps/mb-admin/src/api/apiKeys.ts` — fetchers BFF.
- Create `apps/mb-admin/src/queries/apiKeys.ts` — query options.
- Create `apps/mb-admin/src/components/ApiKeyForm.tsx`.
- Create `apps/mb-admin/src/components/CreatedApiKeyResult.tsx`.
- Create `apps/mb-admin/src/routes/_authed/api-keys/index.tsx`.
- Create `apps/mb-admin/src/routes/_authed/api-keys/nouveau.tsx`.
- Modify `apps/mb-admin/src/routes/_authed/fonctionnalites.tsx` — ajoute une `BarCard`.

---

## Task 1 : Primitives d'autorisation + migration des call sites

**Files:**
- Create: `apps/mb-api/src/framework/auth/principalPredicates.ts`
- Test: `apps/mb-api/src/framework/auth/principalPredicates.test.ts`
- Create: `apps/mb-api/src/framework/auth/ensurePrincipal.ts`
- Test: `apps/mb-api/src/framework/auth/ensurePrincipal.test.ts`
- Modify: `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts`
- Modify: `apps/mb-api/src/referentiel/commands/upsertReferentiel.ts`
- Delete: `apps/mb-api/src/framework/auth/ensureApiKeyAdmin.ts`, `apps/mb-api/src/framework/auth/ensureApiKeyAdmin.test.ts`

**Interfaces:**
- Produces:
  - `isOidcUser(p: Principal): boolean`
  - `isApiKey(p: Principal): boolean`
  - `isApiKeyAdmin(p: Principal): boolean`
  - `isApiKeyContributor(p: Principal): boolean`
  - `ensurePrincipal(predicate: (p: Principal) => boolean, message: string): void`
- Consumes: `Principal`, `requirePrincipal` (`@/framework/auth/userContext`) ; `ForbiddenError` (`@/framework/errors/AppError`) ; `ApiKeyRole` (`@/generated/prisma/enums`).

- [ ] **Step 1 : Écrire le test des prédicats (échoue)**

Create `apps/mb-api/src/framework/auth/principalPredicates.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import {
  isApiKey,
  isApiKeyAdmin,
  isApiKeyContributor,
  isOidcUser,
} from '@/framework/auth/principalPredicates'
import { type Principal } from '@/framework/auth/userContext'
import { ApiKeyRole } from '@/generated/prisma/enums'

const adminKey: Principal = {
  kind: 'apiKey',
  apiKey: { id: 'a', label: 'k', role: ApiKeyRole.ADMIN },
}
const contributorKey: Principal = {
  kind: 'apiKey',
  apiKey: { id: 'a', label: 'k', role: ApiKeyRole.CONTRIBUTOR },
}
const user: Principal = {
  kind: 'user',
  user: { id: 'u', email: 'e@e.fr', prenom: 'p', nom: 'n' },
}

describe('principalPredicates', () => {
  it('isOidcUser', () => {
    expect(isOidcUser(user)).toBe(true)
    expect(isOidcUser(adminKey)).toBe(false)
  })
  it('isApiKey', () => {
    expect(isApiKey(adminKey)).toBe(true)
    expect(isApiKey(user)).toBe(false)
  })
  it('isApiKeyAdmin', () => {
    expect(isApiKeyAdmin(adminKey)).toBe(true)
    expect(isApiKeyAdmin(contributorKey)).toBe(false)
    expect(isApiKeyAdmin(user)).toBe(false)
  })
  it('isApiKeyContributor', () => {
    expect(isApiKeyContributor(contributorKey)).toBe(true)
    expect(isApiKeyContributor(adminKey)).toBe(false)
    expect(isApiKeyContributor(user)).toBe(false)
  })
})
```

- [ ] **Step 2 : Lancer le test → échoue (module absent)**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/framework/auth/principalPredicates.test.ts`
Expected: FAIL (`Cannot find module '@/framework/auth/principalPredicates'`).

- [ ] **Step 3 : Créer les prédicats**

Create `apps/mb-api/src/framework/auth/principalPredicates.ts` :

```ts
import { type Principal } from '@/framework/auth/userContext'
import { ApiKeyRole } from '@/generated/prisma/enums'

export const isOidcUser = (principal: Principal): boolean => principal.kind === 'user'

export const isApiKey = (principal: Principal): boolean => principal.kind === 'apiKey'

export const isApiKeyAdmin = (principal: Principal): boolean =>
  principal.kind === 'apiKey' && principal.apiKey.role === ApiKeyRole.ADMIN

export const isApiKeyContributor = (principal: Principal): boolean =>
  principal.kind === 'apiKey' && principal.apiKey.role === ApiKeyRole.CONTRIBUTOR
```

- [ ] **Step 4 : Lancer le test → passe**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/framework/auth/principalPredicates.test.ts`
Expected: PASS.

- [ ] **Step 5 : Écrire le test de `ensurePrincipal` (échoue)**

Create `apps/mb-api/src/framework/auth/ensurePrincipal.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { ensurePrincipal } from '@/framework/auth/ensurePrincipal'
import { isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import { type Principal } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

const ID = '00000000-0000-0000-0000-000000000001'

describe('ensurePrincipal', () => {
  it('laisse passer quand le prédicat est vrai (clé ADMIN)', () => {
    expect(() => runAsAdmin(ID, () => ensurePrincipal(isApiKeyAdmin, 'nope'))).not.toThrow()
  })

  it('rejette (ForbiddenError) une clé CONTRIBUTOR sur un prédicat strict ADMIN', () => {
    expect(() => runAsContributor(ID, () => ensurePrincipal(isApiKeyAdmin, 'nope'))).toThrow(
      ForbiddenError,
    )
  })

  it('rejette (ForbiddenError) un utilisateur OIDC sur un prédicat strict ADMIN', () => {
    expect(() => runAsUser(ID, () => ensurePrincipal(isApiKeyAdmin, 'nope'))).toThrow(ForbiddenError)
  })

  it('supporte la composition OU (clé ADMIN ou utilisateur OIDC)', () => {
    const predicate = (p: Principal) => isApiKeyAdmin(p) || isOidcUser(p)
    expect(() => runAsUser(ID, () => ensurePrincipal(predicate, 'nope'))).not.toThrow()
    expect(() => runAsAdmin(ID, () => ensurePrincipal(predicate, 'nope'))).not.toThrow()
    expect(() => runAsContributor(ID, () => ensurePrincipal(predicate, 'nope'))).toThrow(
      ForbiddenError,
    )
  })

  it('lève UnauthorizedError sans principal', () => {
    expect(() => ensurePrincipal(isApiKeyAdmin, 'nope')).toThrow(UnauthorizedError)
  })
})
```

- [ ] **Step 6 : Lancer le test → échoue (module absent)**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/framework/auth/ensurePrincipal.test.ts`
Expected: FAIL (`Cannot find module '@/framework/auth/ensurePrincipal'`).

- [ ] **Step 7 : Créer `ensurePrincipal`**

Create `apps/mb-api/src/framework/auth/ensurePrincipal.ts` :

```ts
import { requirePrincipal, type Principal } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'

// Transforme un prédicat sur le principal courant en garde d'autorisation.
// Lève UnauthorizedError si aucun principal, ForbiddenError si le prédicat est faux.
export const ensurePrincipal = (
  predicate: (principal: Principal) => boolean,
  message: string,
): void => {
  const principal = requirePrincipal()
  if (!predicate(principal)) throw new ForbiddenError(message)
}
```

- [ ] **Step 8 : Lancer le test → passe**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/framework/auth/ensurePrincipal.test.ts`
Expected: PASS.

- [ ] **Step 9 : Migrer `upsertReferentiel.ts`**

In `apps/mb-api/src/referentiel/commands/upsertReferentiel.ts`, replace the import (ligne 5) :

```ts
import { ensureApiKeyAdmin } from '@/framework/auth/ensureApiKeyAdmin'
```

with :

```ts
import { ensurePrincipal } from '@/framework/auth/ensurePrincipal'
import { isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
```

and replace the call (ligne 33) :

```ts
  ensureApiKeyAdmin()
```

with :

```ts
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un rôle ADMIN',
  )
```

- [ ] **Step 10 : Migrer `upsertIndicateur.ts`**

In `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts`, replace the import (ligne 8) :

```ts
import { ensureApiKeyAdmin } from '@/framework/auth/ensureApiKeyAdmin'
```

with :

```ts
import { ensurePrincipal } from '@/framework/auth/ensurePrincipal'
import { isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
```

and replace the call (ligne 184) :

```ts
  ensureApiKeyAdmin()
```

with :

```ts
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un rôle ADMIN',
  )
```

- [ ] **Step 11 : Supprimer l'ancien guard**

```bash
rm apps/mb-api/src/framework/auth/ensureApiKeyAdmin.ts apps/mb-api/src/framework/auth/ensureApiKeyAdmin.test.ts
```

Note : les tests de comportement de `upsertReferentiel.test.ts` (CONTRIBUTOR→403, ADMIN→ok, OIDC user→ok) restent valides sans modification — la règle laxiste est préservée.

- [ ] **Step 12 : Vérifier la non-régression + lint**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/referentiel src/indicateur src/framework/auth`
Expected: PASS.
Run: `pnpm --filter @pilote/mb-api lint`
Expected: 0 erreur (lance `lint:fix` si l'ordre des imports doit être corrigé : `pnpm --filter @pilote/mb-api lint:fix`).

- [ ] **Step 13 : Commit**

```bash
git add apps/mb-api/src/framework/auth apps/mb-api/src/referentiel/commands/upsertReferentiel.ts apps/mb-api/src/indicateur/commands/upsertIndicateur.ts
git commit -m "refactor(mb-api): primitives d'autorisation composables (principalPredicates + ensurePrincipal)"
```

---

## Task 2 : Schémas partagés `@pilote/mb-shared/apiKey`

**Files:**
- Create: `packages/mb-shared/src/apiKey.ts`
- Modify: `packages/mb-shared/package.json`

**Interfaces:**
- Produces (types) : `ApiKeyRoleValue`, `ApiKeyStatus`, `ApiKeyApiModel`, `ApiKeyListApiModel`, `CreatedApiKeyApiModel`, `CreateApiKeyBody` ; (schémas) : `apiKeyRoleSchema`, `apiKeyStatusSchema`, `apiKeyApiModelSchema`, `apiKeyListApiModelSchema`, `createdApiKeyApiModelSchema`, `createApiKeyBodySchema`.

- [ ] **Step 1 : Créer le fichier de schémas**

Create `packages/mb-shared/src/apiKey.ts` :

```ts
import { z } from 'zod'

export const apiKeyRoleSchema = z.enum(['CONTRIBUTOR', 'ADMIN'])
export type ApiKeyRoleValue = z.infer<typeof apiKeyRoleSchema>

export const apiKeyStatusSchema = z.enum(['active', 'expired', 'revoked'])
export type ApiKeyStatus = z.infer<typeof apiKeyStatusSchema>

export const apiKeyApiModelSchema = z.object({
  id: z.string().describe('Identifiant unique de la clé (UUID).'),
  label: z.string().describe('Étiquette lisible de la clé.'),
  prefix: z.string().describe("Préfixe visible de la clé (pour l'identifier)."),
  role: apiKeyRoleSchema.describe('Rôle de la clé.'),
  status: apiKeyStatusSchema.describe('Statut dérivé : active, expired ou revoked.'),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .describe("Date ISO 8601 d'expiration (null si la clé n'expire pas)."),
  revokedAt: z
    .string()
    .datetime()
    .nullable()
    .describe('Date ISO 8601 de révocation (null si la clé est active).'),
  lastUsedAt: z
    .string()
    .datetime()
    .nullable()
    .describe('Date ISO 8601 de dernière utilisation (null si jamais utilisée).'),
})
export type ApiKeyApiModel = z.infer<typeof apiKeyApiModelSchema>

export const apiKeyListApiModelSchema = z.array(apiKeyApiModelSchema)
export type ApiKeyListApiModel = z.infer<typeof apiKeyListApiModelSchema>

export const createdApiKeyApiModelSchema = apiKeyApiModelSchema.extend({
  rawKey: z
    .string()
    .describe('Clé API en clair. Affichée une seule fois, non re-affichable ensuite.'),
})
export type CreatedApiKeyApiModel = z.infer<typeof createdApiKeyApiModelSchema>

export const createApiKeyBodySchema = z.object({
  label: z.string().min(1).describe('Étiquette lisible de la clé.'),
  role: apiKeyRoleSchema.default('CONTRIBUTOR').describe('Rôle de la clé (défaut CONTRIBUTOR).'),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe("Date ISO 8601 d'expiration (optionnelle)."),
})
export type CreateApiKeyBody = z.infer<typeof createApiKeyBodySchema>
```

- [ ] **Step 2 : Exposer l'export du package**

In `packages/mb-shared/package.json`, add the `./apiKey` entry inside `exports` (juste après `"./auteur"`, pour rester ordonné) :

```json
    "./apiKey": {
      "types": "./src/apiKey.ts",
      "default": "./src/apiKey.ts"
    },
```

- [ ] **Step 3 : Vérifier le typage du package**

Run: `pnpm --filter @pilote/mb-shared exec tsc --noEmit`
Expected: 0 erreur. (Si le package n'a pas de script `tsc`, cette vérification est reprise par le lint de mb-api à la Task 6.)

- [ ] **Step 4 : Commit**

```bash
git add packages/mb-shared/src/apiKey.ts packages/mb-shared/package.json
git commit -m "feat(mb-shared): schémas partagés des clés API"
```

---

## Task 3 : Mapper + calcul du statut (`apiKey/utils.ts`)

**Files:**
- Create: `apps/mb-api/src/apiKey/utils.ts`
- Test: `apps/mb-api/src/apiKey/utils.test.ts`

**Interfaces:**
- Produces :
  - `computeApiKeyStatus(apiKey: Pick<ApiKeyModel, 'revokedAt' | 'expiresAt'>, now: Date): ApiKeyStatus`
  - `toApiKeyApiModel(apiKey: ApiKeyModel, now?: Date): ApiKeyApiModel`
- Consumes : `ApiKeyModel` (`@/generated/prisma/models`), types de `@pilote/mb-shared/apiKey`.

- [ ] **Step 1 : Écrire le test (échoue)**

Create `apps/mb-api/src/apiKey/utils.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { computeApiKeyStatus } from '@/apiKey/utils'

const base = { revokedAt: null, expiresAt: null }
const NOW = new Date('2026-07-02T00:00:00.000Z')

describe('computeApiKeyStatus', () => {
  it('active quand ni révoquée ni expirée', () => {
    expect(computeApiKeyStatus(base, NOW)).toBe('active')
  })
  it('revoked prioritaire sur expired', () => {
    expect(
      computeApiKeyStatus(
        { revokedAt: new Date('2026-01-01'), expiresAt: new Date('2000-01-01') },
        NOW,
      ),
    ).toBe('revoked')
  })
  it('expired quand expiresAt est dans le passé', () => {
    expect(computeApiKeyStatus({ revokedAt: null, expiresAt: new Date('2000-01-01') }, NOW)).toBe(
      'expired',
    )
  })
  it('active quand expiresAt est dans le futur', () => {
    expect(computeApiKeyStatus({ revokedAt: null, expiresAt: new Date('2100-01-01') }, NOW)).toBe(
      'active',
    )
  })
})
```

- [ ] **Step 2 : Lancer le test → échoue**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/apiKey/utils.test.ts`
Expected: FAIL (module absent).

- [ ] **Step 3 : Créer le mapper**

Create `apps/mb-api/src/apiKey/utils.ts` :

```ts
import { type ApiKeyApiModel, type ApiKeyStatus } from '@pilote/mb-shared/apiKey'

import { type ApiKeyModel } from '@/generated/prisma/models'

export const computeApiKeyStatus = (
  apiKey: Pick<ApiKeyModel, 'revokedAt' | 'expiresAt'>,
  now: Date,
): ApiKeyStatus => {
  if (apiKey.revokedAt) return 'revoked'
  if (apiKey.expiresAt && apiKey.expiresAt.getTime() <= now.getTime()) return 'expired'
  return 'active'
}

export const toApiKeyApiModel = (apiKey: ApiKeyModel, now: Date = new Date()): ApiKeyApiModel => ({
  id: apiKey.id,
  label: apiKey.label,
  prefix: apiKey.prefix,
  role: apiKey.role,
  status: computeApiKeyStatus(apiKey, now),
  createdAt: apiKey.createdAt.toISOString(),
  expiresAt: apiKey.expiresAt ? apiKey.expiresAt.toISOString() : null,
  revokedAt: apiKey.revokedAt ? apiKey.revokedAt.toISOString() : null,
  lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : null,
})
```

- [ ] **Step 4 : Lancer le test → passe**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/apiKey/utils.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/mb-api/src/apiKey/utils.ts apps/mb-api/src/apiKey/utils.test.ts
git commit -m "feat(mb-api): mapper et statut des clés API"
```

---

## Task 4 : Command `createApiKey`

**Files:**
- Create: `apps/mb-api/src/apiKey/commands/createApiKey.ts`
- Test: `apps/mb-api/src/apiKey/commands/createApiKey.test.ts`

**Interfaces:**
- Produces : `createApiKey(body: CreateApiKeyBody): ResultAsync<CreatedApiKeyApiModel, never>`
- Consumes : `buildApiKey` (`@/framework/auth/apiKey`), `ensurePrincipal`, `isApiKeyAdmin`, `env`, `db`, `toApiKeyApiModel`.

- [ ] **Step 1 : Écrire le test (échoue)**

Create `apps/mb-api/src/apiKey/commands/createApiKey.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { createApiKey } from '@/apiKey/commands/createApiKey'
import { env } from '@/env'
import { hashApiKey, looksLikeApiKey } from '@/framework/auth/apiKey'
import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('createApiKey', () => {
  it(
    'crée une clé et renvoie rawKey (rôle ADMIN)',
    integrationTest(async () => {
      const result = await runAsAdmin(ADMIN_ID, () =>
        createApiKey({ label: 'CI', role: 'CONTRIBUTOR', expiresAt: null }),
      )
      expect(result.isOk()).toBe(true)
      const created = result._unsafeUnwrap()
      expect(looksLikeApiKey(created.rawKey)).toBe(true)
      expect(created.label).toBe('CI')
      expect(created.role).toBe('CONTRIBUTOR')
      expect(created.status).toBe('active')

      // Persistance : seul le hash est stocké, jamais la clé en clair.
      const row = await db().apiKey.findUniqueOrThrow({ where: { id: created.id } })
      expect(row.keyHash).toBe(hashApiKey(created.rawKey, env.API_KEY_HMAC_SECRET))
      expect(row.keyHash).not.toContain(created.rawKey)
    }),
  )

  it(
    'applique le rôle ADMIN et expiresAt',
    integrationTest(async () => {
      const result = await runAsAdmin(ADMIN_ID, () =>
        createApiKey({ label: 'k', role: 'ADMIN', expiresAt: '2020-01-01T00:00:00.000Z' }),
      )
      const created = result._unsafeUnwrap()
      expect(created.role).toBe('ADMIN')
      expect(created.status).toBe('expired')
      expect(created.expiresAt).toBe('2020-01-01T00:00:00.000Z')
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      await expect(
        runAsContributor(ADMIN_ID, () =>
          createApiKey({ label: 'k', role: 'CONTRIBUTOR', expiresAt: null }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'rejette un utilisateur OIDC (ForbiddenError)',
    integrationTest(async () => {
      await expect(
        runAsUser('00000000-0000-0000-0000-0000000000f1', () =>
          createApiKey({ label: 'k', role: 'CONTRIBUTOR', expiresAt: null }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
```

- [ ] **Step 2 : Lancer le test → échoue**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/apiKey/commands/createApiKey.test.ts`
Expected: FAIL (module absent).

- [ ] **Step 3 : Créer la command**

Create `apps/mb-api/src/apiKey/commands/createApiKey.ts` :

```ts
import { type CreateApiKeyBody, type CreatedApiKeyApiModel } from '@pilote/mb-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { env } from '@/env'
import { buildApiKey } from '@/framework/auth/apiKey'
import { ensurePrincipal } from '@/framework/auth/ensurePrincipal'
import { isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performCreate = async (body: CreateApiKeyBody): Promise<CreatedApiKeyApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

  const generated = buildApiKey(env.API_KEY_HMAC_SECRET)
  await db().principal.create({ data: { id: generated.id } })
  const created = await db().apiKey.create({
    data: {
      id: generated.id,
      label: body.label,
      keyHash: generated.keyHash,
      prefix: generated.prefix,
      role: body.role,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  })

  return { ...toApiKeyApiModel(created), rawKey: generated.rawKey }
}

export const createApiKey = (body: CreateApiKeyBody): ResultAsync<CreatedApiKeyApiModel, never> =>
  ResultAsync.fromSafePromise(performCreate(body))
```

- [ ] **Step 4 : Lancer le test → passe**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/apiKey/commands/createApiKey.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/mb-api/src/apiKey/commands/createApiKey.ts apps/mb-api/src/apiKey/commands/createApiKey.test.ts
git commit -m "feat(mb-api): command createApiKey (clé ADMIN only)"
```

---

## Task 5 : Query `listApiKeys` + Command `revokeApiKey`

**Files:**
- Create: `apps/mb-api/src/apiKey/queries/listApiKeys.ts`
- Test: `apps/mb-api/src/apiKey/queries/listApiKeys.test.ts`
- Modify: `apps/mb-api/src/framework/date.ts` (ajoute `now()`)
- Create: `apps/mb-api/src/apiKey/commands/revokeApiKey.ts`
- Test: `apps/mb-api/src/apiKey/commands/revokeApiKey.test.ts`

**Interfaces:**
- Produces :
  - `listApiKeys(): ResultAsync<ApiKeyListApiModel, never>`
  - `revokeApiKey(id: string): ResultAsync<ApiKeyApiModel, never>`
- Consumes : `db`, `toApiKeyApiModel`, `ensurePrincipal`, `isApiKeyAdmin`, `requireCurrentPrincipalId` (`@/framework/auth/userContext`), `ConflictError` (`@/framework/errors/AppError`).

- [ ] **Step 1 : Écrire le test de `listApiKeys` (échoue)**

Create `apps/mb-api/src/apiKey/queries/listApiKeys.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { listApiKeys } from '@/apiKey/queries/listApiKeys'
import { parseIsoDate } from '@/framework/date'
import { ForbiddenError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-0000000000b1'

describe.concurrent('listApiKeys', () => {
  it(
    'liste les clés avec le statut dérivé et sans secret',
    integrationTest(async () => {
      const active = await fixtures.apiKey({
        label: 'active',
        rawKey: 'pilote_live_list_active_key_value_okok',
      })
      const revoked = await fixtures.apiKey({
        label: 'revoked',
        rawKey: 'pilote_live_list_revoked_key_value_ok',
        revokedAt: parseIsoDate('2024-01-01'),
      })
      const expired = await fixtures.apiKey({
        label: 'expired',
        rawKey: 'pilote_live_list_expired_key_value_ok',
        expiresAt: parseIsoDate('2000-01-01'),
      })

      const result = await runAsAdmin(ADMIN_ID, () => listApiKeys())
      const items = result._unsafeUnwrap()
      const byId = new Map(items.map((k) => [k.id, k]))

      expect(byId.get(active.id)?.status).toBe('active')
      expect(byId.get(revoked.id)?.status).toBe('revoked')
      expect(byId.get(expired.id)?.status).toBe('expired')
      expect(JSON.stringify(items)).not.toContain('keyHash')
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      await expect(runAsContributor(ADMIN_ID, () => listApiKeys())).rejects.toBeInstanceOf(
        ForbiddenError,
      )
    }),
  )
})
```

- [ ] **Step 2 : Lancer le test → échoue**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/apiKey/queries/listApiKeys.test.ts`
Expected: FAIL (module absent).

- [ ] **Step 3 : Créer la query**

Create `apps/mb-api/src/apiKey/queries/listApiKeys.ts` :

```ts
import { type ApiKeyListApiModel } from '@pilote/mb-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { ensurePrincipal } from '@/framework/auth/ensurePrincipal'
import { isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

// Garde ADMIN comme les commandes : les 3 endpoints de gestion des clés sont
// réservés aux clés API ADMIN. Pas de `new Date()` ici (interdit dans queries/) :
// `toApiKeyApiModel` lit l'horloge via son défaut interne (dans utils.ts, chemin
// autorisé) ; l'écart de quelques microsecondes entre lignes est sans effet.
const performList = async (): Promise<ApiKeyListApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const rows = await db().apiKey.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((row) => toApiKeyApiModel(row))
}

export const listApiKeys = (): ResultAsync<ApiKeyListApiModel, never> =>
  ResultAsync.fromSafePromise(performList())
```

- [ ] **Step 4 : Lancer le test → passe**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/apiKey/queries/listApiKeys.test.ts`
Expected: PASS.

- [ ] **Step 5 : Écrire le test de `revokeApiKey` (échoue)**

Create `apps/mb-api/src/apiKey/commands/revokeApiKey.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { revokeApiKey } from '@/apiKey/commands/revokeApiKey'
import { parseIsoDate } from '@/framework/date'
import { ConflictError, ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-0000000000c1'

describe.concurrent('revokeApiKey', () => {
  it(
    'révoque une clé (soft-delete)',
    integrationTest(async () => {
      const key = await fixtures.apiKey({
        label: 'to-revoke',
        rawKey: 'pilote_live_revoke_ok_key_value_okok',
      })
      const result = await runAsAdmin(ADMIN_ID, () => revokeApiKey(key.id))
      const revoked = result._unsafeUnwrap()
      expect(revoked.status).toBe('revoked')
      expect(revoked.revokedAt).not.toBeNull()

      const row = await db().apiKey.findUniqueOrThrow({ where: { id: key.id } })
      expect(row.revokedAt).not.toBeNull()
    }),
  )

  it(
    'rejette une clé déjà révoquée (ConflictError)',
    integrationTest(async () => {
      const key = await fixtures.apiKey({
        label: 'already',
        rawKey: 'pilote_live_revoke_already_value_okk',
        revokedAt: parseIsoDate('2024-01-01'),
      })
      await expect(runAsAdmin(ADMIN_ID, () => revokeApiKey(key.id))).rejects.toBeInstanceOf(
        ConflictError,
      )
    }),
  )

  it(
    'interdit de révoquer sa propre clé (ConflictError)',
    integrationTest(async () => {
      const key = await fixtures.apiKey({
        label: 'self',
        rawKey: 'pilote_live_revoke_self_value_okokok',
      })
      await expect(runAsAdmin(key.id, () => revokeApiKey(key.id))).rejects.toBeInstanceOf(
        ConflictError,
      )
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      const key = await fixtures.apiKey({
        label: 'forbidden',
        rawKey: 'pilote_live_revoke_forbidden_value_o',
      })
      await expect(runAsContributor(ADMIN_ID, () => revokeApiKey(key.id))).rejects.toBeInstanceOf(
        ForbiddenError,
      )
    }),
  )

  it(
    'rejette un id inconnu',
    integrationTest(async () => {
      await expect(
        runAsAdmin(ADMIN_ID, () => revokeApiKey('00000000-0000-0000-0000-0000000000ff')),
      ).rejects.toThrow()
    }),
  )
})
```

- [ ] **Step 6 : Lancer le test → échoue**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/apiKey/commands/revokeApiKey.test.ts`
Expected: FAIL (module absent).

- [ ] **Step 7 : Créer la command**

First, add a centralized clock helper to `apps/mb-api/src/framework/date.ts` (le fichier existe déjà depuis la Task 4 avec `parseIsoDate`). Add :

```ts
/** Horloge centralisée : lit l'heure courante hors des chemins model/commands/queries. */
export const now = (): Date => new Date()
```

Then create `apps/mb-api/src/apiKey/commands/revokeApiKey.ts` :

```ts
import { type ApiKeyApiModel } from '@pilote/mb-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { ensurePrincipal } from '@/framework/auth/ensurePrincipal'
import { isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { now } from '@/framework/date'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

const performRevoke = async (id: string): Promise<ApiKeyApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

  if (id === requireCurrentPrincipalId()) {
    throw new ConflictError('Impossible de révoquer la clé API utilisée pour cette requête')
  }

  const existing = await db().apiKey.findUniqueOrThrow({ where: { id } })
  if (existing.revokedAt) {
    throw new ConflictError('Cette clé API est déjà révoquée')
  }

  const revoked = await db().apiKey.update({
    where: { id },
    data: { revokedAt: now() },
  })

  return toApiKeyApiModel(revoked)
}

export const revokeApiKey = (id: string): ResultAsync<ApiKeyApiModel, never> =>
  ResultAsync.fromSafePromise(performRevoke(id))
```

- [ ] **Step 8 : Lancer le test → passe**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/apiKey/commands/revokeApiKey.test.ts`
Expected: PASS.

- [ ] **Step 9 : Commit**

```bash
git add apps/mb-api/src/apiKey/queries apps/mb-api/src/apiKey/commands/revokeApiKey.ts apps/mb-api/src/apiKey/commands/revokeApiKey.test.ts apps/mb-api/src/framework/date.ts
git commit -m "feat(mb-api): listApiKeys + revokeApiKey (soft-delete, anti-lockout)"
```

---

## Task 6 : Routes OpenAPI + enregistrement dans l'app

**Files:**
- Create: `apps/mb-api/src/apiKey/routes.ts`
- Test: `apps/mb-api/src/apiKey/routes.test.ts`
- Modify: `apps/mb-api/src/app.ts`

**Interfaces:**
- Consumes : `createApiKey`, `listApiKeys`, `revokeApiKey` ; schémas mb-shared ; `requireAuthentication`, `never`, `jsonResponseOk`, `erreur403/404/409`, `withTransaction`.
- Produces : `apiKeyRoutes: OpenAPIHono` (routes `POST /api-keys`, `GET /api-keys`, `POST /api-keys/{id}/revoke`).

- [ ] **Step 1 : Créer les routes**

Create `apps/mb-api/src/apiKey/routes.ts` :

```ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  apiKeyApiModelSchema,
  createApiKeyBodySchema,
  createdApiKeyApiModelSchema,
} from '@pilote/mb-shared/apiKey'

import { createApiKey } from '@/apiKey/commands/createApiKey'
import { revokeApiKey } from '@/apiKey/commands/revokeApiKey'
import { listApiKeys } from '@/apiKey/queries/listApiKeys'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur403, erreur404, erreur409 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'

const ApiKeyApiModelSchema = apiKeyApiModelSchema.openapi('ApiKeyApiModel')
const ApiKeyListApiModelSchema = z.array(ApiKeyApiModelSchema).openapi('ApiKeyListApiModel')
const CreatedApiKeyApiModelSchema = createdApiKeyApiModelSchema.openapi('CreatedApiKeyApiModel')
const CreateApiKeyBodySchema = createApiKeyBodySchema.openapi('CreateApiKeyBody')

const revokeParamsSchema = z.object({
  id: z.string().openapi({ description: 'Identifiant (UUID) de la clé API à révoquer.' }),
})

// --- POST /api-keys ----------------------------------------------------------

const createApiKeyRoute = createRoute({
  method: 'post',
  path: '/api-keys',
  tags: ['ApiKey', 'Admin'],
  summary: 'Créer une clé API',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Génère une nouvelle clé et retourne sa valeur en clair (`rawKey`) **une seule fois** : elle n'est pas re-affichable ensuite.",
  middleware: [requireAuthentication],
  request: {
    body: { content: { 'application/json': { schema: CreateApiKeyBodySchema } }, required: true },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: CreatedApiKeyApiModelSchema } },
      description: 'Clé API créée',
    },
    403: erreur403,
  },
})

// --- GET /api-keys -----------------------------------------------------------

const listApiKeysRoute = createRoute({
  method: 'get',
  path: '/api-keys',
  tags: ['ApiKey', 'Admin'],
  summary: 'Lister les clés API',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Retourne les clés triées par date de création décroissante. Aucune valeur secrète n'est exposée (ni hash, ni clé en clair).",
  middleware: [requireAuthentication],
  responses: {
    200: {
      content: { 'application/json': { schema: ApiKeyListApiModelSchema } },
      description: 'Liste des clés API',
    },
    403: erreur403,
  },
})

// --- POST /api-keys/{id}/revoke ----------------------------------------------

const revokeApiKeyRoute = createRoute({
  method: 'post',
  path: '/api-keys/{id}/revoke',
  tags: ['ApiKey', 'Admin'],
  summary: 'Révoquer une clé API',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Révoque la clé (soft-delete). Renvoie 409 si la clé est déjà révoquée ou si l'on tente de révoquer la clé utilisée pour la requête, 404 si la clé est introuvable.",
  middleware: [requireAuthentication],
  request: { params: revokeParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: ApiKeyApiModelSchema } },
      description: 'Clé API révoquée',
    },
    403: erreur403,
    404: erreur404,
    409: erreur409,
  },
})

export const apiKeyRoutes = new OpenAPIHono()

apiKeyRoutes.openapi(createApiKeyRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => createApiKey(body))).match(
    (data) => jsonResponseOk({ context, data, schema: CreatedApiKeyApiModelSchema, status: 201 }),
    never,
  )
})

apiKeyRoutes.openapi(listApiKeysRoute, async (context) =>
  listApiKeys().match(
    (data) => jsonResponseOk({ context, data, schema: ApiKeyListApiModelSchema, status: 200 }),
    never,
  ),
)

apiKeyRoutes.openapi(revokeApiKeyRoute, async (context) => {
  const { id } = context.req.valid('param')
  return (await withTransaction(async () => revokeApiKey(id))).match(
    (data) => jsonResponseOk({ context, data, schema: ApiKeyApiModelSchema, status: 200 }),
    never,
  )
})
```

- [ ] **Step 2 : Enregistrer les routes dans l'app**

In `apps/mb-api/src/app.ts`, add the import (à côté des autres imports de routes, après la ligne `import { commentaireRoutes }`) :

```ts
import { apiKeyRoutes } from '@/apiKey/routes'
```

and add the mount (après `app.route('/', whoamiRoutes)`) :

```ts
app.route('/', apiKeyRoutes)
```

- [ ] **Step 3 : Écrire le test de câblage (échoue)**

Create `apps/mb-api/src/apiKey/routes.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { app } from '@/app'

describe('routes api-keys — câblage OpenAPI', () => {
  it('déclare les routes api-keys dans le doc OpenAPI', async () => {
    const res = await app.request('/openapi.json')
    expect(res.status).toBe(200)
    const doc = (await res.json()) as { paths: Record<string, Record<string, unknown>> }

    const attendu: Array<[string, string]> = [
      ['/api-keys', 'post'],
      ['/api-keys', 'get'],
      ['/api-keys/{id}/revoke', 'post'],
    ]

    for (const [path, method] of attendu) {
      expect(doc.paths[path], `path ${path} manquant`).toBeDefined()
      expect(doc.paths[path]?.[method], `${method.toUpperCase()} ${path} manquant`).toBeDefined()
    }
  })

  it('renvoie 401 sur une création non authentifiée', async () => {
    const res = await app.request('/api-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label: 'x' }),
    })
    expect(res.status).toBe(401)
  })

  it('renvoie 401 sur une révocation non authentifiée', async () => {
    const res = await app.request('/api-keys/00000000-0000-0000-0000-0000000000ff/revoke', {
      method: 'POST',
    })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 4 : Lancer le test → passe**

Run: `pnpm --filter @pilote/mb-api exec vitest run src/apiKey/routes.test.ts`
Expected: PASS (les 3 routes sont déclarées + 401 sans auth).

- [ ] **Step 5 : Suite complète mb-api + lint**

Run: `pnpm --filter @pilote/mb-api test`
Expected: PASS (toute la suite).
Run: `pnpm --filter @pilote/mb-api lint`
Expected: 0 erreur (`lint:fix` si besoin d'ordre d'imports).

- [ ] **Step 6 : Commit**

```bash
git add apps/mb-api/src/apiKey/routes.ts apps/mb-api/src/apiKey/routes.test.ts apps/mb-api/src/app.ts
git commit -m "feat(mb-api): routes CRUD clés API (/api-keys, ADMIN only)"
```

---

## Task 7 : BFF mb-admin — étendre l'allowlist du proxy

**Files:**
- Modify: `apps/mb-admin/src/server/api/router.ts`

- [ ] **Step 1 : Autoriser le segment `api-keys`**

In `apps/mb-admin/src/server/api/router.ts`, replace la constante `SAFE_PATH` (ligne 9) :

```ts
const SAFE_PATH = /^(indicateurs|referentiels|individus)(\/[A-Za-z0-9_-]+)*$/
```

with :

```ts
const SAFE_PATH = /^(indicateurs|referentiels|individus|api-keys)(\/[A-Za-z0-9_-]+)*$/
```

(Le proxy relaie la méthode verbatim : `GET /api/api-keys`, `POST /api/api-keys` et `POST /api/api-keys/<id>/revoke` passent tous. Le commentaire au-dessus de la constante peut être laissé tel quel.)

- [ ] **Step 2 : Vérifier le typage/lint mb-admin**

Run: `pnpm --filter @pilote/mb-admin lint`
Expected: 0 erreur.

- [ ] **Step 3 : Commit**

```bash
git add apps/mb-admin/src/server/api/router.ts
git commit -m "feat(mb-admin): autoriser le proxy BFF vers /api-keys"
```

---

## Task 8 : Fetchers + query options mb-admin

**Files:**
- Create: `apps/mb-admin/src/api/apiKeys.ts`
- Create: `apps/mb-admin/src/queries/apiKeys.ts`

**Interfaces:**
- Produces :
  - `fetchApiKeys(): Promise<ApiKeyListApiModel>`
  - `createApiKey(body: CreateApiKeyBody): Promise<CreatedApiKeyApiModel>`
  - `revokeApiKey(id: string): Promise<ApiKeyApiModel>`
  - `apiKeysQueryOptions()` (TanStack Query, `queryKey: ['api-keys']`)

- [ ] **Step 1 : Créer les fetchers BFF**

Create `apps/mb-admin/src/api/apiKeys.ts` :

```ts
import type {
  ApiKeyApiModel,
  ApiKeyListApiModel,
  CreateApiKeyBody,
  CreatedApiKeyApiModel,
} from '@pilote/mb-shared/apiKey'
import {
  apiKeyApiModelSchema,
  apiKeyListApiModelSchema,
  createdApiKeyApiModelSchema,
} from '@pilote/mb-shared/apiKey'

import { bffClient } from '@/api/client'

export const fetchApiKeys = async (): Promise<ApiKeyListApiModel> => {
  const json = await bffClient.get('api-keys').json()
  return apiKeyListApiModelSchema.parse(json)
}

export const createApiKey = async (body: CreateApiKeyBody): Promise<CreatedApiKeyApiModel> => {
  const json = await bffClient.post('api-keys', { json: body }).json()
  return createdApiKeyApiModelSchema.parse(json)
}

export const revokeApiKey = async (id: string): Promise<ApiKeyApiModel> => {
  const json = await bffClient.post(`api-keys/${id}/revoke`).json()
  return apiKeyApiModelSchema.parse(json)
}
```

- [ ] **Step 2 : Créer les query options**

Create `apps/mb-admin/src/queries/apiKeys.ts` :

```ts
import { queryOptions } from '@tanstack/react-query'

import { fetchApiKeys } from '@/api/apiKeys'

export const apiKeysQueryOptions = () =>
  queryOptions({ queryKey: ['api-keys'], queryFn: fetchApiKeys })
```

- [ ] **Step 3 : Vérifier le typage/lint mb-admin**

Run: `pnpm --filter @pilote/mb-admin lint`
Expected: 0 erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/mb-admin/src/api/apiKeys.ts apps/mb-admin/src/queries/apiKeys.ts
git commit -m "feat(mb-admin): fetchers et query des clés API"
```

---

## Task 9 : Composants `ApiKeyForm` + `CreatedApiKeyResult`

**Files:**
- Create: `apps/mb-admin/src/components/ApiKeyForm.tsx`
- Create: `apps/mb-admin/src/components/CreatedApiKeyResult.tsx`

**Interfaces:**
- Produces :
  - `ApiKeyFormValues = { label: string; role: 'CONTRIBUTOR' | 'ADMIN'; expiresAt: string }`
  - `ApiKeyForm(props: { pending, errorMessage, isProd, onSubmit, onCancel })`
  - `CreatedApiKeyResult(props: { rawKey: string; label: string; onDone: () => void })`

- [ ] **Step 1 : Créer `ApiKeyForm`**

Create `apps/mb-admin/src/components/ApiKeyForm.tsx` :

```tsx
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { clsxm } from '@/lib/clsxm'

export type ApiKeyFormValues = {
  label: string
  role: 'CONTRIBUTOR' | 'ADMIN'
  expiresAt: string
}

export function ApiKeyForm({
  pending,
  errorMessage,
  isProd,
  onSubmit,
  onCancel,
}: {
  pending: boolean
  errorMessage: string | null
  isProd: boolean
  onSubmit: (values: ApiKeyFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ApiKeyFormValues>({
    label: '',
    role: 'CONTRIBUTOR',
    expiresAt: '',
  })

  const update = (patch: Partial<ApiKeyFormValues>) =>
    setValues((prev) => ({ ...prev, ...patch }))

  const canSubmit = values.label.trim().length > 0

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">
            Label <span className="text-accent">*</span>
          </label>
          <input
            value={values.label}
            onChange={(event) => update({ label: event.target.value })}
            placeholder="Intégration SI-X"
            className="w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold">Rôle</label>
          <select
            value={values.role}
            onChange={(event) =>
              update({ role: event.target.value as ApiKeyFormValues['role'] })
            }
            className="w-56 rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="CONTRIBUTOR">CONTRIBUTOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="mb-2">
          <label className="mb-1.5 block text-xs font-semibold">Expiration (optionnelle)</label>
          <input
            type="date"
            value={values.expiresAt}
            onChange={(event) => update({ expiresAt: event.target.value })}
            className="w-56 rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-right text-sm font-medium text-accent">{errorMessage}</p>
      ) : null}

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="button"
          disabled={!canSubmit || pending}
          onClick={() => onSubmit(values)}
          className={clsxm(isProd && 'bg-accent hover:bg-accent')}
        >
          {pending ? 'Création…' : isProd ? '🚨 Créer en Prod' : 'Créer la clé'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer `CreatedApiKeyResult`**

Create `apps/mb-admin/src/components/CreatedApiKeyResult.tsx` :

```tsx
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'

export function CreatedApiKeyResult({
  rawKey,
  label,
  onDone,
}: {
  rawKey: string
  label: string
  onDone: () => void
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard.writeText(rawKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-bold">Clé « {label} » créée</h2>
        <p className="mt-1 text-sm font-medium text-accent">
          ⚠️ Copiez la clé maintenant : elle ne sera plus jamais affichée.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2.5">
          <code className="flex-1 break-all font-mono text-sm">{rawKey}</code>
          <button type="button" onClick={copy} className="text-primary" aria-label="Copier la clé">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button type="button" onClick={onDone}>
          Terminer
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier le typage/lint mb-admin**

Run: `pnpm --filter @pilote/mb-admin lint`
Expected: 0 erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/mb-admin/src/components/ApiKeyForm.tsx apps/mb-admin/src/components/CreatedApiKeyResult.tsx
git commit -m "feat(mb-admin): composants formulaire et résultat de création de clé"
```

---

## Task 10 : Pages liste + création

**Files:**
- Create: `apps/mb-admin/src/routes/_authed/api-keys/index.tsx`
- Create: `apps/mb-admin/src/routes/_authed/api-keys/nouveau.tsx`

**Interfaces:**
- Consumes : `apiKeysQueryOptions`, `revokeApiKey`, `createApiKey`, `ApiKeyForm`, `CreatedApiKeyResult`, `extractApiError`, `session`, composants UI (`Breadcrumb`, `PageHeading`, `Button`, `EmptyState`, `Table`).

- [ ] **Step 1 : Créer la page liste (+ révocation)**

Create `apps/mb-admin/src/routes/_authed/api-keys/index.tsx` :

```tsx
import type { ApiKeyApiModel } from '@pilote/mb-shared/apiKey'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { revokeApiKey } from '@/api/apiKeys'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { extractApiError } from '@/lib/apiError'
import { apiKeysQueryOptions } from '@/queries/apiKeys'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/api-keys/')({
  component: ApiKeysListComponent,
})

const STATUS_LABEL: Record<ApiKeyApiModel['status'], string> = {
  active: 'Active',
  expired: 'Expirée',
  revoked: 'Révoquée',
}

const STATUS_CLASS: Record<ApiKeyApiModel['status'], string> = {
  active: 'font-semibold text-primary',
  expired: 'text-text-muted',
  revoked: 'text-accent',
}

function ApiKeysListComponent() {
  const queryClient = useQueryClient()
  const isProd = session.current?.environment === 'prod'
  const query = useQuery(apiKeysQueryOptions())
  const items = query.data ?? []
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: async () => {
      setConfirmingId(null)
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: (err: unknown) => {
      setConfirmingId(null)
      void extractApiError(err).then(setError)
    },
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Clés API</span>
      </Breadcrumb>
      <PageHeading
        title="Clés API"
        subtitle={
          <>
            {items.length} clé{items.length > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-accent' : undefined}>{session.current?.environment}</b>
          </>
        }
        action={
          <Button asChild>
            <Link to="/api-keys/nouveau">
              <Plus className="size-4" /> Créer une clé
            </Link>
          </Button>
        }
      />

      {query.isError ? (
        <p className="mb-4 text-sm font-medium text-accent">
          Impossible de charger les clés API. Une clé de session de rôle ADMIN est requise.
        </p>
      ) : null}
      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      {items.length === 0 && !query.isLoading ? (
        <EmptyState title="Aucune clé API" description="Créez votre première clé API." />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Label</Table.HeaderCell>
              <Table.HeaderCell>Préfixe</Table.HeaderCell>
              <Table.HeaderCell>Rôle</Table.HeaderCell>
              <Table.HeaderCell>Statut</Table.HeaderCell>
              <Table.HeaderCell>Créée le</Table.HeaderCell>
              <Table.HeaderCell align="right" />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((apiKey) => (
              <Table.Row key={apiKey.id}>
                <Table.Cell>
                  <span className="font-semibold">{apiKey.label}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-text-muted">{apiKey.prefix}…</span>
                </Table.Cell>
                <Table.Cell>{apiKey.role}</Table.Cell>
                <Table.Cell>
                  <span className={STATUS_CLASS[apiKey.status]}>{STATUS_LABEL[apiKey.status]}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-text-muted">
                    {new Date(apiKey.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </Table.Cell>
                <Table.Cell align="right">
                  {apiKey.status === 'revoked' ? (
                    <span className="text-text-subtle">—</span>
                  ) : confirmingId === apiKey.id ? (
                    <span className="inline-flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        disabled={revokeMutation.isPending}
                        onClick={() => revokeMutation.mutate(apiKey.id)}
                        className="border-accent bg-accent text-primary-foreground hover:bg-accent"
                      >
                        Confirmer
                      </Button>
                      <Button
                        variant="tertiary"
                        size="sm"
                        type="button"
                        onClick={() => setConfirmingId(null)}
                      >
                        Annuler
                      </Button>
                    </span>
                  ) : (
                    <Button
                      variant="tertiary"
                      size="sm"
                      type="button"
                      onClick={() => setConfirmingId(apiKey.id)}
                    >
                      Révoquer
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Créer la page de création**

Create `apps/mb-admin/src/routes/_authed/api-keys/nouveau.tsx` :

```tsx
import type { CreatedApiKeyApiModel } from '@pilote/mb-shared/apiKey'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { createApiKey } from '@/api/apiKeys'
import { ApiKeyForm, type ApiKeyFormValues } from '@/components/ApiKeyForm'
import { Breadcrumb } from '@/components/Breadcrumb'
import { CreatedApiKeyResult } from '@/components/CreatedApiKeyResult'
import { PageHeading } from '@/components/PageHeading'
import { extractApiError } from '@/lib/apiError'
import { session } from '@/session'

export const Route = createFileRoute('/_authed/api-keys/nouveau')({
  component: NewApiKeyComponent,
})

function NewApiKeyComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isProd = session.current?.environment === 'prod'
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedApiKeyApiModel | null>(null)

  const mutation = useMutation({
    mutationFn: (values: ApiKeyFormValues) =>
      createApiKey({
        label: values.label,
        role: values.role,
        expiresAt: values.expiresAt === '' ? null : new Date(values.expiresAt).toISOString(),
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setCreated(result)
    },
    onError: (err: unknown) => {
      void extractApiError(err).then(setError)
    },
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/api-keys" className="hover:text-primary">
          Clés API
        </Link>
        <span className="font-medium text-text">Nouvelle clé</span>
      </Breadcrumb>
      <PageHeading title="Nouvelle clé API" />
      {created ? (
        <CreatedApiKeyResult
          rawKey={created.rawKey}
          label={created.label}
          onDone={() => void navigate({ to: '/api-keys' })}
        />
      ) : (
        <ApiKeyForm
          pending={mutation.isPending}
          errorMessage={error}
          isProd={isProd}
          onCancel={() => void navigate({ to: '/api-keys' })}
          onSubmit={(values) => mutation.mutate(values)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3 : Régénérer l'arbre de routes + lint**

Run: `pnpm --filter @pilote/mb-admin routes:generate`
Expected: `src/routeTree.gen.ts` régénéré, inclut `/_authed/api-keys/` et `/_authed/api-keys/nouveau`.
Run: `pnpm --filter @pilote/mb-admin lint`
Expected: 0 erreur (les `Link to="/api-keys"` sont typés grâce à l'arbre régénéré).

- [ ] **Step 4 : Commit**

```bash
git add apps/mb-admin/src/routes/_authed/api-keys apps/mb-admin/src/routeTree.gen.ts
git commit -m "feat(mb-admin): pages liste et création des clés API"
```

---

## Task 11 : Entrée d'accueil (BarCard)

**Files:**
- Modify: `apps/mb-admin/src/routes/_authed/fonctionnalites.tsx`

- [ ] **Step 1 : Ajouter l'import d'icône**

In `apps/mb-admin/src/routes/_authed/fonctionnalites.tsx`, replace :

```tsx
import { BarChart3, FolderTree } from 'lucide-react'
```

with :

```tsx
import { BarChart3, FolderTree, KeyRound } from 'lucide-react'
```

- [ ] **Step 2 : Ajouter la carte**

In the same file, add a third card après le bloc `FadeIn`/`BarCard` des référentiels (avant la fermeture de la `div`) :

```tsx
        <FadeIn delayMs={180}>
          <BarCard
            icon={KeyRound}
            title="Gérer les clés API"
            description="Créer, lister et révoquer les clés API (réservé aux clés ADMIN)."
            onClick={() => void navigate({ to: '/api-keys' })}
          />
        </FadeIn>
```

- [ ] **Step 3 : Lint**

Run: `pnpm --filter @pilote/mb-admin lint`
Expected: 0 erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/mb-admin/src/routes/_authed/fonctionnalites.tsx
git commit -m "feat(mb-admin): carte d'accès à la gestion des clés API"
```

---

## Vérification manuelle finale (facultatif mais recommandé)

- [ ] Lancer mb-api (`pnpm dev:mb`) et mb-admin (`pnpm --filter @pilote/mb-admin dev`).
- [ ] Se connecter dans mb-admin avec une **clé ADMIN** (env local/dev).
- [ ] Vérifier : accueil → « Gérer les clés API » → liste, création (la `rawKey` s'affiche une fois + copie), révocation (confirmation + statut « Révoquée »).
- [ ] Vérifier qu'une clé **CONTRIBUTOR** en session voit un message d'erreur clair sur la liste (403 relayé).

---

## Self-Review

**Spec coverage :**
- §1 guards → Task 1 (prédicats + `ensurePrincipal` + migration + suppression). ✅
- §2 endpoints (`POST`/`GET`/`revoke`, ADMIN only, statut, anti-lockout, 404/409) → Tasks 4, 5, 6. ✅
- §3 schémas mb-shared → Task 2. ✅
- §4 IHM (SAFE_PATH, api, queries, pages, form, BarCard) → Tasks 7, 8, 9, 10, 11. ✅
- §5 tests (mb-api unit + câblage route ; pas de tests front) → Tasks 1, 3, 4, 5, 6. ✅

**Placeholder scan :** aucun TODO/TBD ; chaque étape contient le code complet ou l'edit exact. ✅

**Type consistency :** `createApiKey`/`revokeApiKey`/`listApiKeys`/`toApiKeyApiModel`/`computeApiKeyStatus` et les schémas mb-shared sont référencés avec des signatures identiques entre définition et consommation ; `ApiKeyFormValues.role` (`'CONTRIBUTOR' | 'ADMIN'`) aligné avec `createApiKeyBodySchema`. ✅

**Note d'exécution :** les tests d'intégration mb-api requièrent la base de test lancée ; le test de câblage route (`app`) charge l'`env` (donc `.env.test`).
