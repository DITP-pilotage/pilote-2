# Liaison Indicateur ↔ Référentiels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduire une liaison N..N explicite entre `Indicateur` et `Referentiel`, pilotée par un champ `referentielIds` requis dans le PUT, et exposer un endpoint dédié pour lire les référentiels liés.

**Architecture:** Nouvelle table de jonction Prisma `IndicateurReferentiel`. Le champ `referentielIds: string[]` (publicIds) devient un champ obligatoire du body de `PUT /indicateurs/:id` (replace-all idempotent dans une transaction) et apparaît en lecture sur `IndicateurApiModel` (donc sur `GET /indicateurs` et `GET /indicateurs/:id`). Un nouvel endpoint `GET /indicateurs/:id/referentiels` retourne les ressources complètes des référentiels liés. Pré-check applicatif des `referentielIds` avant écriture pour renvoyer un `400 VALIDATION_ERROR` clair avec la liste des IDs inconnus.

**Tech Stack:** TypeScript, Hono (`@hono/zod-openapi`), Zod, Prisma 5 + adapter `@prisma/adapter-pg`, neverthrow, Vitest (`integrationTest` rollback-based).

**Spec source:** `docs/superpowers/specs/2026-05-12-indicateur-referentiel-liaison-design.md`

---

### Task 1: Schéma Prisma + migration `IndicateurReferentiel`

**Files:**
- Modify: `apps/mb-api/prisma/schema.prisma`
- Create: `apps/mb-api/prisma/migrations/20260512130000_add_indicateur_referentiel/migration.sql`

- [ ] **Step 1: Ajouter le modèle et les relations inverses dans `schema.prisma`**

Insérer ce bloc juste après le modèle `Indicateur` (au-dessus de `enum PermissionAction`) :

```prisma
model IndicateurReferentiel {
  indicateurId  String   @map("indicateur_id")  @db.Uuid
  referentielId String   @map("referentiel_id") @db.Uuid
  createdAt     DateTime @default(now())        @map("created_at")

  indicateur  Indicateur  @relation(fields: [indicateurId],  references: [id], onDelete: Cascade)
  referentiel Referentiel @relation(fields: [referentielId], references: [id], onDelete: Cascade)

  @@id([indicateurId, referentielId])
  @@index([referentielId])
  @@map("indicateur_referentiel")
}
```

Puis ajouter la relation inverse `referentiels IndicateurReferentiel[]` au modèle `Indicateur` (juste après la ligne `valeurs ValeurAvancement[]`), et `indicateurs IndicateurReferentiel[]` au modèle `Referentiel` (juste après `individus ReferentielIndividu[]`).

- [ ] **Step 2: Créer la migration SQL à la main**

Créer `apps/mb-api/prisma/migrations/20260512130000_add_indicateur_referentiel/migration.sql` avec :

```sql
-- CreateTable
CREATE TABLE "indicateur_referentiel" (
    "indicateur_id" UUID NOT NULL,
    "referentiel_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicateur_referentiel_pkey" PRIMARY KEY ("indicateur_id","referentiel_id")
);

-- CreateIndex
CREATE INDEX "indicateur_referentiel_referentiel_id_idx" ON "indicateur_referentiel"("referentiel_id");

-- AddForeignKey
ALTER TABLE "indicateur_referentiel" ADD CONSTRAINT "indicateur_referentiel_indicateur_id_fkey" FOREIGN KEY ("indicateur_id") REFERENCES "indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicateur_referentiel" ADD CONSTRAINT "indicateur_referentiel_referentiel_id_fkey" FOREIGN KEY ("referentiel_id") REFERENCES "referentiel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Appliquer la migration et régénérer le client Prisma**

```bash
cd apps/mb-api && pnpm prisma migrate deploy && pnpm prisma generate
```

Expected: `Applied 1 migration` puis `Generated Prisma Client`.

- [ ] **Step 4: Vérifier que le typecheck passe (schéma cohérent, client à jour)**

```bash
cd apps/mb-api && pnpm tsc --noEmit
```

Expected: aucun message d'erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/prisma/schema.prisma apps/mb-api/prisma/migrations/20260512130000_add_indicateur_referentiel/
git commit -m "feat(mb-api): table IndicateurReferentiel (liaison N..N)"
```

---

### Task 2: Schémas partagés — `referentielIds` requis

**Files:**
- Modify: `packages/mb-shared/src/indicateur.ts`

- [ ] **Step 1: Étendre `indicateurApiModelSchema` et `upsertIndicateurBodySchema`**

Remplacer le contenu actuel par :

```ts
import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { referentielPublicIdSchema } from './publicIds'

export const indicateurPublicIdSchema = z
  .string()
  .regex(/^IND-\d+$/, 'Identifiant public attendu au format IND-XXX')
  .describe("Identifiant public de l'indicateur (format IND-XXX).")

export const indicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'indicateur."),
  referentielIds: z
    .array(referentielPublicIdSchema)
    .describe('Référentiels liés à l\'indicateur, triés par identifiant public ASC. Tableau vide si aucun lien.'),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type IndicateurApiModel = z.infer<typeof indicateurApiModelSchema>

export const indicateurListApiModelSchema = createPaginatedApiListSchema(indicateurApiModelSchema)
export type IndicateurListApiModel = z.infer<typeof indicateurListApiModelSchema>

export const listIndicateursQuerySchema = listQuerySchema
export type ListIndicateursQuery = z.infer<typeof listIndicateursQuerySchema>

export const upsertIndicateurBodySchema = z.object({
  nom: z.string().min(1).describe("Nom lisible de l'indicateur."),
  referentielIds: z
    .array(referentielPublicIdSchema)
    .describe(
      'Liste complète des référentiels à lier à l\'indicateur (replace-all à chaque PUT). ' +
        'Tableau vide pour ne lier aucun référentiel. Doublons silencieusement dédupliqués.',
    ),
})
export type UpsertIndicateurBody = z.infer<typeof upsertIndicateurBodySchema>
```

- [ ] **Step 2: Lancer le build du package partagé**

```bash
pnpm --filter @pilote/mb-shared build
```

Expected: build OK, types à jour.

- [ ] **Step 3: Vérifier que le typecheck `mb-api` remonte bien les erreurs sur les sites consommateurs (à fixer dans les tâches suivantes)**

```bash
cd apps/mb-api && pnpm tsc --noEmit
```

Expected: erreurs attendues sur `toIndicateurApiModel`, `upsertIndicateur`, et les tests qui ne fournissent pas `referentielIds`. Ces erreurs seront résolues par les tâches 4, 5, 6, 7.

- [ ] **Step 4: Commit**

```bash
git add packages/mb-shared/src/indicateur.ts
git commit -m "feat(mb-shared): referentielIds requis sur Indicateur (api + body upsert)"
```

---

### Task 3: `ValidationError` dans le framework d'erreurs

**Files:**
- Modify: `apps/mb-api/src/framework/errors/AppError.ts`

- [ ] **Step 1: Ajouter la classe `ValidationError`**

Ajouter à la fin du fichier :

```ts
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR'
  readonly kind = 'validation' as const
}
```

- [ ] **Step 2: Vérifier la mappe code/status dans `errorHandler.ts` (lecture seule)**

Pas d'édition : `kind: 'validation'` est déjà mappé à `400` dans `KIND_TO_STATUS`.

- [ ] **Step 3: Typecheck**

```bash
cd apps/mb-api && pnpm tsc --noEmit
```

Expected: pas de nouvelle erreur introduite par cette classe.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-api/src/framework/errors/AppError.ts
git commit -m "feat(mb-api): ValidationError (kind=validation, 400)"
```

---

### Task 4: `toIndicateurApiModel` — inclure `referentielIds`

**Files:**
- Modify: `apps/mb-api/src/indicateur/utils.ts`

- [ ] **Step 1: Remplacer le contenu de `utils.ts`**

```ts
import { type IndicateurApiModel } from '@pilote/mb-shared/indicateur'

import { type IndicateurModel, type ReferentielModel } from '@/generated/prisma/models'

export type IndicateurWithReferentiels = IndicateurModel & {
  referentiels: Array<{ referentiel: Pick<ReferentielModel, 'publicId'> }>
}

export const toIndicateurApiModel = (indicateur: IndicateurWithReferentiels): IndicateurApiModel => ({
  id: indicateur.publicId,
  nom: indicateur.nom,
  referentielIds: [...indicateur.referentiels.map((link) => link.referentiel.publicId)].sort(),
  createdAt: indicateur.createdAt.toISOString(),
  updatedAt: indicateur.updatedAt.toISOString(),
})
```

- [ ] **Step 2: Typecheck — les sites consommateurs (`getIndicateurByPublicId`, `listIndicateurs`) sont en erreur tant que leur `include` n'est pas étoffé**

```bash
cd apps/mb-api && pnpm tsc --noEmit
```

Expected: erreurs sur les queries qui n'ont pas encore l'`include { referentiels: { include: { referentiel: { select: { publicId: true } } } } }`. Fix dans tâches 6/7.

- [ ] **Step 3: Commit**

```bash
git add apps/mb-api/src/indicateur/utils.ts
git commit -m "feat(mb-api): toIndicateurApiModel expose referentielIds triés"
```

---

### Task 5: `upsertIndicateur` — replace-all des liens + pré-check existence

**Files:**
- Modify: `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts`
- Modify: `apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts`

- [ ] **Step 1: Écrire les tests qui décrivent le nouveau comportement (TDD)**

Remplacer le fichier `upsertIndicateur.test.ts` par :

```ts
import { describe, expect, it } from 'vitest'

import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

const getReferentielPublicIds = async (publicId: string): Promise<string[]> => {
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId },
    include: { referentiels: { include: { referentiel: { select: { publicId: true } } } } },
  })
  return indicateur.referentiels.map((link) => link.referentiel.publicId).sort()
}

describe.concurrent('upsertIndicateur', () => {
  it(
    'crée un indicateur avec ses référentiels liés et auto-grant READ+WRITE au créateur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey()
      const refA = await fixtures.referentiel({ publicId: 'REF-A' })
      const refB = await fixtures.referentiel({ publicId: 'REF-B' })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: { nom: 'Nouvel indicateur', referentielIds: [refA.publicId, refB.publicId] },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getReferentielPublicIds(indId)).toEqual(['REF-A', 'REF-B'])
      const grants = await db().indicateurPermission.findMany({
        where: { principalId: apiKey.id, indicateur: { publicId: indId } },
        orderBy: { action: 'asc' },
      })
      expect(grants.map((g) => g.action)).toEqual(['READ', 'WRITE'])
    }),
  )

  it(
    'remplace l\'ensemble des liens à chaque PUT (ajout + suppression)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-A' }, { publicId: 'REF-B' }, { publicId: 'REF-C' })
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({ publicId: indId, body: { nom: 'I', referentielIds: ['REF-A', 'REF-B'] } }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({ publicId: indId, body: { nom: 'I', referentielIds: ['REF-B', 'REF-C'] } }),
      )

      expect(await getReferentielPublicIds(indId)).toEqual(['REF-B', 'REF-C'])
    }),
  )

  it(
    'accepte un tableau vide (supprime tous les liens)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-A' })
      const apiKey = await fixtures.apiKey()
      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({ publicId: indId, body: { nom: 'I', referentielIds: ['REF-A'] } }),
      )

      await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({ publicId: indId, body: { nom: 'I', referentielIds: [] } }),
      )

      expect(await getReferentielPublicIds(indId)).toEqual([])
    }),
  )

  it(
    'dédoublonne silencieusement les referentielIds en double',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-A' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertIndicateur({
          publicId: indId,
          body: { nom: 'I', referentielIds: ['REF-A', 'REF-A'] },
        }),
      )

      expect(result.isOk()).toBe(true)
      expect(await getReferentielPublicIds(indId)).toEqual(['REF-A'])
    }),
  )

  it(
    'rejette quand un referentielId est inconnu, avec la liste des IDs manquants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.referentiel({ publicId: 'REF-A' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertIndicateur({
            publicId: indId,
            body: { nom: 'I', referentielIds: ['REF-A', 'REF-X', 'REF-Y'] },
          }),
        ),
      ).rejects.toMatchObject({
        constructor: ValidationError,
        details: { unknownReferentielIds: ['REF-X', 'REF-Y'] },
      })

      const created = await db().indicateur.findUnique({ where: { publicId: indId } })
      expect(created).toBeNull()
    }),
  )

  it(
    'rejette la mise à jour quand le principal n\'a pas la permission WRITE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'Ancien' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertIndicateur({ publicId: indId, body: { nom: 'X', referentielIds: [] } }),
        ),
      ).rejects.toThrow(/permission/i)
    }),
  )
})
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

```bash
cd apps/mb-api && pnpm vitest run src/indicateur/commands/upsertIndicateur.test.ts
```

Expected: les nouveaux tests échouent (le code actuel ne gère pas `referentielIds`).

- [ ] **Step 3: Réécrire `upsertIndicateur.ts`**

Remplacer le contenu par :

```ts
import { type UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

type UpsertIndicateurParams = {
  publicId: string
  body: UpsertIndicateurBody
}

const resolveReferentielIds = async (publicIds: readonly string[]): Promise<string[]> => {
  const unique = [...new Set(publicIds)]
  if (unique.length === 0) return []
  const found = await db().referentiel.findMany({
    where: { publicId: { in: unique } },
    select: { id: true, publicId: true },
  })
  const foundPublicIds = new Set(found.map((r) => r.publicId))
  const unknown = unique.filter((id) => !foundPublicIds.has(id))
  if (unknown.length > 0) {
    throw new ValidationError('Référentiels inconnus', {
      unknownReferentielIds: unknown.sort(),
    })
  }
  return found.map((r) => r.id)
}

const replaceReferentielLinks = async (
  indicateurId: string,
  referentielIds: string[],
): Promise<void> => {
  const existing = await db().indicateurReferentiel.findMany({
    where: { indicateurId },
    select: { referentielId: true },
  })
  const existingSet = new Set(existing.map((link) => link.referentielId))
  const desiredSet = new Set(referentielIds)

  const toAdd = referentielIds.filter((id) => !existingSet.has(id))
  const toRemove = [...existingSet].filter((id) => !desiredSet.has(id))

  if (toRemove.length > 0) {
    await db().indicateurReferentiel.deleteMany({
      where: { indicateurId, referentielId: { in: toRemove } },
    })
  }
  if (toAdd.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: toAdd.map((referentielId) => ({ indicateurId, referentielId })),
    })
  }
}

const assertWritePermission = async ({
  indicateurId,
  principalId,
}: {
  indicateurId: string
  principalId: string
}): Promise<void> => {
  const hasWrite = await db().indicateurPermission.findUnique({
    where: {
      principalId_indicateurId_action: {
        principalId,
        indicateurId,
        action: PermissionAction.WRITE,
      },
    },
  })
  if (!hasWrite) {
    throw new ForbiddenError("Vous n'avez pas la permission de modifier cet indicateur")
  }
}

const updateExisting = async ({
  publicId,
  indicateurId,
  body,
  principalId,
}: {
  publicId: string
  indicateurId: string
  body: UpsertIndicateurBody
  principalId: string
}): Promise<void> => {
  await assertWritePermission({ indicateurId, principalId })
  const referentielIds = await resolveReferentielIds(body.referentielIds)
  await db().indicateur.update({ where: { publicId }, data: { nom: body.nom } })
  await replaceReferentielLinks(indicateurId, referentielIds)
}

const createWithGrants = async ({
  publicId,
  body,
  principalId,
}: {
  publicId: string
  body: UpsertIndicateurBody
  principalId: string
}): Promise<void> => {
  const referentielIds = await resolveReferentielIds(body.referentielIds)
  const id = uuidv7()
  await db().indicateur.create({ data: { id, publicId, nom: body.nom } })
  await db().indicateurPermission.createMany({
    data: [
      { principalId, indicateurId: id, action: PermissionAction.READ },
      { principalId, indicateurId: id, action: PermissionAction.WRITE },
    ],
  })
  if (referentielIds.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: referentielIds.map((referentielId) => ({ indicateurId: id, referentielId })),
    })
  }
}

const performUpsert = async ({ publicId, body }: UpsertIndicateurParams): Promise<void> => {
  const principalId = requireCurrentPrincipalId()
  const existing = await db().indicateur.findUnique({ where: { publicId } })
  if (existing) {
    await updateExisting({ publicId, indicateurId: existing.id, body, principalId })
    return
  }
  await createWithGrants({ publicId, body, principalId })
}

export const upsertIndicateur = (params: UpsertIndicateurParams): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performUpsert(params))
```

Note : `performUpsert` peut désormais throw `ValidationError` ou `ForbiddenError`. Le pattern `ResultAsync.fromSafePromise` les laisse remonter en rejet de promesse, où le `errorHandler` Hono les mappera en 400/403. C'est cohérent avec le comportement actuel de `ForbiddenError` dans cette commande.

- [ ] **Step 4: Lancer les tests, ils doivent passer**

```bash
cd apps/mb-api && pnpm vitest run src/indicateur/commands/upsertIndicateur.test.ts
```

Expected: tous les tests verts.

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/indicateur/commands/upsertIndicateur.ts apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts
git commit -m "feat(mb-api): upsertIndicateur gère replace-all des référentiels liés"
```

---

### Task 6: `getIndicateurByPublicId` — inclure les `referentielIds`

**Files:**
- Modify: `apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.ts`
- Modify: `apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.test.ts`

- [ ] **Step 1: Étendre les tests pour vérifier `referentielIds`**

Modifier le 1er test du fichier (« retourne l'indicateur quand le principal a la permission READ ») pour inclure des liens et vérifier la sortie :

```ts
it(
  "retourne l'indicateur avec ses référentiels liés triés par publicId",
  integrationTest(async () => {
    const indId = testIndicateurId()
    const indicateur = await fixtures.indicateur({ publicId: indId, nom: 'Indicateur de test' })
    const [refA, refB] = await fixtures.referentiel(
      { publicId: 'REF-B' },
      { publicId: 'REF-A' },
    )
    await db().indicateurReferentiel.createMany({
      data: [
        { indicateurId: indicateur.id, referentielId: refA.id },
        { indicateurId: indicateur.id, referentielId: refB.id },
      ],
    })
    const apiKey = await fixtures.apiKey({
      permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
    })

    const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toEqual({
      id: indId,
      nom: 'Indicateur de test',
      referentielIds: ['REF-A', 'REF-B'],
      createdAt: indicateur.createdAt.toISOString(),
      updatedAt: indicateur.updatedAt.toISOString(),
    })
  }),
)
```

Ajouter un import `import { db } from '@/framework/persistence/dbStore'` en tête si absent.

Conserver les autres tests existants tels quels (ils peuvent ignorer `referentielIds` ou vérifier `[]`).

- [ ] **Step 2: Lancer les tests pour confirmer l'échec**

```bash
cd apps/mb-api && pnpm vitest run src/indicateur/queries/getIndicateurByPublicId.test.ts
```

Expected: échec — `toIndicateurApiModel` exige désormais un objet avec `referentiels[]`.

- [ ] **Step 3: Adapter la query pour inclure la jointure**

Remplacer le contenu de `getIndicateurByPublicId.ts` par :

```ts
import { type IndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndicateurApiModel } from '@/indicateur/utils'

export const getIndicateurByPublicId = (
  publicId: string,
): ResultAsync<IndicateurApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId }, principalId),
      include: {
        referentiels: {
          include: { referentiel: { select: { publicId: true } } },
        },
      },
    }),
  ).map(toIndicateurApiModel)
}
```

- [ ] **Step 4: Tests verts**

```bash
cd apps/mb-api && pnpm vitest run src/indicateur/queries/getIndicateurByPublicId.test.ts
```

Expected: vert.

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.ts apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.test.ts
git commit -m "feat(mb-api): getIndicateurByPublicId expose referentielIds"
```

---

### Task 7: `listIndicateurs` — inclure les `referentielIds`

**Files:**
- Modify: `apps/mb-api/src/indicateur/queries/listIndicateurs.ts`
- Modify: `apps/mb-api/src/indicateur/queries/listIndicateurs.test.ts`

- [ ] **Step 1: Ajouter un test qui vérifie la présence et le tri de `referentielIds` sur les items**

Ajouter ce test à la suite des tests existants dans `listIndicateurs.test.ts` :

```ts
it(
  'expose referentielIds triés par publicId ASC sur chaque item',
  integrationTest(async () => {
    const [accessible] = testIndicateurIds(1)
    const indicateur = await fixtures.indicateur({ publicId: accessible })
    const [refA, refB] = await fixtures.referentiel({ publicId: 'REF-Z' }, { publicId: 'REF-M' })
    await db().indicateurReferentiel.createMany({
      data: [
        { indicateurId: indicateur.id, referentielId: refA.id },
        { indicateurId: indicateur.id, referentielId: refB.id },
      ],
    })
    const apiKey = await fixtures.apiKey({
      permissions: [{ indicateur: { publicId: accessible }, action: 'READ' }],
    })

    const result = await runAsPrincipal(apiKey.id, () => listIndicateurs({}))

    const value = result._unsafeUnwrap()
    expect(value.items.find((i) => i.id === accessible)?.referentielIds).toEqual([
      'REF-M',
      'REF-Z',
    ])
  }),
)
```

Ajouter `import { db } from '@/framework/persistence/dbStore'` en haut si absent.

- [ ] **Step 2: Lancer les tests pour observer l'échec**

```bash
cd apps/mb-api && pnpm vitest run src/indicateur/queries/listIndicateurs.test.ts
```

Expected: échec sur le nouveau test (et possiblement les anciens, si `toIndicateurApiModel` attend `referentiels`).

- [ ] **Step 3: Étendre `listIndicateurs.ts` pour inclure la jointure**

Remplacer le `db().indicateur.findMany` par :

```ts
const fetchPage = db().indicateur.findMany({
  where,
  orderBy: { id: 'asc' },
  include: {
    referentiels: {
      include: { referentiel: { select: { publicId: true } } },
    },
  },
  ...buildPaginationArgs(params.cursor, params.pageSize),
})
```

- [ ] **Step 4: Tests verts**

```bash
cd apps/mb-api && pnpm vitest run src/indicateur/queries/listIndicateurs.test.ts
```

Expected: tous les tests verts.

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/indicateur/queries/listIndicateurs.ts apps/mb-api/src/indicateur/queries/listIndicateurs.test.ts
git commit -m "feat(mb-api): listIndicateurs expose referentielIds sur chaque item"
```

---

### Task 8: Nouvelle query `listReferentielsForIndicateur`

**Files:**
- Create: `apps/mb-api/src/indicateur/queries/listReferentielsForIndicateur.ts`
- Create: `apps/mb-api/src/indicateur/queries/listReferentielsForIndicateur.test.ts`

- [ ] **Step 1: Écrire le test**

```ts
import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { listReferentielsForIndicateur } from '@/indicateur/queries/listReferentielsForIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listReferentielsForIndicateur', () => {
  it(
    "lève une erreur quand l'indicateur n'existe pas ou n'est pas lisible",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      await expect(
        runAsPrincipal(apiKey.id, () => listReferentielsForIndicateur(testIndicateurId())),
      ).rejects.toThrow()
    }),
  )

  it(
    'retourne items: [] quand aucun référentiel n\'est lié',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listReferentielsForIndicateur(indId))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'retourne les ressources complètes triées par publicId ASC',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const indicateur = await fixtures.indicateur({ publicId: indId })
      const refA = await fixtures.referentiel({ publicId: 'REF-Z', nom: 'Z' })
      const refB = await fixtures.referentiel({
        publicId: 'REF-A',
        nom: 'A',
        description: 'desc A',
      })
      // un individu lié à REF-A pour vérifier nombreIndividus
      await fixtures.referentielIndividu({
        referentiel: { publicId: 'REF-A' },
        individu: { publicId: 'IND-TEST-1' },
      })
      await db().indicateurReferentiel.createMany({
        data: [
          { indicateurId: indicateur.id, referentielId: refA.id },
          { indicateurId: indicateur.id, referentielId: refB.id },
        ],
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listReferentielsForIndicateur(indId))

      const value = result._unsafeUnwrap()
      expect(value.items.map((r) => r.id)).toEqual(['REF-A', 'REF-Z'])
      expect(value.items[0]).toMatchObject({
        id: 'REF-A',
        nom: 'A',
        description: 'desc A',
        nombreIndividus: 1,
      })
      expect(value.items[1]).toMatchObject({ id: 'REF-Z', nom: 'Z', nombreIndividus: 0 })
    }),
  )
})
```

- [ ] **Step 2: Lancer les tests pour confirmer l'échec (fichier source inexistant)**

```bash
cd apps/mb-api && pnpm vitest run src/indicateur/queries/listReferentielsForIndicateur.test.ts
```

Expected: échec à l'import.

- [ ] **Step 3: Écrire la query**

```ts
import { type ReferentielApiModel } from '@pilote/mb-shared/referentiel'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toReferentielApiModel } from '@/referentiel/utils'

export const listReferentielsForIndicateur = (
  indicateurPublicId: string,
): ResultAsync<{ items: ReferentielApiModel[] }, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true },
    }),
  ).andThen((indicateur) =>
    ResultAsync.fromSafePromise(
      db().referentiel.findMany({
        where: { indicateurs: { some: { indicateurId: indicateur.id } } },
        orderBy: { publicId: 'asc' },
        include: { _count: { select: { individus: true } } },
      }),
    ).map((rows) => ({ items: rows.map(toReferentielApiModel) })),
  )
}
```

- [ ] **Step 4: Tests verts**

```bash
cd apps/mb-api && pnpm vitest run src/indicateur/queries/listReferentielsForIndicateur.test.ts
```

Expected: vert.

- [ ] **Step 5: Commit**

```bash
git add apps/mb-api/src/indicateur/queries/listReferentielsForIndicateur.ts apps/mb-api/src/indicateur/queries/listReferentielsForIndicateur.test.ts
git commit -m "feat(mb-api): query listReferentielsForIndicateur"
```

---

### Task 9: Schémas partagés — `ReferentielListApiModel` réutilisé pour l'endpoint dédié

**Files:**
- Modify: `packages/mb-shared/src/referentiel.ts` (déjà OK — pas de changement)

- [ ] **Step 1: Vérifier que `referentielApiModelSchema` couvre déjà la réponse (id, nom, description, nombreIndividus, createdAt, updatedAt). Pas d'édition nécessaire.**

Aucun commit pour cette tâche (no-op de vérification).

---

### Task 10: Route `GET /indicateurs/:id/referentiels` + body breaking sur `PUT /indicateurs/:id`

**Files:**
- Modify: `apps/mb-api/src/indicateur/routes.ts`

- [ ] **Step 1: Étendre `routes.ts` avec la nouvelle route et la nouvelle description du PUT**

Remplacer le contenu complet par :

```ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import {
  indicateurApiModelSchema,
  indicateurPublicIdSchema,
  listIndicateursQuerySchema,
  upsertIndicateurBodySchema,
} from '@pilote/mb-shared/indicateur'
import { createPaginatedApiListSchema } from '@pilote/mb-shared/pagination'
import { referentielApiModelSchema } from '@pilote/mb-shared/referentiel'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { listReferentielsForIndicateur } from '@/indicateur/queries/listReferentielsForIndicateur'

const IndicateurApiModelSchema = indicateurApiModelSchema.openapi('IndicateurApiModel')
const IndicateurListApiModelSchema =
  createPaginatedApiListSchema(indicateurApiModelSchema).openapi('IndicateurListApiModel')
const UpsertIndicateurBodySchema = upsertIndicateurBodySchema.openapi('UpsertIndicateurBody')
const ReferentielsForIndicateurApiModelSchema = z
  .object({ items: z.array(referentielApiModelSchema) })
  .openapi('ReferentielsForIndicateurApiModel')
export const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

// --- GET /indicateurs --------------------------------------------------------

const getIndicateursRoute = createRoute({
  method: 'get',
  path: '/indicateurs',
  tags: ['Indicateur'],
  summary: 'Lister les indicateurs',
  description:
    "Retourne la liste paginée des indicateurs avec un filtre de recherche par nom. La pagination est cursor-based : passez `cursor` (renvoyé dans la réponse précédente) pour obtenir la page suivante. `hasMore` indique s'il reste des pages. Chaque item inclut `referentielIds` (triés par identifiant public ASC).",
  middleware: [requireAuthentication],
  request: { query: listIndicateursQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurListApiModelSchema } },
      description: 'Liste paginée des indicateurs',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
  },
})

// --- GET /indicateurs/:id ----------------------------------------------------

const detailParamsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const getIndicateurByIdRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}',
  tags: ['Indicateur'],
  summary: 'Récupérer un indicateur par identifiant public',
  description:
    "Retourne un indicateur identifié par son identifiant public (format `IND-XXX`). La réponse inclut `referentielIds` (référentiels liés, triés par publicId ASC). Renvoie 404 (`ENTITY_NOT_FOUND`) si aucun indicateur ne correspond.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur trouvé',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Indicateur introuvable',
    },
  },
})

// --- PUT /indicateurs/:id ----------------------------------------------------

const upsertIndicateurRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}',
  tags: ['Indicateur'],
  summary: 'Créer ou remplacer un indicateur (nom + référentiels liés)',
  description:
    "Crée l'indicateur s'il n'existe pas, ou met à jour son `nom` si déjà présent. Le champ `referentielIds` est obligatoire et applique une sémantique replace-all : l'ensemble des liens devient strictement celui décrit dans le body (tableau vide pour aucun lien). Les doublons sont silencieusement dédupliqués. Si un `referentielId` n'existe pas, l'appel échoue avec 400 `VALIDATION_ERROR` et `details.unknownReferentielIds`. L'opération est atomique (transaction unique).",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertIndicateurBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur créé ou mis à jour',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Requête invalide (body ou référentiels inconnus)',
    },
  },
})

// --- GET /indicateurs/:id/referentiels --------------------------------------

const getReferentielsForIndicateurRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/referentiels',
  tags: ['Indicateur'],
  summary: "Lister les référentiels liés à un indicateur",
  description:
    "Retourne les ressources complètes des référentiels liés à l'indicateur, triées par identifiant public ASC. Réponse non paginée (le volume est borné par le nombre de référentiels liés à un indicateur).",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: ReferentielsForIndicateurApiModelSchema } },
      description: "Référentiels liés à l'indicateur (peut être vide)",
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Indicateur introuvable',
    },
  },
})

// --- App registration --------------------------------------------------------

export const indicateurRoutes = new OpenAPIHono()

indicateurRoutes.openapi(getIndicateursRoute, async (context) => {
  const { recherche, cursor, pageSize } = context.req.valid('query')

  return listIndicateurs({ recherche, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndicateurListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

indicateurRoutes.openapi(getIndicateurByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getIndicateurByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndicateurApiModelSchema,
        status: 200,
      }),
    never,
  )
})

indicateurRoutes.openapi(upsertIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () => {
    await upsertIndicateur({ publicId: id, body })
    return getIndicateurByPublicId(id)
  })

  return result.match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndicateurApiModelSchema,
        status: 200,
      }),
    never,
  )
})

indicateurRoutes.openapi(getReferentielsForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')

  return listReferentielsForIndicateur(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ReferentielsForIndicateurApiModelSchema,
        status: 200,
      }),
    never,
  )
})
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/mb-api && pnpm tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 3: Lancer toute la suite de tests pour s'assurer qu'on n'a rien cassé**

```bash
cd apps/mb-api && pnpm vitest run
```

Expected: tous verts. Si un test PUT en intégration HTTP existe ailleurs et ne fournit pas `referentielIds`, le rajouter à `[]` localement dans ce même commit.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-api/src/indicateur/routes.ts
git commit -m "feat(mb-api): GET /indicateurs/:id/referentiels + PUT body breaking (referentielIds requis)"
```

---

### Task 11: Seed — liaisons de démo

**Files:**
- Modify: `apps/mb-api/prisma/seed.ts`

- [ ] **Step 1: Ajouter une étape d'upsert des liaisons après l'upsert des `referentielIndividu`**

Insérer, après la boucle `for (const item of individusSeed)` qui upsert les `referentielIndividu` et **avant** la boucle `for (const item of relationsSeed)`, le bloc suivant :

```ts
const indicateurReferentielsSeed: ReadonlyArray<{
  indicateurPublicId: string
  referentielPublicIds: ReadonlyArray<string>
}> = [
  { indicateurPublicId: 'IND-001', referentielPublicIds: ['REF-DEPT'] },
  { indicateurPublicId: 'IND-002', referentielPublicIds: ['REF-DEPT', 'REF-REG'] },
  { indicateurPublicId: 'IND-003', referentielPublicIds: ['REF-REG'] },
  { indicateurPublicId: 'IND-004', referentielPublicIds: ['REF-DEPT'] },
  { indicateurPublicId: 'IND-005', referentielPublicIds: ['REF-REG'] },
]

for (const item of indicateurReferentielsSeed) {
  const indicateur = await prisma.indicateur.findUniqueOrThrow({
    where: { publicId: item.indicateurPublicId },
    select: { id: true },
  })
  for (const referentielPublicId of item.referentielPublicIds) {
    const referentiel = await prisma.referentiel.findUniqueOrThrow({
      where: { publicId: referentielPublicId },
      select: { id: true },
    })
    await prisma.indicateurReferentiel.upsert({
      where: {
        indicateurId_referentielId: {
          indicateurId: indicateur.id,
          referentielId: referentiel.id,
        },
      },
      update: {},
      create: { indicateurId: indicateur.id, referentielId: referentiel.id },
    })
  }
}
```

(Ajuster les `referentielPublicIds` aux valeurs réelles présentes dans `referentielsSeed` si elles diffèrent — consulter `apps/mb-api/prisma/seedData/geo.ts`.)

- [ ] **Step 2: Étendre le log de fin de seed pour mentionner les liaisons**

Modifier la ligne `Seed terminé : ...` pour inclure `indicateurReferentielsSeed.reduce((acc, item) => acc + item.referentielPublicIds.length, 0)` liaisons.

- [ ] **Step 3: Exécuter le seed sur l'environnement local pour vérification**

```bash
cd apps/mb-api && pnpm prisma db seed
```

Expected: le log final mentionne le nouveau total de liaisons.

- [ ] **Step 4: Commit**

```bash
git add apps/mb-api/prisma/seed.ts
git commit -m "chore(mb-api): seed des liaisons Indicateur ↔ Référentiels"
```

---

### Task 12: Validation finale + lint

**Files:** aucune édition prévue.

- [ ] **Step 1: Lancer le lint global (consigne mémoire : toujours avant commit, ici en filet final)**

```bash
pnpm lint
```

Expected: pas d'erreur. Fix au cas par cas si une règle remonte sur les fichiers modifiés.

- [ ] **Step 2: Lancer la suite de tests `mb-api` complète**

```bash
cd apps/mb-api && pnpm vitest run
```

Expected: tous verts.

- [ ] **Step 3: Lancer le typecheck strict**

```bash
cd apps/mb-api && pnpm tsc --noEmit && pnpm --filter @pilote/mb-shared tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 4: Si des lints/tests ont nécessité un fix, commit**

```bash
git add -A
git commit -m "chore(mb-api): fix lint/types après intégration liaison Indicateur ↔ Référentiels"
```

(Si rien à committer, sauter cette étape.)
