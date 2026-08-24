# Feature Flipping — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter à kpilote un feature flipping persisté en base, ciblable par utilisateur, administrable dans kpilote-admin et consommable dans kpilote-webapp via `useFeatureFlipping(key)`.

**Architecture:** 2 tables Prisma dans kpilote-api (`FeatureFlipping` + join `FeatureFlippingUtilisateur`). API CQRS (fonctions `ResultAsync`, Prisma via `db()`, routes Hono `.openapi()`) pour l'admin (liste, détail, changement d'état, upsert utilisateurs) et pour la consommation (`GET /me/feature-flipping` résolu par utilisateur courant). Admin UI en TanStack Router + React Query + `ky` via le BFF Hono. Hook webapp calqué sur `me/permissions` (appel direct kpilote-api). Création des FF par migration Prisma, facilitée par un script `ff:creer`.

**Tech Stack:** TypeScript, Prisma, Hono + `@hono/zod-openapi`, neverthrow, Vitest (back) ; Vite + TanStack Router + React Query + `ky` + Tailwind v4 (front) ; Zod (contrats partagés `@pilote/kpilote-shared`).

## Global Constraints

- Gestionnaire de paquets : **pnpm** (jamais npm). Filtre par app : `pnpm -F @pilote/kpilote-api …`, `-F @pilote/kpilote-admin`, `-F @pilote/kpilote-webapp`, `-F @pilote/kpilote-shared`.
- **Lancer `pnpm lint` (ou `pnpm -F <app> lint`) avant chaque commit.**
- Commits : **pas de `Co-Authored-By`**. Utiliser le skill `commit-billable` pour les commits.
- **Pas de tests** pour les parties front (kpilote-admin, kpilote-webapp) — ni specs, ni fichiers `.test`. Le back kpilote-api suit le TDD (tests d'intégration Vitest).
- Nommage : **verbes/tech en anglais, noms d'entités métier en français** (ex. `listerFeatureFlippings`, `FeatureFlipping`). Ici les verbes métier FR déjà en usage (`lister`, `modifier`, `remplacer`, `creer`) sont conservés par cohérence avec l'agrégat `niveauConfiance`.
- CSS : **Tailwind + composants `ui/`/`components/`**, jamais de classes DSFR. Helper de classes : **`clsxm`** (pas `cn`).
- Prisma kpilote-api : modèles **PascalCase** + `@@map` snake_case, colonnes FK `@map(...) @db.Uuid`, id `String @id @db.Uuid` (généré par `uuidv7()` en code / `gen_random_uuid()` en SQL), **pas de `@default` sur l'id**.
- tsconfig kpilote-api : chaque dossier `src/` doit avoir son entrée `paths`. Client Prisma importé via `@/generated/prisma/client`, enums via `@/generated/prisma/enums`, modèles via `@/generated/prisma/models`.

---

## File Structure

**kpilote-api** (`apps/kpilote-api/`)
- `prisma/schema.prisma` — enum + 2 modèles + back-relation Utilisateur (modifié)
- `tsconfig.json` — ajout `@/featureFlipping/*` (modifié)
- `src/featureFlipping/utils.ts` — include + mappers (créé)
- `src/featureFlipping/queries/listerFeatureFlippings.ts` (créé)
- `src/featureFlipping/queries/getFeatureFlippingById.ts` (créé)
- `src/featureFlipping/commands/modifierEtatFeatureFlipping.ts` (créé)
- `src/featureFlipping/commands/remplacerUtilisateursAutorises.ts` (créé)
- `src/featureFlipping/openapi.ts` (créé)
- `src/featureFlipping/routes.ts` (créé)
- `src/me/queries/listerMesFeatureFlippings.ts` (créé)
- `src/me/routes.ts` — ajout route `GET /me/feature-flipping` (modifié)
- `src/app.ts` — montage `featureFlippingRoutes` (modifié)
- `src/test/fixtures.ts` — fixture `featureFlipping` (modifié)
- `scripts/creer-feature-flipping.ts` (créé) + `package.json` script `ff:creer` (modifié)
- tests `*.test.ts` colocalisés (créés)

**kpilote-shared** (`packages/kpilote-shared/`)
- `src/featureFlipping.ts` (créé)
- `src/meFeatureFlipping.ts` (créé)
- `package.json` — 2 entrées `exports` (modifié)

**kpilote-admin** (`apps/kpilote-admin/`)
- `src/server/api/router.ts` — allowlist `SAFE_PATH` (modifié)
- `src/api/featureFlipping.ts` (créé)
- `src/queries/featureFlipping.ts` (créé)
- `src/routes/_authed/fonctionnalites.tsx` — carte (modifié)
- `src/routes/_authed/feature-flipping/index.tsx` (créé)
- `src/routes/_authed/feature-flipping/$id.tsx` (créé)
- `src/components/FeatureFlippingUtilisateursModal.tsx` (créé)

**kpilote-webapp** (`apps/kpilote-webapp/`)
- `src/api/meFeatureFlipping.ts` (créé)
- `src/queries/meFeatureFlipping.ts` (créé)
- `src/routes/_authenticated.tsx` — loader (modifié)

---

## Task 1 : Schéma Prisma + migration

**Files:**
- Modify: `apps/kpilote-api/prisma/schema.prisma`
- Modify: `apps/kpilote-api/tsconfig.json`

**Interfaces:**
- Produces: tables `feature_flipping` (`id`, `key` unique, `nom`, `etat`, `created_at`, `updated_at`) et `feature_flipping_utilisateur` (`feature_flipping_id`, `utilisateur_id`, PK composite) ; enum Prisma `FeatureFlippingEtat` (`ACTIVE`, `ACTIVE_POUR_UTILISATEUR`, `DESACTIVE`) ; relations `FeatureFlipping.utilisateursAutorises` et `Utilisateur.featureFlippingsAutorises`.

- [ ] **Step 1 : Ajouter l'enum et les modèles dans `schema.prisma`**

Ajouter en fin de fichier :

```prisma
enum FeatureFlippingEtat {
  ACTIVE
  ACTIVE_POUR_UTILISATEUR
  DESACTIVE
}

model FeatureFlipping {
  id        String              @id @db.Uuid
  key       String              @unique
  nom       String
  etat      FeatureFlippingEtat @default(DESACTIVE)
  createdAt DateTime            @default(now()) @map("created_at")
  updatedAt DateTime            @updatedAt      @map("updated_at")

  utilisateursAutorises FeatureFlippingUtilisateur[]

  @@map("feature_flipping")
}

model FeatureFlippingUtilisateur {
  featureFlippingId String   @map("feature_flipping_id") @db.Uuid
  utilisateurId     String   @map("utilisateur_id")      @db.Uuid
  createdAt         DateTime @default(now())             @map("created_at")

  featureFlipping FeatureFlipping @relation(fields: [featureFlippingId], references: [id], onDelete: Cascade)
  utilisateur     Utilisateur     @relation(fields: [utilisateurId],     references: [id], onDelete: Cascade)

  @@id([featureFlippingId, utilisateurId])
  @@index([featureFlippingId])
  @@map("feature_flipping_utilisateur")
}
```

- [ ] **Step 2 : Ajouter la back-relation sur `Utilisateur`**

Dans `model Utilisateur { … }`, ajouter au bloc des relations (à côté de `responsabilitesIndicateur IndicateurResponsable[]`) :

```prisma
  featureFlippingsAutorises FeatureFlippingUtilisateur[]
```

- [ ] **Step 3 : Ajouter le path tsconfig**

Dans `apps/kpilote-api/tsconfig.json`, ajouter dans `compilerOptions.paths` :

```json
    "@/featureFlipping/*": ["./src/featureFlipping/*"],
```

- [ ] **Step 4 : Générer la migration** (la base doit tourner — sinon `pnpm -F @pilote/kpilote-api database:init` d'abord)

Run: `pnpm -F @pilote/kpilote-api exec prisma migrate dev --name ajout_feature_flipping`
Expected: un dossier `prisma/migrations/<ts>_ajout_feature_flipping/migration.sql` créé, client Prisma régénéré, « Your database is now in sync ».

- [ ] **Step 5 : Vérifier la compilation**

Run: `pnpm -F @pilote/kpilote-api exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6 : Commit**

```bash
git add apps/kpilote-api/prisma apps/kpilote-api/tsconfig.json
git commit -m "feat(kpilote-api): tables feature flipping (schéma + migration)"
```

---

## Task 2 : Contrats partagés (`@pilote/kpilote-shared`)

**Files:**
- Create: `packages/kpilote-shared/src/featureFlipping.ts`
- Create: `packages/kpilote-shared/src/meFeatureFlipping.ts`
- Modify: `packages/kpilote-shared/package.json`

**Interfaces:**
- Produces :
  - `featureFlippingEtatSchema` (`z.enum(['ACTIVE','ACTIVE_POUR_UTILISATEUR','DESACTIVE'])`), type `FeatureFlippingEtat`
  - `featureFlippingKeySchema` (`z.string().regex(/^[a-z0-9_-]+$/)`)
  - `featureFlippingApiModelSchema` → `{ id, key, nom, etat }`, type `FeatureFlippingApiModel`
  - `featureFlippingListApiModelSchema` = `z.array(...)`, type `FeatureFlippingListApiModel`
  - `featureFlippingDetailApiModelSchema` → `{ id, key, nom, etat, utilisateursAutorises: UtilisateurApiModel[] }`, type `FeatureFlippingDetailApiModel`
  - `modifierEtatFeatureFlippingBodySchema` → `{ etat }`, type `ModifierEtatFeatureFlippingBody`
  - `remplacerUtilisateursAutorisesBodySchema` → `{ utilisateurIds: string[] }`, type `RemplacerUtilisateursAutorisesBody`
  - `meFeatureFlippingApiModelSchema` → `{ features: string[] }`, type `MeFeatureFlippingApiModel`

- [ ] **Step 1 : Créer `src/featureFlipping.ts`**

```ts
import { z } from 'zod'

import { utilisateurApiModelSchema } from './utilisateur'

export const featureFlippingEtatSchema = z
  .enum(['ACTIVE', 'ACTIVE_POUR_UTILISATEUR', 'DESACTIVE'])
  .describe(
    'État du feature flipping : `ACTIVE` (tous), `ACTIVE_POUR_UTILISATEUR` (utilisateurs autorisés uniquement), `DESACTIVE` (personne).',
  )
export type FeatureFlippingEtat = z.infer<typeof featureFlippingEtatSchema>

export const featureFlippingKeySchema = z
  .string()
  .regex(/^[a-z0-9_-]+$/, 'La clé doit être en minuscules (a-z, 0-9, `_`, `-`).')
  .describe('Clé technique référencée dans le code (ex. `nouveau_dashboard`).')

export const featureFlippingApiModelSchema = z
  .object({
    id: z.string().uuid().describe('Identifiant du feature flipping.'),
    key: featureFlippingKeySchema,
    nom: z.string().describe('Libellé lisible.'),
    etat: featureFlippingEtatSchema,
  })
  .describe('Feature flipping (item de liste).')
export type FeatureFlippingApiModel = z.infer<typeof featureFlippingApiModelSchema>

export const featureFlippingListApiModelSchema = z.array(featureFlippingApiModelSchema)
export type FeatureFlippingListApiModel = z.infer<typeof featureFlippingListApiModelSchema>

export const featureFlippingDetailApiModelSchema = featureFlippingApiModelSchema
  .extend({
    utilisateursAutorises: z
      .array(utilisateurApiModelSchema)
      .describe('Utilisateurs autorisés (effectifs uniquement dans l’état ACTIVE_POUR_UTILISATEUR).'),
  })
  .describe('Feature flipping détaillé (fiche).')
export type FeatureFlippingDetailApiModel = z.infer<typeof featureFlippingDetailApiModelSchema>

export const modifierEtatFeatureFlippingBodySchema = z
  .object({ etat: featureFlippingEtatSchema })
  .describe('Changement d’état d’un feature flipping.')
export type ModifierEtatFeatureFlippingBody = z.infer<typeof modifierEtatFeatureFlippingBodySchema>

export const remplacerUtilisateursAutorisesBodySchema = z
  .object({
    utilisateurIds: z
      .array(z.string().uuid())
      .describe('Liste complète des utilisateurs autorisés (remplace l’existant).'),
  })
  .describe('Remplacement de la liste des utilisateurs autorisés.')
export type RemplacerUtilisateursAutorisesBody = z.infer<
  typeof remplacerUtilisateursAutorisesBodySchema
>
```

- [ ] **Step 2 : Créer `src/meFeatureFlipping.ts`**

```ts
import { z } from 'zod'

import { featureFlippingKeySchema } from './featureFlipping'

export const meFeatureFlippingApiModelSchema = z
  .object({
    features: z
      .array(featureFlippingKeySchema)
      .describe('Clés des feature flippings actifs pour l’utilisateur courant.'),
  })
  .describe('Feature flippings actifs résolus pour l’utilisateur authentifié.')
export type MeFeatureFlippingApiModel = z.infer<typeof meFeatureFlippingApiModelSchema>
```

- [ ] **Step 3 : Ajouter les exports dans `package.json`**

Dans `exports`, ajouter (après `"./utilisateur"`) :

```json
  "./featureFlipping": {
    "types": "./src/featureFlipping.ts",
    "default": "./src/featureFlipping.ts"
  },
  "./meFeatureFlipping": {
    "types": "./src/meFeatureFlipping.ts",
    "default": "./src/meFeatureFlipping.ts"
  },
```

- [ ] **Step 4 : Vérifier**

Run: `pnpm -F @pilote/kpilote-shared exec tsc --noEmit` (ou `pnpm -F @pilote/kpilote-shared lint` si présent)
Expected: aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add packages/kpilote-shared
git commit -m "feat(kpilote-shared): contrats feature flipping"
```

---

## Task 3 : utils (include + mappers) + fixture de test

**Files:**
- Create: `apps/kpilote-api/src/featureFlipping/utils.ts`
- Modify: `apps/kpilote-api/src/test/fixtures.ts`

**Interfaces:**
- Consumes: modèles Prisma de Task 1, schémas de Task 2.
- Produces:
  - `featureFlippingInclude` (`satisfies Prisma.FeatureFlippingInclude`)
  - `toFeatureFlippingApiModel(row) → FeatureFlippingApiModel`
  - `toFeatureFlippingDetailApiModel(row) → FeatureFlippingDetailApiModel`
  - `fixtures.featureFlipping(overrides?) → FeatureFlippingModel` (accepte `key`, `nom`, `etat`, `utilisateurs: { id }[]`)

- [ ] **Step 1 : Créer `src/featureFlipping/utils.ts`**

```ts
import {
  type FeatureFlippingApiModel,
  type FeatureFlippingDetailApiModel,
} from '@pilote/kpilote-shared/featureFlipping'
import { type UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'

import { type Prisma } from '@/generated/prisma/client'

export const featureFlippingInclude = {
  utilisateursAutorises: { include: { utilisateur: true } },
} satisfies Prisma.FeatureFlippingInclude

export type FeatureFlippingRow = Prisma.FeatureFlippingGetPayload<{
  include: typeof featureFlippingInclude
}>

const toUtilisateurApiModel = (
  utilisateur: FeatureFlippingRow['utilisateursAutorises'][number]['utilisateur'],
): UtilisateurApiModel => ({
  id: utilisateur.id,
  email: utilisateur.email,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  service: utilisateur.service,
  fonction: utilisateur.fonction,
  // Statut/providers non nécessaires ici : la fiche n'affiche que nom/prénom/email.
  status: 'actif',
  providers: [],
  createdAt: utilisateur.createdAt.toISOString(),
  updatedAt: utilisateur.updatedAt.toISOString(),
})

export const toFeatureFlippingApiModel = (
  row: Pick<FeatureFlippingRow, 'id' | 'key' | 'nom' | 'etat'>,
): FeatureFlippingApiModel => ({
  id: row.id,
  key: row.key,
  nom: row.nom,
  etat: row.etat,
})

export const toFeatureFlippingDetailApiModel = (
  row: FeatureFlippingRow,
): FeatureFlippingDetailApiModel => ({
  ...toFeatureFlippingApiModel(row),
  utilisateursAutorises: row.utilisateursAutorises
    .map((liaison) => toUtilisateurApiModel(liaison.utilisateur))
    .sort((a, b) => a.email.localeCompare(b.email)),
})
```

> Note : `status: 'actif'` et `providers: []` sont des valeurs de commodité — la fiche admin n'utilise que `id/nom/prenom/email`. Si le vrai statut devient nécessaire, calculer depuis `identites`.

- [ ] **Step 2 : Ajouter la fixture `featureFlipping` dans `src/test/fixtures.ts`**

Ajouter le type `FeatureFlippingModel` à l'import depuis `@/generated/prisma/models`, `FeatureFlippingEtat` à l'import depuis `@/generated/prisma/enums`, puis avant `export const fixtures = {` :

```ts
// --- FeatureFlipping ---------------------------------------------------------

type FeatureFlippingOverrides = Partial<{
  id: string
  key: string
  nom: string
  etat: FeatureFlippingEtat
  utilisateurs: { id: string }[]
}>

let featureFlippingSeq = 0

const upsertFeatureFlipping = async (o: FeatureFlippingOverrides = {}) => {
  const id = o.id ?? uuidv7()
  featureFlippingSeq += 1
  const created = await db().featureFlipping.create({
    data: {
      id,
      key: o.key ?? `ff_test_${featureFlippingSeq}`,
      nom: o.nom ?? 'FF de test',
      etat: o.etat ?? 'DESACTIVE',
    },
  })
  for (const utilisateur of o.utilisateurs ?? []) {
    await db().featureFlippingUtilisateur.create({
      data: { featureFlippingId: id, utilisateurId: utilisateur.id },
    })
  }
  return created
}

function featureFlipping(): Promise<FeatureFlippingModel>
function featureFlipping(override: FeatureFlippingOverrides): Promise<FeatureFlippingModel>
async function featureFlipping(o?: FeatureFlippingOverrides): Promise<FeatureFlippingModel> {
  return upsertFeatureFlipping(o)
}
```

Puis ajouter `featureFlipping,` dans l'objet `export const fixtures = { … }`.

- [ ] **Step 3 : Vérifier la compilation**

Run: `pnpm -F @pilote/kpilote-api exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/kpilote-api/src/featureFlipping/utils.ts apps/kpilote-api/src/test/fixtures.ts
git commit -m "feat(kpilote-api): utils + fixture feature flipping"
```

---

## Task 4 : Query `listerFeatureFlippings` (TDD)

**Files:**
- Create: `apps/kpilote-api/src/featureFlipping/queries/listerFeatureFlippings.ts`
- Test: `apps/kpilote-api/src/featureFlipping/queries/listerFeatureFlippings.test.ts`

**Interfaces:**
- Produces: `listerFeatureFlippings(): ResultAsync<FeatureFlippingListApiModel, never>` — tous les FF triés par `nom` ASC.

- [ ] **Step 1 : Écrire le test**

`listerFeatureFlippings.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { listerFeatureFlippings } from '@/featureFlipping/queries/listerFeatureFlippings'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('listerFeatureFlippings', () => {
  it(
    'renvoie une liste vide quand aucun FF',
    integrationTest(async () => {
      const result = await listerFeatureFlippings()
      expect(result._unsafeUnwrap()).toEqual([])
    }),
  )

  it(
    'renvoie les FF triés par nom ASC',
    integrationTest(async () => {
      await fixtures.featureFlipping({ key: 'beta', nom: 'Beta', etat: 'ACTIVE' })
      await fixtures.featureFlipping({ key: 'alpha', nom: 'Alpha', etat: 'DESACTIVE' })

      const result = await listerFeatureFlippings()

      expect(result._unsafeUnwrap().map((ff) => ff.nom)).toEqual(['Alpha', 'Beta'])
      expect(result._unsafeUnwrap()[0]).toMatchObject({ key: 'alpha', etat: 'DESACTIVE' })
    }),
  )
})
```

- [ ] **Step 2 : Lancer le test — échec attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/featureFlipping/queries/listerFeatureFlippings.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3 : Écrire l'implémentation**

`listerFeatureFlippings.ts` :

```ts
import { type FeatureFlippingListApiModel } from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { toFeatureFlippingApiModel } from '@/featureFlipping/utils'
import { db } from '@/framework/persistence/dbStore'

export const listerFeatureFlippings = (): ResultAsync<FeatureFlippingListApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().featureFlipping.findMany({ orderBy: { nom: 'asc' } }),
  ).map((rows) => rows.map(toFeatureFlippingApiModel))
```

- [ ] **Step 4 : Lancer le test — succès attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/featureFlipping/queries/listerFeatureFlippings.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-api/src/featureFlipping/queries/listerFeatureFlippings.ts apps/kpilote-api/src/featureFlipping/queries/listerFeatureFlippings.test.ts
git commit -m "feat(kpilote-api): query listerFeatureFlippings"
```

---

## Task 5 : Query `getFeatureFlippingById` (TDD)

**Files:**
- Create: `apps/kpilote-api/src/featureFlipping/queries/getFeatureFlippingById.ts`
- Test: `apps/kpilote-api/src/featureFlipping/queries/getFeatureFlippingById.test.ts`

**Interfaces:**
- Produces: `getFeatureFlippingById(id: string): ResultAsync<FeatureFlippingDetailApiModel, never>` — détail + utilisateurs autorisés triés par email. `findUniqueOrThrow` lève Prisma `P2025` si absent → 404 `ENTITY_NOT_FOUND` via `registerErrorHandler` global.

- [ ] **Step 1 : Écrire le test**

```ts
import { describe, expect, it } from 'vitest'

import { getFeatureFlippingById } from '@/featureFlipping/queries/getFeatureFlippingById'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('getFeatureFlippingById', () => {
  it(
    'renvoie le détail avec ses utilisateurs autorisés triés par email',
    integrationTest(async () => {
      const zoe = await fixtures.utilisateur({ email: 'zoe@ditp.gouv.fr' })
      const alice = await fixtures.utilisateur({ email: 'alice@ditp.gouv.fr' })
      const ff = await fixtures.featureFlipping({
        key: 'nouveau_dashboard',
        nom: 'Nouveau dashboard',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: zoe.id }, { id: alice.id }],
      })

      const result = await getFeatureFlippingById(ff.id)

      const detail = result._unsafeUnwrap()
      expect(detail).toMatchObject({ key: 'nouveau_dashboard', etat: 'ACTIVE_POUR_UTILISATEUR' })
      expect(detail.utilisateursAutorises.map((u) => u.email)).toEqual([
        'alice@ditp.gouv.fr',
        'zoe@ditp.gouv.fr',
      ])
    }),
  )

  it(
    'rejette quand le FF est introuvable',
    integrationTest(async () => {
      await expect(
        getFeatureFlippingById('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow()
    }),
  )
})
```

> Note : `findUniqueOrThrow` lève Prisma `P2025` sur un id absent. Avec `fromSafePromise`, le rejet se propage (le `ResultAsync` rejette) ; en route, le `await` remonte l'exception au `registerErrorHandler` global qui répond 404. D'où `.rejects.toThrow()` dans le test (pas de canal d'erreur typé).

- [ ] **Step 2 : Lancer le test — échec attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/featureFlipping/queries/getFeatureFlippingById.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Écrire l'implémentation**

```ts
import { type FeatureFlippingDetailApiModel } from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { featureFlippingInclude, toFeatureFlippingDetailApiModel } from '@/featureFlipping/utils'
import { db } from '@/framework/persistence/dbStore'

export const getFeatureFlippingById = (
  id: string,
): ResultAsync<FeatureFlippingDetailApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().featureFlipping.findUniqueOrThrow({ where: { id }, include: featureFlippingInclude }),
  ).map(toFeatureFlippingDetailApiModel)
```

- [ ] **Step 4 : Lancer le test — succès attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/featureFlipping/queries/getFeatureFlippingById.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-api/src/featureFlipping/queries/getFeatureFlippingById.ts apps/kpilote-api/src/featureFlipping/queries/getFeatureFlippingById.test.ts
git commit -m "feat(kpilote-api): query getFeatureFlippingById"
```

---

## Task 6 : Command `modifierEtatFeatureFlipping` (TDD)

**Files:**
- Create: `apps/kpilote-api/src/featureFlipping/commands/modifierEtatFeatureFlipping.ts`
- Test: `apps/kpilote-api/src/featureFlipping/commands/modifierEtatFeatureFlipping.test.ts`

**Interfaces:**
- Produces: `modifierEtatFeatureFlipping(id: string, body: ModifierEtatFeatureFlippingBody): ResultAsync<FeatureFlippingDetailApiModel, never>` — met à jour `etat`, renvoie le détail à jour. `update` sur un id absent lève `P2025` → 404.

- [ ] **Step 1 : Écrire le test**

```ts
import { describe, expect, it } from 'vitest'

import { modifierEtatFeatureFlipping } from '@/featureFlipping/commands/modifierEtatFeatureFlipping'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('modifierEtatFeatureFlipping', () => {
  it(
    'change l’état du feature flipping',
    integrationTest(async () => {
      const ff = await fixtures.featureFlipping({ key: 'x', nom: 'X', etat: 'DESACTIVE' })

      const result = await modifierEtatFeatureFlipping(ff.id, { etat: 'ACTIVE' })

      expect(result._unsafeUnwrap().etat).toBe('ACTIVE')
    }),
  )

  it(
    'rejette quand le FF est introuvable',
    integrationTest(async () => {
      await expect(
        modifierEtatFeatureFlipping('00000000-0000-0000-0000-000000000000', { etat: 'ACTIVE' }),
      ).rejects.toThrow()
    }),
  )
})
```

- [ ] **Step 2 : Lancer le test — échec attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/featureFlipping/commands/modifierEtatFeatureFlipping.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Écrire l'implémentation**

```ts
import {
  type FeatureFlippingDetailApiModel,
  type ModifierEtatFeatureFlippingBody,
} from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { featureFlippingInclude, toFeatureFlippingDetailApiModel } from '@/featureFlipping/utils'
import { db } from '@/framework/persistence/dbStore'

export const modifierEtatFeatureFlipping = (
  id: string,
  body: ModifierEtatFeatureFlippingBody,
): ResultAsync<FeatureFlippingDetailApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().featureFlipping.update({
      where: { id },
      data: { etat: body.etat },
      include: featureFlippingInclude,
    }),
  ).map(toFeatureFlippingDetailApiModel)
```

- [ ] **Step 4 : Lancer le test — succès attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/featureFlipping/commands/modifierEtatFeatureFlipping.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-api/src/featureFlipping/commands/modifierEtatFeatureFlipping.ts apps/kpilote-api/src/featureFlipping/commands/modifierEtatFeatureFlipping.test.ts
git commit -m "feat(kpilote-api): command modifierEtatFeatureFlipping"
```

---

## Task 7 : Command `remplacerUtilisateursAutorises` (TDD)

**Files:**
- Create: `apps/kpilote-api/src/featureFlipping/commands/remplacerUtilisateursAutorises.ts`
- Test: `apps/kpilote-api/src/featureFlipping/commands/remplacerUtilisateursAutorises.test.ts`

**Interfaces:**
- Produces: `remplacerUtilisateursAutorises(id: string, body: RemplacerUtilisateursAutorisesBody): ResultAsync<FeatureFlippingDetailApiModel, never>` — réconcilie la liste (supprime les retirés, ajoute les nouveaux). Lève (exceptions, remontées au handler global) `ValidationError('Utilisateurs inconnus')` → 400 si un id n'existe pas ; `findUniqueOrThrow` `P2025` → 404 si le FF n'existe pas.

- [ ] **Step 1 : Écrire le test**

```ts
import { describe, expect, it } from 'vitest'

import { remplacerUtilisateursAutorises } from '@/featureFlipping/commands/remplacerUtilisateursAutorises'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('remplacerUtilisateursAutorises', () => {
  it(
    'remplace la liste : ajoute les nouveaux et supprime les retirés',
    integrationTest(async () => {
      const a = await fixtures.utilisateur({ email: 'a@ditp.gouv.fr' })
      const b = await fixtures.utilisateur({ email: 'b@ditp.gouv.fr' })
      const c = await fixtures.utilisateur({ email: 'c@ditp.gouv.fr' })
      const ff = await fixtures.featureFlipping({
        key: 'x',
        nom: 'X',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: a.id }, { id: b.id }],
      })

      const result = await remplacerUtilisateursAutorises(ff.id, {
        utilisateurIds: [b.id, c.id],
      })

      expect(result._unsafeUnwrap().utilisateursAutorises.map((u) => u.email)).toEqual([
        'b@ditp.gouv.fr',
        'c@ditp.gouv.fr',
      ])
    }),
  )

  it(
    'vide la liste quand utilisateurIds est vide',
    integrationTest(async () => {
      const a = await fixtures.utilisateur({ email: 'a@ditp.gouv.fr' })
      const ff = await fixtures.featureFlipping({ utilisateurs: [{ id: a.id }] })

      const result = await remplacerUtilisateursAutorises(ff.id, { utilisateurIds: [] })

      expect(result._unsafeUnwrap().utilisateursAutorises).toEqual([])
    }),
  )

  it(
    'rejette quand un utilisateur est inconnu',
    integrationTest(async () => {
      const ff = await fixtures.featureFlipping()

      await expect(
        remplacerUtilisateursAutorises(ff.id, {
          utilisateurIds: ['00000000-0000-0000-0000-000000000000'],
        }),
      ).rejects.toThrow()
    }),
  )
})
```

- [ ] **Step 2 : Lancer le test — échec attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/featureFlipping/commands/remplacerUtilisateursAutorises.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Écrire l'implémentation** (réconciliation calquée sur `remplacerResponsables` de `src/indicateur/commands/upsertIndicateur.ts`)

```ts
import {
  type FeatureFlippingDetailApiModel,
  type RemplacerUtilisateursAutorisesBody,
} from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { featureFlippingInclude, toFeatureFlippingDetailApiModel } from '@/featureFlipping/utils'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

// findUniqueOrThrow lève Prisma P2025 (→ 404) si le FF n'existe pas.
const ensureFeatureFlippingExiste = async (id: string): Promise<void> => {
  await db().featureFlipping.findUniqueOrThrow({ where: { id }, select: { id: true } })
}

const resoudreUtilisateurs = async (utilisateurIds: ReadonlyArray<string>): Promise<string[]> => {
  const idsUniques = [...new Set(utilisateurIds)]
  if (idsUniques.length === 0) return []
  const utilisateurs = await db().utilisateur.findMany({ where: { id: { in: idsUniques } } })
  const idsTrouves = new Set(utilisateurs.map((utilisateur) => utilisateur.id))
  const idsInconnus = idsUniques.filter((id) => !idsTrouves.has(id))
  if (idsInconnus.length > 0) {
    throw new ValidationError('Utilisateurs inconnus', { unknownUtilisateurIds: idsInconnus.sort() })
  }
  return idsUniques
}

const remplacerLiaisons = async (
  featureFlippingId: string,
  utilisateurIdsCibles: string[],
): Promise<void> => {
  const cibles = new Set(utilisateurIdsCibles)
  const existantes = await db().featureFlippingUtilisateur.findMany({ where: { featureFlippingId } })
  const aSupprimer = existantes
    .filter((liaison) => !cibles.has(liaison.utilisateurId))
    .map((liaison) => liaison.utilisateurId)
  if (aSupprimer.length > 0) {
    await db().featureFlippingUtilisateur.deleteMany({
      where: { featureFlippingId, utilisateurId: { in: aSupprimer } },
    })
  }
  for (const utilisateurId of utilisateurIdsCibles) {
    await db().featureFlippingUtilisateur.upsert({
      where: { featureFlippingId_utilisateurId: { featureFlippingId, utilisateurId } },
      update: {},
      create: { featureFlippingId, utilisateurId },
    })
  }
}

export const remplacerUtilisateursAutorises = (
  id: string,
  body: RemplacerUtilisateursAutorisesBody,
): ResultAsync<FeatureFlippingDetailApiModel, never> =>
  ResultAsync.fromSafePromise(
    ensureFeatureFlippingExiste(id)
      .then(() => resoudreUtilisateurs(body.utilisateurIds))
      .then((utilisateurIds) => remplacerLiaisons(id, utilisateurIds))
      .then(() =>
        db().featureFlipping.findUniqueOrThrow({ where: { id }, include: featureFlippingInclude }),
      ),
  ).map(toFeatureFlippingDetailApiModel)
```

> Vérifier le nom de la clé composite générée par Prisma : `featureFlippingId_utilisateurId` (dérivé de `@@id([featureFlippingId, utilisateurId])`). Confirmer via l'autocomplétion / `src/generated/prisma`.

- [ ] **Step 4 : Lancer le test — succès attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/featureFlipping/commands/remplacerUtilisateursAutorises.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-api/src/featureFlipping/commands/remplacerUtilisateursAutorises.ts apps/kpilote-api/src/featureFlipping/commands/remplacerUtilisateursAutorises.test.ts
git commit -m "feat(kpilote-api): command remplacerUtilisateursAutorises"
```

---

## Task 8 : OpenAPI + routes admin + montage

**Files:**
- Create: `apps/kpilote-api/src/featureFlipping/openapi.ts`
- Create: `apps/kpilote-api/src/featureFlipping/routes.ts`
- Modify: `apps/kpilote-api/src/app.ts`

**Interfaces:**
- Consumes: queries/commands des Tasks 4-7.
- Produces: `featureFlippingRoutes` (Hono) exposant `GET /feature-flipping`, `GET /feature-flipping/{id}`, `PATCH /feature-flipping/{id}/etat`, `PUT /feature-flipping/{id}/utilisateurs`.

- [ ] **Step 1 : Créer `openapi.ts`**

```ts
import {
  featureFlippingApiModelSchema,
  featureFlippingDetailApiModelSchema,
  featureFlippingListApiModelSchema,
} from '@pilote/kpilote-shared/featureFlipping'

import { erreur400, erreur404, succes200 } from '@/framework/openapi/responses'

export const FeatureFlippingApiModelSchema = featureFlippingApiModelSchema.openapi(
  'FeatureFlippingApiModel',
)
export const FeatureFlippingDetailApiModelSchema = featureFlippingDetailApiModelSchema.openapi(
  'FeatureFlippingDetailApiModel',
)
export const FeatureFlippingListApiModelSchema = featureFlippingListApiModelSchema.openapi(
  'FeatureFlippingListApiModel',
)

export const reponseListeFeatureFlipping = {
  200: succes200('Feature flippings', FeatureFlippingListApiModelSchema),
}

export const reponseDetailFeatureFlipping = {
  200: succes200('Feature flipping', FeatureFlippingDetailApiModelSchema),
  400: erreur400,
  404: erreur404,
}
```

- [ ] **Step 2 : Créer `routes.ts`**

```ts
import { createRoute, z } from '@hono/zod-openapi'
import {
  modifierEtatFeatureFlippingBodySchema,
  remplacerUtilisateursAutorisesBodySchema,
} from '@pilote/kpilote-shared/featureFlipping'

import { modifierEtatFeatureFlipping } from '@/featureFlipping/commands/modifierEtatFeatureFlipping'
import { remplacerUtilisateursAutorises } from '@/featureFlipping/commands/remplacerUtilisateursAutorises'
import {
  FeatureFlippingDetailApiModelSchema,
  FeatureFlippingListApiModelSchema,
  reponseDetailFeatureFlipping,
  reponseListeFeatureFlipping,
} from '@/featureFlipping/openapi'
import { getFeatureFlippingById } from '@/featureFlipping/queries/getFeatureFlippingById'
import { listerFeatureFlippings } from '@/featureFlipping/queries/listerFeatureFlippings'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'

export const featureFlippingRoutes = createOpenApiHono()

const params = z.object({ id: z.string().uuid() })

const listerRoute = createRoute({
  method: 'get',
  path: '/feature-flipping',
  tags: ['FeatureFlipping'],
  summary: 'Lister les feature flippings',
  middleware: [requireAuthentication],
  responses: reponseListeFeatureFlipping,
})

featureFlippingRoutes.openapi(listerRoute, async (context) =>
  (await listerFeatureFlippings()).match(
    (data) => jsonResponseOk({ context, data, schema: FeatureFlippingListApiModelSchema, status: 200 }),
    never,
  ),
)

const detailRoute = createRoute({
  method: 'get',
  path: '/feature-flipping/{id}',
  tags: ['FeatureFlipping'],
  summary: 'Détail d’un feature flipping',
  middleware: [requireAuthentication],
  request: { params },
  responses: reponseDetailFeatureFlipping,
})

featureFlippingRoutes.openapi(detailRoute, async (context) => {
  const { id } = context.req.valid('param')
  return (await getFeatureFlippingById(id)).match(
    (data) => jsonResponseOk({ context, data, schema: FeatureFlippingDetailApiModelSchema, status: 200 }),
    never,
  )
})

const modifierEtatRoute = createRoute({
  method: 'patch',
  path: '/feature-flipping/{id}/etat',
  tags: ['FeatureFlipping'],
  summary: 'Modifier l’état d’un feature flipping',
  middleware: [requireAuthentication],
  request: {
    params,
    body: {
      content: { 'application/json': { schema: modifierEtatFeatureFlippingBodySchema } },
      required: true,
    },
  },
  responses: reponseDetailFeatureFlipping,
})

featureFlippingRoutes.openapi(modifierEtatRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => modifierEtatFeatureFlipping(id, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: FeatureFlippingDetailApiModelSchema, status: 200 }),
    never,
  )
})

const remplacerUtilisateursRoute = createRoute({
  method: 'put',
  path: '/feature-flipping/{id}/utilisateurs',
  tags: ['FeatureFlipping'],
  summary: 'Remplacer les utilisateurs autorisés',
  middleware: [requireAuthentication],
  request: {
    params,
    body: {
      content: { 'application/json': { schema: remplacerUtilisateursAutorisesBodySchema } },
      required: true,
    },
  },
  responses: reponseDetailFeatureFlipping,
})

featureFlippingRoutes.openapi(remplacerUtilisateursRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => remplacerUtilisateursAutorises(id, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: FeatureFlippingDetailApiModelSchema, status: 200 }),
    never,
  )
})
```

> **Gestion d'erreur** : identique aux autres agrégats. Les queries/commands renvoient `ResultAsync<…, never>` et **lèvent** leurs erreurs (`findUniqueOrThrow` → `P2025` → 404, `ValidationError` → 400). Le `registerErrorHandler` global (`src/framework/errors/errorHandler.ts`, branché dans `src/app.ts`) mappe `AppError`/Prisma vers le statut HTTP. Les routes utilisent donc `.match(<ok>, never)` (`never` importé de `@/framework/errors/never`) : sur exception, le `await` remonte au handler global. Les réponses 400/404 déclarées dans `openapi.ts` ne servent qu'à documenter le contrat OpenAPI.

- [ ] **Step 3 : Monter les routes dans `src/app.ts`**

Ajouter l'import et une ligne `app.route('/', featureFlippingRoutes)` à côté des autres montages :

```ts
import { featureFlippingRoutes } from '@/featureFlipping/routes'
// …
app.route('/', featureFlippingRoutes)
```

- [ ] **Step 4 : Vérifier compilation + suite de tests back**

Run: `pnpm -F @pilote/kpilote-api lint && pnpm -F @pilote/kpilote-api test`
Expected: lint OK, tous les tests passent.

- [ ] **Step 5 : Vérification manuelle (walkthrough API)**

Démarrer l'API (`pnpm -F @pilote/kpilote-api dev`, base up), puis avec une clé ADMIN :
`curl -s -H "Authorization: Bearer <clé>" http://<host>/feature-flipping` → `[]` ou la liste.
Vérifier aussi le Swagger UI : les 4 routes `FeatureFlipping` apparaissent.

- [ ] **Step 6 : Commit**

```bash
git add apps/kpilote-api/src/featureFlipping/openapi.ts apps/kpilote-api/src/featureFlipping/routes.ts apps/kpilote-api/src/app.ts
git commit -m "feat(kpilote-api): routes admin feature flipping"
```

---

## Task 9 : Résolution `GET /me/feature-flipping` (TDD)

**Files:**
- Create: `apps/kpilote-api/src/me/queries/listerMesFeatureFlippings.ts`
- Test: `apps/kpilote-api/src/me/queries/listerMesFeatureFlippings.test.ts`
- Modify: `apps/kpilote-api/src/me/routes.ts`

**Interfaces:**
- Produces: `listerMesFeatureFlippings(): ResultAsync<MeFeatureFlippingApiModel, never>` — clés des FF `ACTIVE` (tous) + `ACTIVE_POUR_UTILISATEUR` où l'utilisateur courant est autorisé. `DESACTIVE` exclus. Route `GET /me/feature-flipping`.

- [ ] **Step 1 : Écrire le test**

```ts
import { describe, expect, it } from 'vitest'

import { listerMesFeatureFlippings } from '@/me/queries/listerMesFeatureFlippings'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listerMesFeatureFlippings', () => {
  it(
    'inclut les FF ACTIVE, exclut les DESACTIVE, et inclut ACTIVE_POUR_UTILISATEUR seulement si autorisé',
    integrationTest(async () => {
      const moi = await fixtures.utilisateur({ email: 'moi@ditp.gouv.fr' })
      const autre = await fixtures.utilisateur({ email: 'autre@ditp.gouv.fr' })
      await fixtures.featureFlipping({ key: 'global_on', etat: 'ACTIVE' })
      await fixtures.featureFlipping({ key: 'global_off', etat: 'DESACTIVE' })
      await fixtures.featureFlipping({
        key: 'pour_moi',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: moi.id }],
      })
      await fixtures.featureFlipping({
        key: 'pour_autre',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: autre.id }],
      })

      const result = await runAsPrincipal(moi.id, () => listerMesFeatureFlippings())

      expect(result._unsafeUnwrap().features.sort()).toEqual(['global_on', 'pour_moi'])
    }),
  )
})
```

- [ ] **Step 2 : Lancer le test — échec attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/me/queries/listerMesFeatureFlippings.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Écrire l'implémentation**

```ts
import { type MeFeatureFlippingApiModel } from '@pilote/kpilote-shared/meFeatureFlipping'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

const loadFeaturesActives = async (utilisateurId: string | null): Promise<string[]> => {
  const rows = await db().featureFlipping.findMany({
    where: {
      OR: [
        { etat: 'ACTIVE' },
        ...(utilisateurId
          ? [
              {
                etat: 'ACTIVE_POUR_UTILISATEUR' as const,
                utilisateursAutorises: { some: { utilisateurId } },
              },
            ]
          : []),
      ],
    },
    select: { key: true },
    orderBy: { key: 'asc' },
  })
  return rows.map((row) => row.key)
}

export const listerMesFeatureFlippings = (): ResultAsync<MeFeatureFlippingApiModel, never> => {
  // Une API key ADMIN n'est pas un utilisateur ciblable : elle ne voit que les FF ACTIVE.
  const utilisateurId = isAdminPrincipal() ? null : requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(loadFeaturesActives(utilisateurId)).map((features) => ({
    features,
  }))
}
```

- [ ] **Step 4 : Lancer le test — succès attendu**

Run: `pnpm -F @pilote/kpilote-api exec vitest run src/me/queries/listerMesFeatureFlippings.test.ts`
Expected: PASS.

- [ ] **Step 5 : Ajouter la route dans `src/me/routes.ts`**

Ajouter les imports :

```ts
import { meFeatureFlippingApiModelSchema } from '@pilote/kpilote-shared/meFeatureFlipping'
import { listerMesFeatureFlippings } from '@/me/queries/listerMesFeatureFlippings'
```

Après `MePermissionsOkSchema`, ajouter le schéma + la route :

```ts
const MeFeatureFlippingOkSchema = meFeatureFlippingApiModelSchema.openapi('MeFeatureFlipping')

const meFeatureFlippingRoute = createRoute({
  method: 'get',
  path: '/me/feature-flipping',
  tags: ['Authentication'],
  summary: 'Feature flippings actifs pour l’utilisateur courant',
  middleware: [requireAuthentication],
  responses: {
    200: {
      content: { 'application/json': { schema: MeFeatureFlippingOkSchema } },
      description: 'Clés des feature flippings actifs',
    },
  },
})
```

Puis enregistrer le handler (après `meRoutes.openapi(mePermissionsRoute, …)`) :

```ts
meRoutes.openapi(meFeatureFlippingRoute, async (context) =>
  listerMesFeatureFlippings().match(
    (data) => jsonResponseOk({ context, data, schema: MeFeatureFlippingOkSchema, status: 200 }),
    never,
  ),
)
```

- [ ] **Step 6 : Vérifier compilation + tests**

Run: `pnpm -F @pilote/kpilote-api lint && pnpm -F @pilote/kpilote-api test`
Expected: OK.

- [ ] **Step 7 : Commit**

```bash
git add apps/kpilote-api/src/me
git commit -m "feat(kpilote-api): résolution GET /me/feature-flipping"
```

---

## Task 10 : Script `ff:creer`

**Files:**
- Create: `apps/kpilote-api/scripts/creer-feature-flipping.ts`
- Modify: `apps/kpilote-api/package.json`

**Interfaces:**
- Produces: commande `pnpm -F @pilote/kpilote-api ff:creer --key=<key> --nom="<nom>" [--etat=DESACTIVE|ACTIVE|ACTIVE_POUR_UTILISATEUR]` qui scaffolde une migration Prisma insérant une ligne `feature_flipping`.

- [ ] **Step 1 : Écrire le script `scripts/creer-feature-flipping.ts`**

```ts
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { featureFlippingKeySchema } from '@pilote/kpilote-shared/featureFlipping'

const MIGRATIONS_DIR = join(process.cwd(), 'prisma', 'migrations')
const ETATS = ['DESACTIVE', 'ACTIVE', 'ACTIVE_POUR_UTILISATEUR'] as const
type Etat = (typeof ETATS)[number]

const lireArg = (nom: string): string | undefined => {
  const prefixe = `--${nom}=`
  const arg = process.argv.find((a) => a.startsWith(prefixe))
  return arg?.slice(prefixe.length)
}

const echapperSql = (valeur: string): string => valeur.replace(/'/g, "''")

const main = (): void => {
  const key = featureFlippingKeySchema.parse(lireArg('key'))
  const nom = lireArg('nom')
  if (!nom || nom.trim() === '') throw new Error('--nom est requis.')
  const etatArg = lireArg('etat') ?? 'DESACTIVE'
  if (!ETATS.includes(etatArg as Etat)) {
    throw new Error(`--etat doit être l'un de : ${ETATS.join(', ')}`)
  }
  const etat = etatArg as Etat

  // Refuse une key déjà insérée par une migration existante.
  const dejaPresent = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .some((entry) => {
      const sqlPath = join(MIGRATIONS_DIR, entry.name, 'migration.sql')
      try {
        return readFileSync(sqlPath, 'utf8').includes(`'${echapperSql(key)}'`)
      } catch {
        return false
      }
    })
  if (dejaPresent) throw new Error(`La clé "${key}" est déjà référencée par une migration.`)

  // Scaffolde une migration vide via Prisma (nécessite une base up).
  const nomMigration = `ajout_ff_${key}`
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'dev', '--create-only', '--name', nomMigration], {
    stdio: 'inherit',
  })

  // Retrouve le dossier fraîchement créé (celui dont le nom finit par nomMigration).
  const dossier = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(nomMigration))
    .map((entry) => entry.name)
    .sort()
    .at(-1)
  if (!dossier) throw new Error('Migration introuvable après scaffold.')

  const sqlPath = join(MIGRATIONS_DIR, dossier, 'migration.sql')
  const insert =
    `\nINSERT INTO "feature_flipping" ("id", "key", "nom", "etat")\n` +
    `VALUES (gen_random_uuid(), '${echapperSql(key)}', '${echapperSql(nom)}', '${etat}');\n`
  writeFileSync(sqlPath, readFileSync(sqlPath, 'utf8') + insert)

  console.log(`✅ Migration générée : ${sqlPath}`)
  console.log('   Relis le SQL puis committe-le.')
}

main()
```

- [ ] **Step 2 : Ajouter le script npm dans `package.json`**

Dans `scripts`, ajouter :

```json
    "ff:creer": "tsx scripts/creer-feature-flipping.ts",
```

- [ ] **Step 3 : Vérifier lint (le script est couvert par `eslint src scripts` + tsc)**

Run: `pnpm -F @pilote/kpilote-api lint`
Expected: OK.

- [ ] **Step 4 : Essai réel** (base up)

Run: `pnpm -F @pilote/kpilote-api ff:creer --key=demo_ff --nom="Démo FF"`
Expected: une migration `…_ajout_ff_demo_ff/migration.sql` contenant l'`INSERT`. Vérifier son contenu, puis la supprimer (`git clean`/`rm`) si c'était juste un essai — ou l'appliquer avec `pnpm -F @pilote/kpilote-api database:migration`.

- [ ] **Step 5 : Commit** (script uniquement, pas la migration d'essai)

```bash
git add apps/kpilote-api/scripts/creer-feature-flipping.ts apps/kpilote-api/package.json
git commit -m "feat(kpilote-api): script ff:creer (migration d'ajout de FF)"
```

---

## Task 11 : Admin — allowlist BFF + couche API/queries

**Files:**
- Modify: `apps/kpilote-admin/src/server/api/router.ts`
- Create: `apps/kpilote-admin/src/api/featureFlipping.ts`
- Create: `apps/kpilote-admin/src/queries/featureFlipping.ts`

**Interfaces:**
- Produces: `fetchFeatureFlippings()`, `fetchFeatureFlippingById(id)`, `modifierEtatFeatureFlipping(id, etat)`, `remplacerUtilisateursAutorises(id, utilisateurIds)` ; `featureFlippingsQueryOptions()`, `featureFlippingQueryOptions(id)`.

- [ ] **Step 1 : Étendre l'allowlist `SAFE_PATH`**

Dans `src/server/api/router.ts`, ajouter `feature-flipping` au groupe de ressources du regex :

```ts
const SAFE_PATH =
  /^(indicateurs|referentiels|individus|api-keys|utilisateurs|paniers|permissions|feature-flipping)(\/[A-Za-z0-9_-]+)*$/
```

- [ ] **Step 2 : Créer `src/api/featureFlipping.ts`**

```ts
import type {
  FeatureFlippingDetailApiModel,
  FeatureFlippingEtat,
  FeatureFlippingListApiModel,
} from '@pilote/kpilote-shared/featureFlipping'
import {
  featureFlippingDetailApiModelSchema,
  featureFlippingListApiModelSchema,
} from '@pilote/kpilote-shared/featureFlipping'

import { bffClient } from '@/api/client'

export const fetchFeatureFlippings = async (): Promise<FeatureFlippingListApiModel> => {
  const json = await bffClient.get('feature-flipping').json()
  return featureFlippingListApiModelSchema.parse(json)
}

export const fetchFeatureFlippingById = async (
  id: string,
): Promise<FeatureFlippingDetailApiModel> => {
  const json = await bffClient.get(`feature-flipping/${id}`).json()
  return featureFlippingDetailApiModelSchema.parse(json)
}

export const modifierEtatFeatureFlipping = async (
  id: string,
  etat: FeatureFlippingEtat,
): Promise<FeatureFlippingDetailApiModel> => {
  const json = await bffClient.patch(`feature-flipping/${id}/etat`, { json: { etat } }).json()
  return featureFlippingDetailApiModelSchema.parse(json)
}

export const remplacerUtilisateursAutorises = async (
  id: string,
  utilisateurIds: string[],
): Promise<FeatureFlippingDetailApiModel> => {
  const json = await bffClient
    .put(`feature-flipping/${id}/utilisateurs`, { json: { utilisateurIds } })
    .json()
  return featureFlippingDetailApiModelSchema.parse(json)
}
```

- [ ] **Step 3 : Créer `src/queries/featureFlipping.ts`**

```ts
import { queryOptions } from '@tanstack/react-query'

import { fetchFeatureFlippingById, fetchFeatureFlippings } from '@/api/featureFlipping'

export const featureFlippingsQueryOptions = () =>
  queryOptions({
    queryKey: ['feature-flipping'],
    queryFn: () => fetchFeatureFlippings(),
  })

export const featureFlippingQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['feature-flipping', id],
    queryFn: () => fetchFeatureFlippingById(id),
  })
```

- [ ] **Step 4 : Vérifier**

Run: `pnpm -F @pilote/kpilote-admin exec tsc --noEmit`
Expected: OK.

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-admin/src/server/api/router.ts apps/kpilote-admin/src/api/featureFlipping.ts apps/kpilote-admin/src/queries/featureFlipping.ts
git commit -m "feat(kpilote-admin): couche API + allowlist BFF feature flipping"
```

---

## Task 12 : Admin — carte + page liste (état inline)

**Files:**
- Modify: `apps/kpilote-admin/src/routes/_authed/fonctionnalites.tsx`
- Create: `apps/kpilote-admin/src/routes/_authed/feature-flipping/index.tsx`

**Interfaces:**
- Consumes: `featureFlippingsQueryOptions`, `modifierEtatFeatureFlipping`.
- Produces: route `/feature-flipping` (liste + changement d'état inline + lien fiche).

- [ ] **Step 1 : Ajouter la carte dans `fonctionnalites.tsx`**

Importer une icône : `import { BarChart3, FolderTree, KeyRound, ToggleLeft, Users } from 'lucide-react'`.
Ajouter une carte après celle des utilisateurs :

```tsx
        <FadeIn delayMs={300}>
          <BarCard
            icon={ToggleLeft}
            title="Gérer le feature flipping"
            description="Activer, désactiver ou cibler des fonctionnalités par utilisateur."
            onClick={() => void navigate({ to: '/feature-flipping' })}
          />
        </FadeIn>
```

- [ ] **Step 2 : Créer la page liste `feature-flipping/index.tsx`**

```tsx
import type {
  FeatureFlippingApiModel,
  FeatureFlippingEtat,
} from '@pilote/kpilote-shared/featureFlipping'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { modifierEtatFeatureFlipping } from '@/api/featureFlipping'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table } from '@/components/ui/Table'
import { extractApiError } from '@/lib/apiError'
import { featureFlippingsQueryOptions } from '@/queries/featureFlipping'

export const Route = createFileRoute('/_authed/feature-flipping/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(featureFlippingsQueryOptions()),
  component: FeatureFlippingListComponent,
})

const ETAT_OPTIONS: { value: FeatureFlippingEtat; label: string }[] = [
  { value: 'ACTIVE', label: 'Actif (tous)' },
  { value: 'ACTIVE_POUR_UTILISATEUR', label: 'Actif (utilisateurs autorisés)' },
  { value: 'DESACTIVE', label: 'Désactivé' },
]

function FeatureFlippingListComponent() {
  const queryClient = useQueryClient()
  const query = useQuery(featureFlippingsQueryOptions())
  const items = query.data ?? []
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ id, etat }: { id: string; etat: FeatureFlippingEtat }) =>
      modifierEtatFeatureFlipping(id, etat),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feature-flipping'] })
    },
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Feature flipping</span>
      </Breadcrumb>
      <PageHeading
        title="Feature flipping"
        subtitle={
          <>
            {items.length} fonctionnalité{items.length > 1 ? 's' : ''}
          </>
        }
      />

      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      {items.length === 0 && !query.isLoading ? (
        <EmptyState
          title="Aucun feature flipping"
          description="Les feature flippings sont créés via des migrations Prisma (script ff:creer)."
        />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Clé</Table.HeaderCell>
              <Table.HeaderCell>État</Table.HeaderCell>
              <Table.HeaderCell align="right" />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {items.map((ff: FeatureFlippingApiModel) => (
              <Table.Row key={ff.id}>
                <Table.Cell>
                  <Link
                    to="/feature-flipping/$id"
                    params={{ id: ff.id }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {ff.nom}
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-text-muted">{ff.key}</span>
                </Table.Cell>
                <Table.Cell>
                  <select
                    aria-label={`État de ${ff.nom}`}
                    value={ff.etat}
                    disabled={mutation.isPending}
                    onChange={(event) =>
                      mutation.mutate({ id: ff.id, etat: event.target.value as FeatureFlippingEtat })
                    }
                    className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    {ETAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Table.Cell>
                <Table.Cell align="right">
                  <Link
                    to="/feature-flipping/$id"
                    params={{ id: ff.id }}
                    className="text-sm text-primary hover:underline"
                  >
                    Fiche
                  </Link>
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

> Choix : `<select>` natif compact pour le changement d'état inline en table (plutôt que `SegmentedControl`, plus adapté à une fiche). Le `SegmentedControl` est utilisé dans la fiche (Task 13).

- [ ] **Step 3 : Régénérer l'arbre de routes + vérifier**

Run: `pnpm -F @pilote/kpilote-admin exec tsr generate && pnpm -F @pilote/kpilote-admin exec tsc --noEmit`
Expected: `src/routeTree.gen.ts` inclut `/feature-flipping/`, pas d'erreur TS.

- [ ] **Step 4 : Commit**

```bash
git add apps/kpilote-admin/src/routes apps/kpilote-admin/src/routeTree.gen.ts
git commit -m "feat(kpilote-admin): page liste feature flipping + carte"
```

---

## Task 13 : Admin — fiche + modal multi-select utilisateurs

**Files:**
- Create: `apps/kpilote-admin/src/components/FeatureFlippingUtilisateursModal.tsx`
- Create: `apps/kpilote-admin/src/routes/_authed/feature-flipping/$id.tsx`

**Interfaces:**
- Consumes: `featureFlippingQueryOptions`, `modifierEtatFeatureFlipping`, `remplacerUtilisateursAutorises`, `utilisateursAllQueryOptions`, `SegmentedControl`.
- Produces: route `/feature-flipping/$id` (récap + état + liste des autorisés + modal d'édition multi-select).

- [ ] **Step 1 : Créer la modal `FeatureFlippingUtilisateursModal.tsx`**

```tsx
import type { UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { clsxm } from '@/lib/clsxm'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

export function FeatureFlippingUtilisateursModal({
  utilisateursInitiaux,
  pending,
  onValider,
  onClose,
}: {
  utilisateursInitiaux: UtilisateurApiModel[]
  pending: boolean
  onValider: (utilisateurIds: string[]) => void
  onClose: () => void
}) {
  const query = useQuery(utilisateursAllQueryOptions())
  const utilisateurs = query.data ?? []
  const [recherche, setRecherche] = useState('')
  const [selection, setSelection] = useState<Set<string>>(
    () => new Set(utilisateursInitiaux.map((u) => u.id)),
  )

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase()
    if (!terme) return utilisateurs
    return utilisateurs.filter((u) =>
      `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(terme),
    )
  }, [utilisateurs, recherche])

  const toggle = (id: string) =>
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Utilisateurs autorisés</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-text-muted hover:text-text"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-subtle" />
          <input
            autoFocus
            placeholder="Rechercher par nom ou email…"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.isLoading ? (
            <p className="py-6 text-center text-sm text-text-muted">Chargement…</p>
          ) : filtres.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">Aucun utilisateur.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtres.map((utilisateur) => {
                const coche = selection.has(utilisateur.id)
                return (
                  <li key={utilisateur.id}>
                    <label
                      className={clsxm(
                        'flex cursor-pointer items-center gap-3 px-2 py-3 hover:bg-border/30',
                        coche && 'bg-primary/5',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={coche}
                        onChange={() => toggle(utilisateur.id)}
                        className="size-4 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-text">
                          {utilisateur.prenom} {utilisateur.nom}
                        </span>
                        <span className="block truncate text-xs text-text-muted">
                          {utilisateur.email}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-text-muted">{selection.size} sélectionné(s)</span>
          <span className="flex gap-2">
            <Button variant="tertiary" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => onValider([...selection])}
            >
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer la fiche `feature-flipping/$id.tsx`**

```tsx
import type { FeatureFlippingEtat } from '@pilote/kpilote-shared/featureFlipping'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import {
  modifierEtatFeatureFlipping,
  remplacerUtilisateursAutorises,
} from '@/api/featureFlipping'
import { Breadcrumb } from '@/components/Breadcrumb'
import { FeatureFlippingUtilisateursModal } from '@/components/FeatureFlippingUtilisateursModal'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { extractApiError } from '@/lib/apiError'
import { featureFlippingQueryOptions } from '@/queries/featureFlipping'

export const Route = createFileRoute('/_authed/feature-flipping/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(featureFlippingQueryOptions(params.id)),
  component: FeatureFlippingDetailComponent,
})

const ETAT_OPTIONS = [
  { value: 'ACTIVE', label: 'Tous' },
  { value: 'ACTIVE_POUR_UTILISATEUR', label: 'Utilisateurs autorisés' },
  { value: 'DESACTIVE', label: 'Désactivé' },
] as const

function FeatureFlippingDetailComponent() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: ff } = useSuspenseQuery(featureFlippingQueryOptions(id))
  const [error, setError] = useState<string | null>(null)
  const [modaleOuverte, setModaleOuverte] = useState(false)

  const invalider = async () => {
    await queryClient.invalidateQueries({ queryKey: ['feature-flipping'] })
  }

  const etatMutation = useMutation({
    mutationFn: (etat: FeatureFlippingEtat) => modifierEtatFeatureFlipping(id, etat),
    onSuccess: invalider,
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  const utilisateursMutation = useMutation({
    mutationFn: (utilisateurIds: string[]) => remplacerUtilisateursAutorises(id, utilisateurIds),
    onSuccess: async () => {
      setModaleOuverte(false)
      await invalider()
    },
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/feature-flipping" className="hover:text-primary">
          Feature flipping
        </Link>
        <span className="font-medium text-text">{ff.nom}</span>
      </Breadcrumb>
      <PageHeading title={ff.nom} subtitle={<code>{ff.key}</code>} />

      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      <div className="max-w-xl space-y-6">
        <SegmentedControl
          label="État"
          value={ff.etat}
          onValueChange={(etat) => etatMutation.mutate(etat)}
          options={ETAT_OPTIONS}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">
              Utilisateurs autorisés ({ff.utilisateursAutorises.length})
            </h2>
            <Button variant="secondary" size="sm" type="button" onClick={() => setModaleOuverte(true)}>
              Gérer les utilisateurs
            </Button>
          </div>
          {ff.etat !== 'ACTIVE_POUR_UTILISATEUR' ? (
            <p className="mb-2 text-xs text-text-muted">
              Cette liste n’a d’effet que dans l’état « Utilisateurs autorisés ».
            </p>
          ) : null}
          {ff.utilisateursAutorises.length === 0 ? (
            <p className="text-sm text-text-muted">Aucun utilisateur autorisé.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {ff.utilisateursAutorises.map((utilisateur) => (
                <li key={utilisateur.id} className="px-3 py-2 text-sm">
                  <span className="text-text">
                    {utilisateur.prenom} {utilisateur.nom}
                  </span>{' '}
                  <span className="text-text-muted">· {utilisateur.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {modaleOuverte ? (
        <FeatureFlippingUtilisateursModal
          utilisateursInitiaux={ff.utilisateursAutorises}
          pending={utilisateursMutation.isPending}
          onValider={(utilisateurIds) => utilisateursMutation.mutate(utilisateurIds)}
          onClose={() => setModaleOuverte(false)}
        />
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3 : Régénérer l'arbre de routes + vérifier**

Run: `pnpm -F @pilote/kpilote-admin exec tsr generate && pnpm -F @pilote/kpilote-admin lint`
Expected: `/feature-flipping/$id` généré, lint OK.

- [ ] **Step 4 : Vérification manuelle (navigateur)**

Avec kpilote-admin lancé (`pnpm -F @pilote/kpilote-admin dev`) et une session ADMIN + un FF seedé (via `ff:creer` puis migration appliquée) : ouvrir `/feature-flipping`, changer un état dans la liste, ouvrir la fiche, cocher/décocher des utilisateurs dans la modal, enregistrer, vérifier la persistance après rechargement.

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-admin/src/components/FeatureFlippingUtilisateursModal.tsx apps/kpilote-admin/src/routes apps/kpilote-admin/src/routeTree.gen.ts
git commit -m "feat(kpilote-admin): fiche feature flipping + modal utilisateurs"
```

---

## Task 14 : Webapp — hook `useFeatureFlipping`

**Files:**
- Create: `apps/kpilote-webapp/src/api/meFeatureFlipping.ts`
- Create: `apps/kpilote-webapp/src/queries/meFeatureFlipping.ts`
- Modify: `apps/kpilote-webapp/src/routes/_authenticated.tsx`

**Interfaces:**
- Consumes: `apiClient`, `meFeatureFlippingApiModelSchema`.
- Produces: `meFeatureFlippingQueryOptions()`, `loadMeFeatureFlipping({ queryClient })`, `useFeatureFlipping(key: string): boolean`.

- [ ] **Step 1 : Créer `src/api/meFeatureFlipping.ts`**

```ts
import {
  type MeFeatureFlippingApiModel,
  meFeatureFlippingApiModelSchema,
} from '@pilote/kpilote-shared/meFeatureFlipping'

import { apiClient } from '@/api/client'

export const fetchMeFeatureFlipping = async (): Promise<MeFeatureFlippingApiModel> => {
  const json = await apiClient.get('me/feature-flipping').json()
  return meFeatureFlippingApiModelSchema.parse(json)
}
```

- [ ] **Step 2 : Créer `src/queries/meFeatureFlipping.ts`**

```ts
import { type QueryClient, queryOptions, useSuspenseQuery } from '@tanstack/react-query'

import { fetchMeFeatureFlipping } from '@/api/meFeatureFlipping'

import { DEFAULT_STALE_TIME } from './utils'

export const meFeatureFlippingQueryOptions = () =>
  queryOptions({
    queryKey: ['me', 'feature-flipping'],
    queryFn: fetchMeFeatureFlipping,
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadMeFeatureFlipping = ({ queryClient }: { queryClient: QueryClient }) =>
  queryClient.ensureQueryData(meFeatureFlippingQueryOptions())

export const useFeatureFlipping = (key: string): boolean => {
  const { data } = useSuspenseQuery(meFeatureFlippingQueryOptions())
  return data.features.includes(key)
}
```

- [ ] **Step 3 : Précharger dans le loader `_authenticated.tsx`**

Ajouter l'import et l'appel dans `Promise.all` :

```ts
import { loadMeFeatureFlipping } from '@/queries/meFeatureFlipping'
// …
  loader: ({ context }) =>
    Promise.all([
      loadMePermissions({ queryClient: context.queryClient }),
      loadMeFeatureFlipping({ queryClient: context.queryClient }),
      loadAllIndicateurs({ queryClient: context.queryClient }),
    ]),
```

- [ ] **Step 4 : Vérifier**

Run: `pnpm -F @pilote/kpilote-webapp lint`
Expected: OK. (Le hook s'utilise ensuite via `const actif = useFeatureFlipping('ma_key'); if (!actif) return null`.)

- [ ] **Step 5 : Commit**

```bash
git add apps/kpilote-webapp/src/api/meFeatureFlipping.ts apps/kpilote-webapp/src/queries/meFeatureFlipping.ts apps/kpilote-webapp/src/routes/_authenticated.tsx
git commit -m "feat(kpilote-webapp): hook useFeatureFlipping"
```

---

## Vérification finale

- [ ] Lint des 4 packages : `pnpm -F @pilote/kpilote-shared lint && pnpm -F @pilote/kpilote-api lint && pnpm -F @pilote/kpilote-admin lint && pnpm -F @pilote/kpilote-webapp lint`
- [ ] Tests back : `pnpm -F @pilote/kpilote-api test` (tous verts)
- [ ] Walkthrough e2e manuel : seed d'un FF (`ff:creer` + migration), admin (liste → état → fiche → modal), puis dans la webapp `useFeatureFlipping('<key>')` renvoie bien `true`/`false` selon l'état et l'appartenance de l'utilisateur.
