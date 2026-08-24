# Rôles CONTRIBUTOR/ADMIN sur les clés API mb-api — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Découpler la gestion de définition (indicateurs/référentiels) de la saisie de valeurs sur les clés API mb-api, via un rôle `CONTRIBUTOR`/`ADMIN`.

**Architecture:** Un rôle stocké sur `ApiKey` (défaut `CONTRIBUTOR`), propagé dans le principal (ALS), et un garde `ensureApiKeyAdmin` appelé en tête des commandes `upsertIndicateur` et `upsertReferentiel`. ACL `WRITE` par indicateur inchangée pour la saisie. Principals `user` (OIDC) toujours autorisés.

**Tech Stack:** Prisma 7 (postgres), Hono + @hono/zod-openapi, neverthrow, vitest.

**Ticket :** [PIL-1614](https://data-ditp.atlassian.net/browse/PIL-1614) · **Design :** `docs/superpowers/specs/2026-06-15-roles-cles-api-mb-design.md`

**Commandes utiles (cwd = `apps/mb-api`) :**
- Migration dev : `pnpm database:migration` (= `prisma migrate dev`)
- Générer le client : `pnpm prisma:generate` (= `prisma generate --sql`)
- Tests : `pnpm test` (un fichier : `pnpm vitest run src/...`)
- Lint complet : `pnpm lint`

---

### Task 1: Schéma Prisma — enum `ApiKeyRole` + colonne `role`

**Files:**
- Modify: `apps/mb-api/prisma/schema.prisma` (modèle `ApiKey`, ~l.57-71)
- Create: `apps/mb-api/prisma/migrations/20260615000000_add_api_key_role/migration.sql`

- [ ] **Step 1: Ajouter l'enum + la colonne dans le schéma**

Dans `prisma/schema.prisma`, ajouter l'enum près des autres enums :

```prisma
enum ApiKeyRole {
  CONTRIBUTOR
  ADMIN

  @@map("api_key_role_enum")
}
```

Et ajouter le champ dans le modèle `ApiKey` (après `lastUsedAt`) :

```prisma
model ApiKey {
  id         String     @id @db.Uuid
  label      String
  keyHash    String     @unique @map("key_hash")
  prefix     String     @map("prefix")
  role       ApiKeyRole @default(CONTRIBUTOR) @map("role")
  createdAt  DateTime   @default(now()) @map("created_at")
  expiresAt  DateTime?  @map("expires_at")
  revokedAt  DateTime?  @map("revoked_at")
  lastUsedAt DateTime?  @map("last_used_at")

  principal Principal @relation(fields: [id], references: [id], onDelete: Cascade)

  @@index([prefix])
  @@map("api_key")
}
```

- [ ] **Step 2: Générer la migration + le client**

Run: `pnpm database:migration --name add_api_key_role`
Expected: nouveau dossier `prisma/migrations/<ts>_add_api_key_role/` avec un `migration.sql` contenant `CREATE TYPE "api_key_role_enum"` et `ALTER TABLE "api_key" ADD COLUMN "role"`. Le client est régénéré, `ApiKeyRole` apparaît dans `src/generated/prisma/enums.ts`.

(Si `migrate dev` n'est pas possible, créer `prisma/migrations/20260615000000_add_api_key_role/migration.sql` manuellement :)

```sql
-- CreateEnum
CREATE TYPE "api_key_role_enum" AS ENUM ('CONTRIBUTOR', 'ADMIN');

-- AlterTable
ALTER TABLE "api_key" ADD COLUMN     "role" "api_key_role_enum" NOT NULL DEFAULT 'CONTRIBUTOR';
```
puis `pnpm prisma:generate`.

- [ ] **Step 3: Vérifier la régénération**

Run: `grep -n "ApiKeyRole" src/generated/prisma/enums.ts`
Expected: présence de `ApiKeyRole = { CONTRIBUTOR: 'CONTRIBUTOR', ADMIN: 'ADMIN' }`.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-api/prisma/schema.prisma apps/mb-api/prisma/migrations apps/mb-api/src/generated
git commit -m "feat: ajoute le rôle ApiKeyRole (CONTRIBUTOR/ADMIN) au schéma mb-api"
```

---

### Task 2: Propager le rôle dans le principal

**Files:**
- Modify: `apps/mb-api/src/framework/auth/userContext.ts` (type `ApiKeyAuthentifiee`)
- Modify: `apps/mb-api/src/framework/auth/verifyApiKey.ts` (retour `resolveApiKey`)
- Modify: `apps/mb-api/src/test/runAsPrincipal.ts` (helper de test)

- [ ] **Step 1: Ajouter `role` au type `ApiKeyAuthentifiee`**

Dans `userContext.ts`, ajouter l'import de l'enum et le champ :

```ts
import { AsyncLocalStorage } from 'node:async_hooks'

import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import type { ApiKeyRole } from '@/generated/prisma/enums'

export type UtilisateurAuthentifie = {
  id: string
  email: string
  prenom: string
  nom: string
}

export type ApiKeyAuthentifiee = {
  id: string
  label: string
  role: ApiKeyRole
}
```

- [ ] **Step 2: Renseigner `role` dans `verifyApiKey`**

Dans `verifyApiKey.ts`, le `return` final de `resolveApiKey` devient :

```ts
  return { id: row.id, label: row.label, role: row.role }
```

(`row` provient de `db().apiKey.findUnique`, il porte désormais `role`.)

- [ ] **Step 3: Étendre `runAsPrincipal` (et ajouter `runAsUser`)**

Remplacer le contenu de `src/test/runAsPrincipal.ts` par :

```ts
import { runWithPrincipal } from '@/framework/auth/userContext'
import { ApiKeyRole } from '@/generated/prisma/enums'

export const runAsPrincipal = <T>(
  principalId: string,
  fn: () => T,
  role: ApiKeyRole = ApiKeyRole.CONTRIBUTOR,
): T => runWithPrincipal({ kind: 'apiKey', apiKey: { id: principalId, label: 'test', role } }, fn)

export const runAsUser = <T>(userId: string, fn: () => T): T =>
  runWithPrincipal(
    { kind: 'user', user: { id: userId, email: 'test@example.com', prenom: 'Test', nom: 'User' } },
    fn,
  )
```

> ⚠️ Les tests existants appellent `runAsPrincipal(apiKey.id, fn)` sur des commandes de saisie de valeurs (pas concernées par le garde ADMIN) : le défaut `CONTRIBUTOR` ne change rien pour elles.

- [ ] **Step 4: Vérifier le typecheck**

Run: `pnpm vitest run src/test --silent 2>&1 | tail -5 || true` puis `npx tsc --noEmit`
Expected: pas d'erreur de type liée à `role`.

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/framework/auth/userContext.ts apps/mb-api/src/framework/auth/verifyApiKey.ts apps/mb-api/src/test/runAsPrincipal.ts
git commit -m "feat: propage le rôle de la clé API dans le principal"
```

---

### Task 3: Garde `ensureApiKeyAdmin`

**Files:**
- Create: `apps/mb-api/src/framework/auth/ensureApiKeyAdmin.ts`
- Create: `apps/mb-api/src/framework/auth/ensureApiKeyAdmin.test.ts`

- [ ] **Step 1: Écrire le test (échoue d'abord)**

```ts
import { describe, expect, it } from 'vitest'

import { ensureApiKeyAdmin } from '@/framework/auth/ensureApiKeyAdmin'
import { ForbiddenError } from '@/framework/errors/AppError'
import { UnauthorizedError } from '@/framework/auth/UnauthorizedError'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { runAsPrincipal, runAsUser } from '@/test/runAsPrincipal'

describe('ensureApiKeyAdmin', () => {
  it('laisse passer une clé API ADMIN', () => {
    expect(() =>
      runAsPrincipal('00000000-0000-0000-0000-000000000001', ensureApiKeyAdmin, ApiKeyRole.ADMIN),
    ).not.toThrow()
  })

  it('refuse une clé API CONTRIBUTOR', () => {
    expect(() =>
      runAsPrincipal(
        '00000000-0000-0000-0000-000000000001',
        ensureApiKeyAdmin,
        ApiKeyRole.CONTRIBUTOR,
      ),
    ).toThrow(ForbiddenError)
  })

  it('laisse passer un utilisateur OIDC', () => {
    expect(() =>
      runAsUser('00000000-0000-0000-0000-000000000002', ensureApiKeyAdmin),
    ).not.toThrow()
  })

  it('refuse en absence de principal', () => {
    expect(() => ensureApiKeyAdmin()).toThrow(UnauthorizedError)
  })
})
```

- [ ] **Step 2: Lancer le test → échec attendu**

Run: `pnpm vitest run src/framework/auth/ensureApiKeyAdmin.test.ts`
Expected: FAIL (module `ensureApiKeyAdmin` introuvable).

- [ ] **Step 3: Implémenter le garde**

```ts
import { requirePrincipal } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { ApiKeyRole } from '@/generated/prisma/enums'

// Réserve l'opération aux clés API de rôle ADMIN.
// Les principals utilisateur (OIDC) ne sont pas concernés par ce durcissement.
export const ensureApiKeyAdmin = (): void => {
  const principal = requirePrincipal()
  if (principal.kind === 'user') return
  if (principal.apiKey.role !== ApiKeyRole.ADMIN) {
    throw new ForbiddenError('Cette opération requiert une clé API de rôle ADMIN')
  }
}
```

- [ ] **Step 4: Lancer le test → succès attendu**

Run: `pnpm vitest run src/framework/auth/ensureApiKeyAdmin.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/framework/auth/ensureApiKeyAdmin.ts apps/mb-api/src/framework/auth/ensureApiKeyAdmin.test.ts
git commit -m "feat: ajoute le garde ensureApiKeyAdmin"
```

---

### Task 4: Garder `upsertIndicateur` (définition)

**Files:**
- Modify: `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts` (`performUpsert`)
- Create: `apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts`

- [ ] **Step 1: Écrire les tests (échouent d'abord)**

```ts
import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { db } from '@/framework/persistence/dbStore'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal, runAsUser } from '@/test/runAsPrincipal'

const body = { nom: 'Nouveau nom', visibilite: 'PRIVE' as const, unite: null, referentiels: [] }

describe.concurrent('upsertIndicateur — garde ADMIN', () => {
  it(
    'refuse une clé CONTRIBUTOR (403)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'WRITE' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () => upsertIndicateur(indId, body), ApiKeyRole.CONTRIBUTOR),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'autorise une clé ADMIN à créer un indicateur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(
        apiKey.id,
        () => upsertIndicateur(indId, body),
        ApiKeyRole.ADMIN,
      )

      expect(result.isOk()).toBe(true)
      const row = await db().indicateur.findUnique({ where: { publicId: indId } })
      expect(row?.nom).toBe('Nouveau nom')
    }),
  )

  it(
    'autorise un utilisateur OIDC à créer un indicateur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const utilisateur = await fixtures.utilisateur()

      const result = await runAsUser(utilisateur.id, () => upsertIndicateur(indId, body))

      expect(result.isOk()).toBe(true)
    }),
  )
})
```

- [ ] **Step 2: Lancer → échec attendu**

Run: `pnpm vitest run src/indicateur/commands/upsertIndicateur.test.ts`
Expected: FAIL (la clé CONTRIBUTOR réussit aujourd'hui car aucun garde ADMIN).

- [ ] **Step 3: Appeler le garde en tête de `performUpsert`**

Dans `upsertIndicateur.ts`, ajouter l'import et l'appel :

```ts
import { ensureApiKeyAdmin } from '@/framework/auth/ensureApiKeyAdmin'
```

```ts
const performUpsert = async (publicId: string, body: UpsertIndicateurBody): Promise<void> => {
  ensureApiKeyAdmin()
  const principalId = requireCurrentPrincipalId()
  const existant = await db().indicateur.findUnique({ where: { publicId } })
  if (existant) {
    await updateIndicateurExistant(publicId, existant.id, body, principalId)
    return
  }
  await createIndicateurAvecGrants(publicId, body, principalId)
}
```

- [ ] **Step 4: Lancer → succès attendu**

Run: `pnpm vitest run src/indicateur/commands/upsertIndicateur.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/indicateur/commands/upsertIndicateur.ts apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts
git commit -m "feat: réserve la gestion d'un indicateur aux clés API ADMIN"
```

---

### Task 5: Garder `upsertReferentiel` (ferme le trou actuel)

**Files:**
- Modify: `apps/mb-api/src/referentiel/commands/upsertReferentiel.ts` (`performUpsert`)
- Create: `apps/mb-api/src/referentiel/commands/upsertReferentiel.test.ts`

- [ ] **Step 1: Écrire les tests (échouent d'abord)**

```ts
import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { db } from '@/framework/persistence/dbStore'
import { upsertReferentiel } from '@/referentiel/commands/upsertReferentiel'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testReferentielId } from '@/test/randomIds'
import { runAsPrincipal, runAsUser } from '@/test/runAsPrincipal'

const body = { nom: 'Référentiel', description: null, individus: [] }

describe.concurrent('upsertReferentiel — garde ADMIN', () => {
  it(
    'refuse une clé CONTRIBUTOR (403)',
    integrationTest(async () => {
      const refId = testReferentielId()
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => upsertReferentiel(refId, body), ApiKeyRole.CONTRIBUTOR),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'autorise une clé ADMIN',
    integrationTest(async () => {
      const refId = testReferentielId()
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(
        apiKey.id,
        () => upsertReferentiel(refId, body),
        ApiKeyRole.ADMIN,
      )

      expect(result.isOk()).toBe(true)
      const row = await db().referentiel.findUnique({ where: { publicId: refId } })
      expect(row?.nom).toBe('Référentiel')
    }),
  )

  it(
    'autorise un utilisateur OIDC',
    integrationTest(async () => {
      const refId = testReferentielId()
      const utilisateur = await fixtures.utilisateur()

      const result = await runAsUser(utilisateur.id, () => upsertReferentiel(refId, body))

      expect(result.isOk()).toBe(true)
    }),
  )
})
```

- [ ] **Step 2: Lancer → échec attendu**

Run: `pnpm vitest run src/referentiel/commands/upsertReferentiel.test.ts`
Expected: FAIL (CONTRIBUTOR réussit aujourd'hui, route non gardée).

- [ ] **Step 3: Appeler le garde en tête de `performUpsert`**

Dans `upsertReferentiel.ts`, ajouter l'import et l'appel en première ligne de `performUpsert` :

```ts
import { ensureApiKeyAdmin } from '@/framework/auth/ensureApiKeyAdmin'
```

```ts
const performUpsert = async (
  publicId: string,
  body: UpsertReferentielBody,
): Promise<Result<void, UpsertReferentielError>> => {
  ensureApiKeyAdmin()
  const existingReferentiel = await db().referentiel.findUnique({
    where: { publicId },
    select: { id: true },
  })
  // ... reste inchangé
```

- [ ] **Step 4: Lancer → succès attendu**

Run: `pnpm vitest run src/referentiel/commands/upsertReferentiel.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/referentiel/commands/upsertReferentiel.ts apps/mb-api/src/referentiel/commands/upsertReferentiel.test.ts
git commit -m "feat: réserve la gestion d'un référentiel aux clés API ADMIN"
```

---

### Task 6: Fixture `role` + script `--admin`

**Files:**
- Modify: `apps/mb-api/src/test/fixtures.ts` (`ApiKeyOverrides`, `upsertApiKey`)
- Modify: `apps/mb-api/scripts/generate-api-key.ts`

- [ ] **Step 1: Ajouter `role` au fixture `apiKey`**

Dans `fixtures.ts`, importer `ApiKeyRole` (déjà dans le bloc `@/generated/prisma/enums`) et :

Ajouter à `ApiKeyOverrides` :
```ts
  role: ApiKeyRole
```
Dans `upsertApiKey`, ajouter au `create` :
```ts
    role: o.role ?? ApiKeyRole.CONTRIBUTOR,
```

- [ ] **Step 2: Ajouter le flag `--admin` au script de génération**

Dans `scripts/generate-api-key.ts`, ajouter l'option et l'utiliser dans le SQL :

```ts
    options: {
      secret: { type: 'string' },
      label: { type: 'string' },
      'expires-at': { type: 'string' },
      admin: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
```

```ts
  const role = values.admin ? 'ADMIN' : 'CONTRIBUTOR'
```

Et l'`INSERT INTO api_key` inclut la colonne `role` :

```ts
    `INSERT INTO api_key (id, label, key_hash, prefix, role, expires_at) VALUES (` +
      `${sqlString(generated.id)}, ${sqlString(label)}, ${sqlString(generated.keyHash)}, ${sqlString(generated.prefix)}, ` +
      `${sqlString(role)}::api_key_role_enum, ` +
      `${expiresAt ? sqlString(expiresAt.toISOString()) : 'NULL'});`,
```

Ajouter `role` à l'usage affiché et au bloc de sortie (`role      : ${role}`).

- [ ] **Step 3: Vérifier le script**

Run: `API_KEY_HMAC_SECRET=$(printf 'x%.0s' {1..40}) pnpm api-key:generate --admin --label demo | grep -E "role|api_key_role_enum"`
Expected: la sortie affiche `role` et le SQL contient `'ADMIN'::api_key_role_enum`.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-api/src/test/fixtures.ts apps/mb-api/scripts/generate-api-key.ts
git commit -m "feat: rôle dans le fixture apiKey et flag --admin du script de génération"
```

---

### Task 7: Swagger niveau 1 (tag `Admin` + 403)

**Files:**
- Modify: `apps/mb-api/src/indicateur/routes.ts` (`upsertIndicateurRoute`)
- Modify: `apps/mb-api/src/referentiel/routes.ts` (`upsertReferentielRoute`)

- [ ] **Step 1: Indicateur — tag + description + 403**

Dans `upsertIndicateurRoute`, modifier `tags`, compléter la `description`, ajouter la réponse 403 :

```ts
  tags: ['Indicateur', 'Admin'],
  summary: 'Créer ou remplacer un indicateur (nom + référentiels liés)',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Crée l'indicateur s'il n'existe pas, ou met à jour son `nom` si déjà présent. Le champ `referentielIds` est obligatoire et applique une sémantique replace-all : l'ensemble des liens devient strictement celui décrit dans le body (tableau vide pour aucun lien). Les doublons sont silencieusement dédupliqués. Si un `referentielId` n'existe pas, l'appel échoue avec 400 `VALIDATION_ERROR` et `details.unknownReferentielIds`. L'opération est atomique (transaction unique).",
```

Dans `responses`, ajouter :
```ts
    403: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Clé API sans le rôle ADMIN requis',
    },
```

- [ ] **Step 2: Référentiel — tag + description + 403**

Dans `upsertReferentielRoute`, modifier `tags`, préfixer la `description`, ajouter la réponse 403 :

```ts
  tags: ['Referentiel', 'Admin'],
```
Préfixer la description par : `"Réservé aux clés API de rôle \`ADMIN\`. "` (avant le texte existant).

Dans `responses`, ajouter :
```ts
    403: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Clé API sans le rôle ADMIN requis',
    },
```

- [ ] **Step 3: Vérifier**

Run: `pnpm vitest run src/indicateur src/referentiel`
Expected: PASS (tous les tests des deux modules verts).

- [ ] **Step 4: Commit**

```bash
git add apps/mb-api/src/indicateur/routes.ts apps/mb-api/src/referentiel/routes.ts
git commit -m "docs: documente le rôle ADMIN et la réponse 403 sur les routes de gestion"
```

---

### Task 8: Vérification finale

- [ ] **Step 1: Suite complète mb-api**

Run: `pnpm test`
Expected: tous les tests verts.

- [ ] **Step 2: Lint + typecheck + format**

Run: `pnpm lint`
Expected: aucune erreur.

- [ ] **Step 3: Mettre à jour le ticket Jira** (via jira-billable) avec un résumé + lien commit/PR.

---

## Self-Review

**Spec coverage :**
- Enum + colonne (défaut CONTRIBUTOR) → Task 1 ✔
- Propagation du rôle dans le principal (type + verifyApiKey) → Task 2 ✔
- Garde ADMIN, principal `user` autorisé → Task 3 ✔
- Gate sur `PUT /indicateurs/{id}` (création + update) → Task 4 ✔
- Gate sur `PUT /referentiels/{id}` (ferme le trou) → Task 5 ✔
- Saisie de valeurs inchangée → aucune modif des commandes valeurs/objectifs ✔ (tests existants restent verts en Task 8)
- Fixture `role` + script `--admin` → Task 6 ✔
- Swagger niveau 1 (tag + 403) → Task 7 ✔
- Migration des clés en ADMIN = manuelle, hors code → noté dans le design, pas une tâche de code ✔

**Type consistency :** `ensureApiKeyAdmin()` (void, throw) utilisé identiquement en Task 3/4/5 ; `ApiKeyRole` importé depuis `@/generated/prisma/enums` partout ; `runAsPrincipal(id, fn, role)` et `runAsUser(id, fn)` cohérents entre Task 2 et les tests Task 3/4/5.

**Placeholders :** aucun — chaque step porte le code réel.
