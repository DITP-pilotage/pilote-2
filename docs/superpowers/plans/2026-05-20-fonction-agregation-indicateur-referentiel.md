# Fonction d'agrégation Indicateur–Référentiel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre explicite et configurable la fonction d'agrégation utilisée lors du calcul de la valeur dérivée d'un indicateur sur un référentiel donné, en l'attachant au lien `IndicateurReferentiel`.

**Architecture :** Ajout d'une enum Prisma `FonctionAgregation { SUM, NONE }` portée par une nouvelle colonne NOT NULL `fonctionAgregation` sur `IndicateurReferentiel`. Le body de `PUT /indicateurs/{id}` change : `referentielIds: string[]` → `referentiels: Array<{ referentielId, fonctionAgregation }>` (idem en sortie). `getValeurDerivee` lookup obligatoirement le lien `(indicateurId, individu.referentielId)` et retourne 400 si le lien est absent ou si la fonction vaut `NONE`. Reset de la DB de dev.

**Tech Stack :** Prisma (PostgreSQL), Hono + zod-openapi, Zod, Vitest (intégration), neverthrow, TypeScript ESM.

**Spec source :** `docs/superpowers/specs/2026-05-20-fonction-agregation-indicateur-referentiel-design.md`

---

## File Structure

**Modifications (existants) :**

- `apps/mb-api/prisma/schema.prisma` — ajout enum + colonne
- `apps/mb-api/prisma/seed.ts` — mix `SUM`/`NONE` dans `indicateurReferentielsSeed`
- `apps/mb-api/src/test/fixtures.ts` — fixture `indicateurReferentiel` accepte `fonctionAgregation` (défaut `SUM`)
- `packages/mb-shared/src/indicateur.ts` — schémas Zod (`fonctionAgregationSchema`, `indicateurReferentielLinkSchema`, body PUT, model)
- `packages/mb-shared/src/valeurAvancement.ts` — `valeurDeriveeApiModelSchema.agregateur` → `fonctionAgregation`
- `apps/mb-api/src/indicateur/utils.ts` — `toIndicateurApiModel` renvoie `referentiels: [...]`
- `apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.ts` — adapter l'`include`
- `apps/mb-api/src/indicateur/queries/listIndicateurs.ts` — adapter l'`include`
- `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts` — nouveau flux replace/add/update sur les liens
- `apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts` — adapter le body + ajouter cas update fonction
- `apps/mb-api/src/valeurAvancement/queries/getValeurDerivee.ts` — lookup du lien + branches 400 + champ `fonctionAgregation` en sortie
- `apps/mb-api/src/valeurAvancement/queries/getValeurDerivee.test.ts` — créer le lien dans chaque test SUM + ajouter cas 400
- `apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.test.ts` — adapter format sortie
- `apps/mb-api/src/indicateur/queries/listIndicateurs.test.ts` — adapter format sortie

**Création (migration auto-générée par Prisma) :**

- `apps/mb-api/prisma/migrations/<timestamp>_add_fonction_agregation_indicateur_referentiel/migration.sql`

---

## Task 1 — Schéma Prisma + Seed + Migration (groupés)

> **Ordre obligatoire :** schéma + seed doivent être édités **avant** `prisma migrate dev`, car la commande exécute le seed après avoir appliqué la migration. Si le seed n'utilise pas la nouvelle colonne, l'insertion échoue (NOT NULL sans default).

**Files:**
- Modify: `apps/mb-api/prisma/schema.prisma:55-89`
- Modify: `apps/mb-api/prisma/seed.ts:122-160`

- [ ] **Step 1 : Ajouter l'enum `FonctionAgregation` et la colonne sur `IndicateurReferentiel`**

Dans `apps/mb-api/prisma/schema.prisma`, remplacer le bloc `model IndicateurReferentiel { ... }` (lignes ~66-77) et ajouter l'enum juste au-dessus de `enum PermissionAction` :

```prisma
enum FonctionAgregation {
  SUM
  NONE

  @@map("fonction_agregation_enum")
}

model IndicateurReferentiel {
  indicateurId       String             @map("indicateur_id")  @db.Uuid
  referentielId      String             @map("referentiel_id") @db.Uuid
  fonctionAgregation FonctionAgregation @map("fonction_agregation")
  createdAt          DateTime           @default(now())        @map("created_at")

  indicateur  Indicateur  @relation(fields: [indicateurId],  references: [id], onDelete: Cascade)
  referentiel Referentiel @relation(fields: [referentielId], references: [id], onDelete: Cascade)

  @@id([indicateurId, referentielId])
  @@index([referentielId])
  @@map("indicateur_referentiel")
}
```

- [ ] **Step 2 : Mettre à jour `indicateurReferentielsSeed` avec la fonction par lien**

Dans `apps/mb-api/prisma/seed.ts`, remplacer la déclaration `indicateurReferentielsSeed` et la boucle qui l'utilise :

```ts
const indicateurReferentielsSeed: ReadonlyArray<{
  indicateurPublicId: string
  liens: ReadonlyArray<{ referentielPublicId: string; fonctionAgregation: 'SUM' | 'NONE' }>
}> = [
  {
    indicateurPublicId: 'IND-001',
    liens: [
      { referentielPublicId: 'REF-DEPT', fonctionAgregation: 'NONE' },
      { referentielPublicId: 'REF-NAT', fonctionAgregation: 'NONE' },
    ],
  },
  {
    indicateurPublicId: 'IND-002',
    liens: [
      { referentielPublicId: 'REF-DEPT', fonctionAgregation: 'SUM' },
      { referentielPublicId: 'REF-REG', fonctionAgregation: 'SUM' },
    ],
  },
  {
    indicateurPublicId: 'IND-003',
    liens: [
      { referentielPublicId: 'REF-REG', fonctionAgregation: 'NONE' },
      { referentielPublicId: 'REF-DEPT', fonctionAgregation: 'NONE' },
    ],
  },
  {
    indicateurPublicId: 'IND-004',
    liens: [{ referentielPublicId: 'REF-DEPT', fonctionAgregation: 'NONE' }],
  },
  {
    indicateurPublicId: 'IND-005',
    liens: [
      { referentielPublicId: 'REF-REG', fonctionAgregation: 'SUM' },
      { referentielPublicId: 'REF-NAT', fonctionAgregation: 'SUM' },
    ],
  },
  {
    indicateurPublicId: 'IND-006',
    liens: [{ referentielPublicId: 'REF-EMPTY', fonctionAgregation: 'NONE' }],
  },
  {
    indicateurPublicId: 'IND-007',
    liens: [{ referentielPublicId: 'REF-EMPTY', fonctionAgregation: 'NONE' }],
  },
  {
    indicateurPublicId: 'IND-008',
    liens: [{ referentielPublicId: 'REF-EMPTY', fonctionAgregation: 'NONE' }],
  },
]

for (const item of indicateurReferentielsSeed) {
  const indicateur = await prisma.indicateur.findUniqueOrThrow({
    where: { publicId: item.indicateurPublicId },
    select: { id: true },
  })
  for (const lien of item.liens) {
    const referentiel = await prisma.referentiel.findUniqueOrThrow({
      where: { publicId: lien.referentielPublicId },
      select: { id: true },
    })
    await prisma.indicateurReferentiel.upsert({
      where: {
        indicateurId_referentielId: {
          indicateurId: indicateur.id,
          referentielId: referentiel.id,
        },
      },
      update: { fonctionAgregation: lien.fonctionAgregation },
      create: {
        indicateurId: indicateur.id,
        referentielId: referentiel.id,
        fonctionAgregation: lien.fonctionAgregation,
      },
    })
  }
}

const liaisonsCount = indicateurReferentielsSeed.reduce(
  (acc, item) => acc + item.liens.length,
  0,
)
```

- [ ] **Step 3 : Reset + apply migration + seed**

```bash
pnpm --filter @pilote/mb-api exec prisma migrate dev --name add_fonction_agregation_indicateur_referentiel
```

Quand Prisma demande à reset la DB (NOT NULL sans default), accepter avec **Yes**. La commande va :
- créer le dossier `apps/mb-api/prisma/migrations/<timestamp>_add_fonction_agregation_indicateur_referentiel/migration.sql`
- regénérer le client Prisma (le seed peut désormais utiliser la colonne `fonctionAgregation`)
- exécuter le seed

Expected : sortie `Seed terminé : 45 indicateurs, … 12 liaisons indicateur-référentiel, …`.

- [ ] **Step 4 : Vérifier le SQL généré**

Lire le fichier `migration.sql` créé pour confirmer :
- `CREATE TYPE "fonction_agregation_enum" AS ENUM ('SUM', 'NONE')`
- `ALTER TABLE "indicateur_referentiel" ADD COLUMN "fonction_agregation" "fonction_agregation_enum" NOT NULL`

---

## Task 2 — Fixture `indicateurReferentiel` : accepter `fonctionAgregation`

> Cette task vient **après** Task 1 car elle importe `FonctionAgregation` depuis le client Prisma régénéré.

**Files:**
- Modify: `apps/mb-api/src/test/fixtures.ts:161-198`

- [ ] **Step 1 : Ajouter `fonctionAgregation` au type d'overrides (défaut `SUM`)**

Dans `apps/mb-api/src/test/fixtures.ts`, modifier la section `IndicateurReferentiel` :

```ts
type IndicateurReferentielOverrides = {
  indicateur: IndicateurOverrides
  referentiel: ReferentielOverrides
  fonctionAgregation?: FonctionAgregation
}

const upsertIndicateurReferentiel = async (o: IndicateurReferentielOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const referentielRow = await upsertReferentiel(o.referentiel)
  const fonctionAgregation = o.fonctionAgregation ?? 'SUM'
  return db().indicateurReferentiel.upsert({
    where: {
      indicateurId_referentielId: {
        indicateurId: indicateurRow.id,
        referentielId: referentielRow.id,
      },
    },
    update: { fonctionAgregation },
    create: {
      indicateurId: indicateurRow.id,
      referentielId: referentielRow.id,
      fonctionAgregation,
    },
  })
}
```

Le `PermissionAction` était déjà importé depuis `@/generated/prisma/enums` (ligne 24). Ajouter `FonctionAgregation` à cet import existant :

```ts
import { PermissionAction, type FonctionAgregation } from '@/generated/prisma/enums'
```

- [ ] **Step 2 : Lancer le typecheck pour valider**

```bash
pnpm --filter @pilote/mb-api exec tsc --noEmit
```

Expected : exit 0 (modulo erreurs dans les fichiers à venir comme `upsertIndicateur.ts` qui réfère encore `referentielIds` ; à ce stade on peut tolérer car on les modifie aux Tasks suivantes).

- [ ] **Step 3 : Commit schéma + seed + migration + fixture**

```bash
pnpm --filter @pilote/mb-api lint
```

Si le lint passe (peut échouer à cause des fichiers downstream non encore modifiés — dans ce cas, on commit sans lint global et on relancera à la fin) :

```bash
git add apps/mb-api/prisma/schema.prisma \
        apps/mb-api/prisma/seed.ts \
        apps/mb-api/prisma/migrations \
        apps/mb-api/src/test/fixtures.ts
git commit -m "feat(mb-api): ajout enum FonctionAgregation sur IndicateurReferentiel + seed"
```

Si le lint échoue à cause de `upsertIndicateur.ts` (référence à `referentielIds`), commiter sans `pnpm lint` ici et relancer le lint après Task 7. Le lint global obligatoire est à Task 11.

Note : le client Prisma régénéré (`apps/mb-api/src/generated/prisma/**`) est probablement gitignored — vérifier avec `git status` avant le commit, ne pas l'add manuellement.

---

## Task 3 — Schémas Zod partagés (mb-shared/indicateur.ts)

**Files:**
- Modify: `packages/mb-shared/src/indicateur.ts`

- [ ] **Step 1 : Remplacer les schémas `indicateurApiModelSchema` et `upsertIndicateurBodySchema`**

Réécrire entièrement `packages/mb-shared/src/indicateur.ts` :

```ts
import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { referentielPublicIdSchema } from './publicIds'

export const indicateurPublicIdSchema = z
  .string()
  .regex(/^IND-\d+$/, 'Identifiant public attendu au format IND-XXX')
  .describe("Identifiant public de l'indicateur (format IND-XXX).")

export const fonctionAgregationSchema = z
  .enum(['SUM', 'NONE'])
  .describe(
    "Fonction d'agrégation appliquée pour dériver la valeur d'un parent depuis ses enfants. " +
      "`SUM` = somme des contributions ; `NONE` = indicateur non dérivable pour ce référentiel.",
  )
export type FonctionAgregation = z.infer<typeof fonctionAgregationSchema>

export const indicateurReferentielLinkSchema = z
  .object({
    referentielId: referentielPublicIdSchema,
    fonctionAgregation: fonctionAgregationSchema,
  })
  .describe("Lien indicateur-référentiel avec sa fonction d'agrégation.")
export type IndicateurReferentielLink = z.infer<typeof indicateurReferentielLinkSchema>

export const indicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'indicateur."),
  referentiels: z
    .array(indicateurReferentielLinkSchema)
    .describe(
      "Liens vers les référentiels associés, triés par `referentielId` ASC. Tableau vide si aucun lien.",
    ),
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
  referentiels: z
    .array(indicateurReferentielLinkSchema)
    .describe(
      'Liste complète des liens à appliquer (replace-all à chaque PUT). Tableau vide pour aucun lien. ' +
        "Doublons silencieusement dédupliqués sur `referentielId` ; en cas de fonctions différentes, la dernière occurrence l'emporte.",
    ),
})
export type UpsertIndicateurBody = z.infer<typeof upsertIndicateurBodySchema>
```

- [ ] **Step 2 : Mettre à jour `valeurDeriveeApiModelSchema` dans mb-shared/valeurAvancement.ts**

Dans `packages/mb-shared/src/valeurAvancement.ts`, importer le nouveau schéma et remplacer le champ `agregateur` :

Au début du fichier, ajouter à l'import existant `from './indicateur'` :

```ts
import { fonctionAgregationSchema, indicateurPublicIdSchema } from './indicateur'
```

Remplacer le bloc `valeurDeriveeApiModelSchema` (lignes ~273-289) :

```ts
export const valeurDeriveeApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  fonctionAgregation: fonctionAgregationSchema.describe(
    "Fonction d'agrégation appliquée pour ce couple (indicateur, référentiel de l'individu). " +
      "Toujours `SUM` quand le calcul a abouti ; un retour 400 est renvoyé si la fonction vaut `NONE`.",
  ),
  valeurDerivee: z
    .number()
    .nullable()
    .describe(
      "Résultat de l'agrégation appliquée aux valeurs retenues parmi les enfants directs. null si aucun enfant n'a de valeur.",
    ),
  contributions: z
    .array(contributionApiModelSchema)
    .describe(
      "Une entrée par enfant direct du parent, dans l'ordre des publicId. Permet le drill-down et l'audit du calcul.",
    ),
  couverture: couvertureApiModelSchema,
})
export type ValeurDeriveeApiModel = z.infer<typeof valeurDeriveeApiModelSchema>
```

- [ ] **Step 3 : Lint mb-shared + commit**

```bash
pnpm --filter @pilote/mb-shared lint
git add packages/mb-shared/src/indicateur.ts packages/mb-shared/src/valeurAvancement.ts
git commit -m "feat(mb-shared): schéma fonctionAgregation sur lien indicateur-référentiel"
```

---

## Task 4 — Mapper `toIndicateurApiModel` (utils.ts)

**Files:**
- Modify: `apps/mb-api/src/indicateur/utils.ts`

- [ ] **Step 1 : Réécrire le mapper avec la nouvelle forme**

Remplacer entièrement `apps/mb-api/src/indicateur/utils.ts` :

```ts
import { type IndicateurApiModel } from '@pilote/mb-shared/indicateur'

import { type FonctionAgregation } from '@/generated/prisma/enums'
import { type IndicateurModel, type ReferentielModel } from '@/generated/prisma/models'

export type IndicateurWithReferentiels = IndicateurModel & {
  referentiels: Array<{
    fonctionAgregation: FonctionAgregation
    referentiel: Pick<ReferentielModel, 'publicId'>
  }>
}

export const toIndicateurApiModel = (
  indicateur: IndicateurWithReferentiels,
): IndicateurApiModel => ({
  id: indicateur.publicId,
  nom: indicateur.nom,
  referentiels: indicateur.referentiels
    .map((link) => ({
      referentielId: link.referentiel.publicId,
      fonctionAgregation: link.fonctionAgregation,
    }))
    .sort((a, b) => a.referentielId.localeCompare(b.referentielId)),
  createdAt: indicateur.createdAt.toISOString(),
  updatedAt: indicateur.updatedAt.toISOString(),
})
```

---

## Task 5 — Adapter les queries `get` / `list` indicateur (include de la fonction)

**Files:**
- Modify: `apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.ts`
- Modify: `apps/mb-api/src/indicateur/queries/listIndicateurs.ts`

- [ ] **Step 1 : Étendre l'`include` dans `getIndicateurByPublicId.ts`**

Remplacer le bloc `include` (lignes ~16-20) :

```ts
include: {
  referentiels: {
    select: {
      fonctionAgregation: true,
      referentiel: { select: { publicId: true } },
    },
  },
},
```

- [ ] **Step 2 : Idem dans `listIndicateurs.ts`**

Remplacer le bloc `include` correspondant :

```ts
include: {
  referentiels: {
    select: {
      fonctionAgregation: true,
      referentiel: { select: { publicId: true } },
    },
  },
},
```

- [ ] **Step 3 : Lancer le typecheck pour confirmer**

```bash
pnpm --filter @pilote/mb-api exec tsc --noEmit
```

Expected : exit 0 (ou seulement des erreurs dans des fichiers à modifier dans les tasks suivantes, notamment `upsertIndicateur.ts`).

---

## Task 6 — Adapter les tests `getIndicateurByPublicId` et `listIndicateurs`

**Files:**
- Modify: `apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.test.ts`
- Modify: `apps/mb-api/src/indicateur/queries/listIndicateurs.test.ts`

- [ ] **Step 1 : Run les tests pour voir ce qui casse**

```bash
pnpm --filter @pilote/mb-api test -- src/indicateur/queries/
```

Expected : échecs sur les assertions comparant `referentielIds` (n'existe plus dans la sortie) ou sur les fixtures qui créent un lien `indicateurReferentiel` sans fonction.

- [ ] **Step 2 : Remplacer les assertions `referentielIds` par `referentiels`**

Dans chaque test qui assert sur la sortie de `getIndicateurByPublicId` ou `listIndicateurs`, remplacer :

```ts
// Avant
expect(data.referentielIds).toEqual(['REF-A', 'REF-B'])
```

par :

```ts
// Après
expect(data.referentiels).toEqual([
  { referentielId: 'REF-A', fonctionAgregation: 'SUM' },
  { referentielId: 'REF-B', fonctionAgregation: 'SUM' },
])
```

(`SUM` est la valeur par défaut du fixture `indicateurReferentiel` modifié en Task 2.)

Adapter de même tous les tests qui consultent la liste des référentiels d'un indicateur dans ces deux fichiers.

- [ ] **Step 3 : Run et valider**

```bash
pnpm --filter @pilote/mb-api test -- src/indicateur/queries/
```

Expected : tous les tests verts.

- [ ] **Step 4 : Commit**

```bash
pnpm --filter @pilote/mb-api lint
git add apps/mb-api/src/indicateur/utils.ts \
        apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.ts \
        apps/mb-api/src/indicateur/queries/listIndicateurs.ts \
        apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.test.ts \
        apps/mb-api/src/indicateur/queries/listIndicateurs.test.ts
git commit -m "feat(mb-api): exposer fonctionAgregation dans les queries indicateur"
```

---

## Task 7 — Réécriture de `upsertIndicateur` (replace/add/update)

**Files:**
- Modify: `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts`

- [ ] **Step 1 : Remplacer `resolveReferentielIds` par `resolveReferentielLinks`**

Dans `apps/mb-api/src/indicateur/commands/upsertIndicateur.ts`, remplacer :

```ts
import { type IndicateurReferentielLink, type UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type FonctionAgregation, PermissionAction } from '@/generated/prisma/enums'

type UpsertIndicateurParams = {
  publicId: string
  body: UpsertIndicateurBody
}

type ResolvedLink = { referentielId: string; fonctionAgregation: FonctionAgregation }

const resolveReferentielLinks = async (
  links: ReadonlyArray<IndicateurReferentielLink>,
): Promise<ResolvedLink[]> => {
  // Dédup sur referentielId : la dernière occurrence l'emporte.
  const dedupedByPublicId = new Map<string, FonctionAgregation>()
  for (const link of links) {
    dedupedByPublicId.set(link.referentielId, link.fonctionAgregation)
  }
  const publicIds = [...dedupedByPublicId.keys()]
  if (publicIds.length === 0) return []

  const found = await db().referentiel.findMany({
    where: { publicId: { in: publicIds } },
    select: { id: true, publicId: true },
  })
  const foundPublicIds = new Set(found.map((r) => r.publicId))
  const unknownIds = publicIds.filter((id) => !foundPublicIds.has(id))
  if (unknownIds.length > 0) {
    throw new ValidationError('Référentiels inconnus', {
      unknownReferentielIds: unknownIds.sort(),
    })
  }
  return found.map((r) => ({
    referentielId: r.id,
    fonctionAgregation: dedupedByPublicId.get(r.publicId)!,
  }))
}
```

- [ ] **Step 2 : Réécrire `replaceReferentielLinks` (3 sets : add / remove / update)**

Remplacer la fonction `replaceReferentielLinks` et supprimer l'import désormais inutile `diff` :

```ts
const replaceReferentielLinks = async (
  indicateurId: string,
  links: ResolvedLink[],
): Promise<void> => {
  const existing = await db().indicateurReferentiel.findMany({
    where: { indicateurId },
    select: { referentielId: true, fonctionAgregation: true },
  })
  const existingByReferentielId = new Map(
    existing.map((row) => [row.referentielId, row.fonctionAgregation]),
  )
  const targetReferentielIds = new Set(links.map((l) => l.referentielId))

  const toRemove = existing
    .filter((row) => !targetReferentielIds.has(row.referentielId))
    .map((row) => row.referentielId)

  const toAdd: ResolvedLink[] = []
  const toUpdate: ResolvedLink[] = []
  for (const link of links) {
    const existingFonction = existingByReferentielId.get(link.referentielId)
    if (existingFonction === undefined) {
      toAdd.push(link)
    } else if (existingFonction !== link.fonctionAgregation) {
      toUpdate.push(link)
    }
  }

  if (toRemove.length > 0) {
    await db().indicateurReferentiel.deleteMany({
      where: { indicateurId, referentielId: { in: toRemove } },
    })
  }
  if (toAdd.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: toAdd.map((link) => ({
        indicateurId,
        referentielId: link.referentielId,
        fonctionAgregation: link.fonctionAgregation,
      })),
    })
  }
  for (const link of toUpdate) {
    await db().indicateurReferentiel.update({
      where: {
        indicateurId_referentielId: {
          indicateurId,
          referentielId: link.referentielId,
        },
      },
      data: { fonctionAgregation: link.fonctionAgregation },
    })
  }
}
```

- [ ] **Step 3 : Adapter `updateExisting` et `createWithGrants`**

Remplacer les deux fonctions :

```ts
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
  const links = await resolveReferentielLinks(body.referentiels)
  await db().indicateur.update({ where: { publicId }, data: { nom: body.nom } })
  await replaceReferentielLinks(indicateurId, links)
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
  const links = await resolveReferentielLinks(body.referentiels)
  const id = uuidv7()
  await db().indicateur.create({ data: { id, publicId, nom: body.nom } })
  await db().indicateurPermission.createMany({
    data: [
      { principalId, indicateurId: id, action: PermissionAction.READ },
      { principalId, indicateurId: id, action: PermissionAction.WRITE },
    ],
  })
  if (links.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: links.map((link) => ({
        indicateurId: id,
        referentielId: link.referentielId,
        fonctionAgregation: link.fonctionAgregation,
      })),
    })
  }
}
```

- [ ] **Step 4 : Supprimer l'import inutilisé `diff`**

Retirer la ligne `import { diff } from '@/framework/collections/diff'` en tête de fichier (n'est plus utilisée).

---

## Task 8 — Adapter les tests `upsertIndicateur`

**Files:**
- Modify: `apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts`

- [ ] **Step 1 : Adapter `getReferentielPublicIds` helper pour exposer aussi la fonction**

En haut du fichier, remplacer le helper :

```ts
const getReferentielLinks = async (publicId: string) => {
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId },
    include: {
      referentiels: {
        select: {
          fonctionAgregation: true,
          referentiel: { select: { publicId: true } },
        },
      },
    },
  })
  return indicateur.referentiels
    .map((link) => ({
      referentielId: link.referentiel.publicId,
      fonctionAgregation: link.fonctionAgregation,
    }))
    .sort((a, b) => a.referentielId.localeCompare(b.referentielId))
}
```

- [ ] **Step 2 : Mettre à jour les 5 cas existants**

Mettre à jour chaque appel à `upsertIndicateur({ body: { ..., referentielIds: [...] }})` pour utiliser `referentiels: [{ referentielId, fonctionAgregation }, ...]`. Exemple complet pour le premier cas (« crée un indicateur… ») :

```ts
const result = await runAsPrincipal(apiKey.id, () =>
  upsertIndicateur({
    publicId: indId,
    body: {
      nom: 'Nouvel indicateur',
      referentiels: [
        { referentielId: refA.publicId, fonctionAgregation: 'SUM' },
        { referentielId: refB.publicId, fonctionAgregation: 'NONE' },
      ],
    },
  }),
)

expect(result.isOk()).toBe(true)
expect(await getReferentielLinks(indId)).toEqual([
  { referentielId: 'REF-CREATE-A', fonctionAgregation: 'SUM' },
  { referentielId: 'REF-CREATE-B', fonctionAgregation: 'NONE' },
])
```

Pour les autres cas :

- **« remplace l'ensemble des liens… »** : utiliser `SUM` partout dans les deux PUT, assert sur la nouvelle forme.
- **« accepte un tableau vide »** : 1er PUT avec `[{ referentielId: 'REF-EMPTY-A', fonctionAgregation: 'SUM' }]`, 2e PUT avec `referentiels: []`.
- **« dédoublonne silencieusement les referentielIds en double »** : passer deux entrées avec le même `referentielId` et la même `fonctionAgregation`, assert sur la liste finale dédupliquée.
- **« rejette quand un referentielId est inconnu »** : mêmes IDs qu'avant, chacun avec `fonctionAgregation: 'SUM'`.
- **« rejette la mise à jour sans permission WRITE »** : body avec `referentiels: []`.

- [ ] **Step 3 : Ajouter un test pour le cas « update de la fonctionAgregation »**

Ajouter ce nouveau cas à la fin du `describe.concurrent` :

```ts
it(
  'met à jour la fonctionAgregation pour un lien existant',
  integrationTest(async () => {
    const indId = testIndicateurId()
    await fixtures.referentiel({ publicId: 'REF-UPDATE-A' })
    const apiKey = await fixtures.apiKey()

    await runAsPrincipal(apiKey.id, () =>
      upsertIndicateur({
        publicId: indId,
        body: {
          nom: 'I',
          referentiels: [{ referentielId: 'REF-UPDATE-A', fonctionAgregation: 'SUM' }],
        },
      }),
    )

    await runAsPrincipal(apiKey.id, () =>
      upsertIndicateur({
        publicId: indId,
        body: {
          nom: 'I',
          referentiels: [{ referentielId: 'REF-UPDATE-A', fonctionAgregation: 'NONE' }],
        },
      }),
    )

    expect(await getReferentielLinks(indId)).toEqual([
      { referentielId: 'REF-UPDATE-A', fonctionAgregation: 'NONE' },
    ])
  }),
)
```

- [ ] **Step 4 : Ajouter un test pour la dédup « last wins » sur fonctions différentes**

```ts
it(
  "dédoublonne sur referentielId : en cas de fonctions différentes, la dernière l'emporte",
  integrationTest(async () => {
    const indId = testIndicateurId()
    await fixtures.referentiel({ publicId: 'REF-DEDUP-FN' })
    const apiKey = await fixtures.apiKey()

    const result = await runAsPrincipal(apiKey.id, () =>
      upsertIndicateur({
        publicId: indId,
        body: {
          nom: 'I',
          referentiels: [
            { referentielId: 'REF-DEDUP-FN', fonctionAgregation: 'SUM' },
            { referentielId: 'REF-DEDUP-FN', fonctionAgregation: 'NONE' },
          ],
        },
      }),
    )

    expect(result.isOk()).toBe(true)
    expect(await getReferentielLinks(indId)).toEqual([
      { referentielId: 'REF-DEDUP-FN', fonctionAgregation: 'NONE' },
    ])
  }),
)
```

- [ ] **Step 5 : Run et valider**

```bash
pnpm --filter @pilote/mb-api test -- src/indicateur/commands/upsertIndicateur.test.ts
```

Expected : tous les tests verts (7 cas).

- [ ] **Step 6 : Lint + commit**

```bash
pnpm --filter @pilote/mb-api lint
git add apps/mb-api/src/indicateur/commands/upsertIndicateur.ts \
        apps/mb-api/src/indicateur/commands/upsertIndicateur.test.ts
git commit -m "feat(mb-api): upsertIndicateur gère la fonctionAgregation par lien"
```

---

## Task 9 — `getValeurDerivee` : lookup obligatoire + branches 400

**Files:**
- Modify: `apps/mb-api/src/valeurAvancement/queries/getValeurDerivee.ts`

- [ ] **Step 1 : Mettre à jour `buildResult`**

Remplacer entièrement le contenu de `apps/mb-api/src/valeurAvancement/queries/getValeurDerivee.ts` :

```ts
import { type ValeurDeriveeApiModel } from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { getDernieresValeursPourIndividus } from '@/generated/prisma/sql'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import {
  type IndividuRef,
  resolveValeurDerivee,
  type ValeurSaisie,
} from '@/valeurAvancement/resolveValeurDerivee'

const loadIndividuTree = async (
  rootIndividuId: string,
): Promise<{
  allIds: string[]
  enfantsParParent: Map<string, IndividuRef[]>
}> => {
  const allIds: string[] = [rootIndividuId]
  const enfantsParParent = new Map<string, IndividuRef[]>()
  let currentLevel: string[] = [rootIndividuId]

  while (currentLevel.length > 0) {
    const relations = await db().relation.findMany({
      where: { parentId: { in: currentLevel } },
      include: { child: true },
    })
    if (relations.length === 0) break

    for (const relation of relations) {
      const list = enfantsParParent.get(relation.parentId) ?? []
      list.push({ id: relation.child.id, publicId: relation.child.publicId })
      enfantsParParent.set(relation.parentId, list)
    }

    const nextLevel = relations.map((relation) => relation.child.id)
    allIds.push(...nextLevel)
    currentLevel = nextLevel
  }

  return { allIds, enfantsParParent }
}

const buildResult = async (
  indicateurPublicId: string,
  individuPublicId: string,
): Promise<ValeurDeriveeApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
  })

  const cible = await db().individu.findUniqueOrThrow({
    where: { publicId: individuPublicId },
  })

  const lien = await db().indicateurReferentiel.findUnique({
    where: {
      indicateurId_referentielId: {
        indicateurId: indicateur.id,
        referentielId: cible.referentielId,
      },
    },
    select: { fonctionAgregation: true },
  })

  if (!lien) {
    throw new ValidationError(
      "L'indicateur n'est pas configuré pour le référentiel de cet individu",
      { indicateur: indicateur.publicId, individu: cible.publicId },
    )
  }

  if (lien.fonctionAgregation === 'NONE') {
    throw new ValidationError(
      "Cet indicateur n'est pas dérivable pour ce référentiel (fonction d'agrégation NONE)",
      { indicateur: indicateur.publicId, individu: cible.publicId },
    )
  }

  const { allIds, enfantsParParent } = await loadIndividuTree(cible.id)

  const rows = await db().$queryRawTyped(getDernieresValeursPourIndividus(indicateur.id, allIds))

  const derniereValeurParIndividu = new Map<string, ValeurSaisie>()
  for (const row of rows) {
    derniereValeurParIndividu.set(row.individuId, {
      valeur: row.valeur,
      date: row.date,
    })
  }

  const { valeurDerivee, contributions, couverture } = resolveValeurDerivee(cible.id, {
    enfantsParParent,
    derniereValeurParIndividu,
  })

  return {
    indicateur: indicateur.publicId,
    individu: cible.publicId,
    fonctionAgregation: lien.fonctionAgregation,
    valeurDerivee,
    contributions,
    couverture,
  }
}

export const getValeurDerivee = (
  indicateurPublicId: string,
  individuPublicId: string,
): ResultAsync<ValeurDeriveeApiModel, never> =>
  ResultAsync.fromSafePromise(buildResult(indicateurPublicId, individuPublicId))
```

Note : la signature `ResultAsync<…, never>` est conservée — `ValidationError` est jeté et capté par le middleware `onError` global (cf. `errorHandler.ts` ligne 27), pattern déjà utilisé par `upsertIndicateur`.

---

## Task 10 — Adapter les tests `getValeurDerivee`

**Files:**
- Modify: `apps/mb-api/src/valeurAvancement/queries/getValeurDerivee.test.ts`

- [ ] **Step 1 : Run pour voir ce qui casse**

```bash
pnpm --filter @pilote/mb-api test -- src/valeurAvancement/queries/getValeurDerivee.test.ts
```

Expected : tous les tests existants échouent avec `ValidationError("L'indicateur n'est pas configuré pour le référentiel de cet individu")`, car aucun ne crée de lien `indicateurReferentiel`.

- [ ] **Step 2 : Adapter chaque test SUM existant**

Dans chaque cas existant, ajouter un appel `fixtures.indicateurReferentiel(...)` après la création de l'individu / des relations, avant l'appel à `getValeurDerivee`. La fonction par défaut du fixture est `SUM` (cf. Task 2).

**Important :** Le référentiel à lier est celui de l'**individu cible** (le parent qu'on calcule), pas celui des enfants.

Exemple pour le 1er cas (`retourne valeurDerivee null et couverture 0/0 pour une feuille`) :

```ts
await fixtures.indicateur({ publicId: indId })
await fixtures.individu({
  publicId: deptId,
  referentiel: { publicId: refDept, nom: 'Dept' },
})
await fixtures.indicateurReferentiel({
  indicateur: { publicId: indId },
  referentiel: { publicId: refDept },
})
```

Pour le 2e cas (`somme les valeurs saisies des enfants directs`) — la cible est `regId` (région) :

```ts
await fixtures.relation(
  // ... (inchangé)
)
await fixtures.indicateurReferentiel({
  indicateur: { publicId: indId },
  referentiel: { publicId: refReg },
})
await fixtures.valeurAvancement(/* ... inchangé */)
```

Faire pareil pour les cas :
- `expose les enfants sans valeur comme manquante` (cible = `regId`, lier à `refReg`)
- `dérive le niveau intermédiaire à partir des feuilles` (cible = `franceId`, lier à `refPays`)
- `priorise la saisie sur un nœud intermédiaire` (cible = `franceId`, lier à `refPays`)

- [ ] **Step 3 : Remplacer l'assertion `agregateur: 'SUM'` par `fonctionAgregation: 'SUM'`**

Dans le 1er cas, l'objet attendu :

```ts
expect(result._unsafeUnwrap()).toEqual({
  indicateur: indId,
  individu: deptId,
  fonctionAgregation: 'SUM',
  valeurDerivee: null,
  contributions: [],
  couverture: { nbEnfantsAvecValeur: 0, nbEnfantsTotal: 0 },
})
```

- [ ] **Step 4 : Adapter les deux cas d'erreur existants (`throw quand …`)**

Ces deux cas testent déjà des erreurs (permission absente / individu inexistant). Ils ne nécessitent **pas** de lien indicateurReferentiel puisqu'ils throw avant d'arriver au lookup. Aucune modification.

- [ ] **Step 5 : Ajouter le cas 400 « lien indicateur-référentiel absent »**

À la fin du `describe.concurrent`, ajouter :

```ts
it(
  "rejette avec ValidationError quand l'indicateur n'est pas configuré pour le référentiel de l'individu",
  integrationTest(async () => {
    const indId = testIndicateurId()
    const deptId = testDeptId()
    const refDept = testReferentielId()
    await fixtures.indicateur({ publicId: indId })
    await fixtures.individu({
      publicId: deptId,
      referentiel: { publicId: refDept, nom: 'Dept' },
    })
    // Volontairement : aucun fixtures.indicateurReferentiel(...)
    const apiKey = await fixtures.apiKey({
      permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
    })

    await expect(
      runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, deptId)),
    ).rejects.toMatchObject({
      constructor: ValidationError,
      message: expect.stringContaining("n'est pas configuré"),
    })
  }),
)
```

Ajouter l'import en tête de fichier :

```ts
import { ValidationError } from '@/framework/errors/AppError'
```

- [ ] **Step 6 : Ajouter le cas 400 « fonctionAgregation = NONE »**

```ts
it(
  "rejette avec ValidationError quand fonctionAgregation vaut NONE",
  integrationTest(async () => {
    const indId = testIndicateurId()
    const deptId = testDeptId()
    const refDept = testReferentielId()
    await fixtures.indicateur({ publicId: indId })
    await fixtures.individu({
      publicId: deptId,
      referentiel: { publicId: refDept, nom: 'Dept' },
    })
    await fixtures.indicateurReferentiel({
      indicateur: { publicId: indId },
      referentiel: { publicId: refDept },
      fonctionAgregation: 'NONE',
    })
    const apiKey = await fixtures.apiKey({
      permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
    })

    await expect(
      runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, deptId)),
    ).rejects.toMatchObject({
      constructor: ValidationError,
      message: expect.stringContaining('NONE'),
    })
  }),
)
```

- [ ] **Step 7 : Run et valider**

```bash
pnpm --filter @pilote/mb-api test -- src/valeurAvancement/queries/getValeurDerivee.test.ts
```

Expected : tous les tests verts (les 7 cas adaptés + 2 nouveaux = 9).

- [ ] **Step 8 : Lint + commit**

```bash
pnpm --filter @pilote/mb-api lint
git add apps/mb-api/src/valeurAvancement/queries/getValeurDerivee.ts \
        apps/mb-api/src/valeurAvancement/queries/getValeurDerivee.test.ts
git commit -m "feat(mb-api): getValeurDerivee applique la fonctionAgregation du lien"
```

---

## Task 11 — Vérification globale & nettoyage

**Files:**
- Tous

- [ ] **Step 1 : Lancer toute la suite de tests mb-api**

```bash
pnpm --filter @pilote/mb-api test
```

Expected : tous les tests verts. Si d'autres tests cassent (par exemple des tests d'intégration de routes appelant le PUT indicateur), les adapter au nouveau format.

- [ ] **Step 2 : Lint complet**

```bash
pnpm --filter @pilote/mb-api lint
pnpm --filter @pilote/mb-shared lint
```

Expected : exit 0 sur les deux.

- [ ] **Step 3 : Vérifier que le frontend `mb-webapp` n'a pas d'usage cassé**

```bash
pnpm --filter @pilote/mb-webapp lint 2>&1 | tail -40
```

Si erreurs liées à `referentielIds` ou `agregateur` dans le frontend MB, lister et corriger au cas par cas (rien d'attendu d'après l'utilisateur : aucun consommateur de l'API actuelle, mais la sanity check ne coûte rien).

- [ ] **Step 4 : Smoke test manuel via curl ou Swagger UI (optionnel)**

```bash
pnpm --filter @pilote/mb-api dev
```

Dans un autre terminal :

```bash
# Lookup d'une valeur dérivée SUM (IND-002 / individu sous REF-REG ou REF-DEPT)
# Doit retourner 200 avec fonctionAgregation: SUM
# Lookup sur IND-001 (NONE) → 400 VALIDATION_ERROR
```

(À adapter avec un publicId d'individu réel issu du seed.)

- [ ] **Step 5 : Commit éventuel des dernières corrections**

```bash
git status
# si modifications restantes :
git add <fichiers>
git commit -m "chore(mb-api): ajustements suite à l'ajout de fonctionAgregation"
```
