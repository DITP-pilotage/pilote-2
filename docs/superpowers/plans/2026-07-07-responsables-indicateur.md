# Responsables d'indicateur — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la notion de responsables aux indicateurs (lecture seule) en embarquant les responsables dans le GET détail, et uniformiser le panier de la même façon (suppression de sa route dédiée).

**Architecture:** Table `IndicateurResponsable` miroir de `PanierResponsable`. Les responsables sont joints dans `getPanierByPublicId` / `getIndicateurByPublicId` et projetés dans les modèles API partagés (nouveau schéma partagé `responsable`). Côté webapp, les onglets consomment l'objet déjà chargé (plus de fetch séparé) via un composant `ResponsablesList` partagé. Aucune écriture (assignation par seed/fixtures).

**Tech Stack:** Prisma 7.8, Hono/OpenAPI + neverthrow (mb-api), Zod (mb-shared), React + TanStack Router/Query (mb-webapp), Vitest.

## Global Constraints

- **Named exports/imports uniquement** — jamais de `default`.
- **Params de fonction en objet nommé** pour les helpers (pas de positionnels).
- **neverthrow** : queries retournent `ResultAsync`, wrap des promesses externes avec `ResultAsync.fromSafePromise` / `.fromPromise`.
- **Routes mb-api** : schémas Zod + `createRoute` + handler dans le même fichier de route.
- **Tests mb-api** : `integrationTest(...)`, `fixtures.<entity>(...)`, `runAsPrincipal`, valeurs hardcodées (isolation transactionnelle), pas de random.
- **UI** : composant réutilisable factorisé plutôt que markup dupliqué.
- **Lecture seule** : aucune route/UI d'écriture des responsables.
- **Hors scope** : écriture des responsables. (Les contacts utiles du panier, initialement hors scope, ont finalement été embarqués dans le GET détail et leur route supprimée suite au retour de revue PR-2251.)
- Commandes de vérif :
  - mb-api tous les tests : `pnpm -F @pilote/mb-api test`
  - mb-api un fichier : `pnpm -F @pilote/mb-api exec vitest run <path>`
  - mb-api lint/typecheck : `pnpm -F @pilote/mb-api lint`
  - mb-webapp typecheck+lint : `pnpm -F @pilote/mb-webapp lint`
  - migration dev : `pnpm -F @pilote/mb-api database:migration`

---

## File Structure

**mb-api**
- `prisma/schema.prisma` — nouveau modèle `IndicateurResponsable` + relations sur `Indicateur` et `Utilisateur`.
- `prisma/migrations/<ts>_add_indicateur_responsable/migration.sql` — généré.
- `prisma/seed.ts` — bloc responsables indicateur (miroir PAN-005).
- `src/panier/utils.ts` — `toPanierApiModel` projette `responsables`.
- `src/panier/queries/getPanierByPublicId.ts` — `include.responsables`.
- `src/indicateur/utils.ts` — `toIndicateurApiModel` projette `responsables`.
- `src/indicateur/queries/getIndicateurByPublicId.ts` — `include.responsables`.
- `src/test/fixtures.ts` — nouvelle fixture `indicateurResponsable`.
- `src/panier/routes.ts` — suppression route `GET /paniers/{id}/responsables` (task 6).
- `src/panier/queries/getPanierResponsables.ts` + `.test.ts` — supprimés (task 6).

**mb-shared**
- `packages/mb-shared/src/responsable.ts` — nouveau schéma partagé.
- `packages/mb-shared/package.json` — export `./responsable` (ajout), export `./panierResponsable` (retrait task 6).
- `packages/mb-shared/src/panier.ts` — champ `responsables`.
- `packages/mb-shared/src/indicateur.ts` — champ `responsables`.
- `packages/mb-shared/src/panierResponsable.ts` — supprimé (task 6).

**mb-webapp**
- `src/components/ui/ResponsablesList.tsx` — nouveau composant partagé.
- `src/components/paniers/PanierGouvernanceTab.tsx` — consomme `responsables` en prop.
- `src/routes/_authenticated/paniers/$id.tsx` — retrait prefetch/queryOptions responsables, passe `panier.responsables`.
- `src/api/paniers.ts` + `src/queries/paniers.ts` — retrait `fetchPanierResponsables` / `panierResponsablesQueryOptions`.
- `src/components/indicateurs/IndicateurMetadonnees.tsx` — rend `ResponsablesList` sous la description list (via prop `responsables`).

---

## Task 1: Modèle Prisma `IndicateurResponsable` + migration + seed

**Files:**
- Modify: `apps/mb-api/prisma/schema.prisma` (modèle `Indicateur` ~ligne 89-113, `Utilisateur` ~ligne 36-51, nouveau modèle après `PanierResponsable` ~ligne 354)
- Create: `apps/mb-api/prisma/migrations/<timestamp>_add_indicateur_responsable/migration.sql` (généré)
- Modify: `apps/mb-api/prisma/seed.ts` (après le bloc responsables panier ~ligne 826)

**Interfaces:**
- Produces: table `indicateur_responsable`, relation `Indicateur.responsables`, relation `Utilisateur.responsabilitesIndicateur`, modèle Prisma généré `IndicateurResponsableModel`.

- [ ] **Step 1: Ajouter le modèle et les relations dans `schema.prisma`**

Dans le modèle `Indicateur`, ajouter à la liste des relations (à côté de `paniers`) :

```prisma
  responsables         IndicateurResponsable[]
```

Dans le modèle `Utilisateur`, ajouter sous `responsabilites` :

```prisma
  responsabilitesIndicateur IndicateurResponsable[]
```

Ajouter le nouveau modèle juste après `PanierResponsable` :

```prisma
model IndicateurResponsable {
  indicateurId  String   @map("indicateur_id") @db.Uuid
  utilisateurId String   @map("utilisateur_id") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")

  indicateur  Indicateur  @relation(fields: [indicateurId], references: [id], onDelete: Cascade)
  utilisateur Utilisateur @relation(fields: [utilisateurId], references: [id], onDelete: Cascade)

  @@id([indicateurId, utilisateurId])
  @@index([indicateurId, createdAt])
  @@map("indicateur_responsable")
}
```

- [ ] **Step 2: Générer la migration**

Run: `pnpm -F @pilote/mb-api database:migration` (nom : `add_indicateur_responsable` quand prompté)
Expected: migration créée sous `prisma/migrations/<ts>_add_indicateur_responsable/`, client Prisma régénéré, DB de dev à jour.

- [ ] **Step 3: Vérifier le SQL généré**

Ouvrir le `migration.sql` créé et vérifier qu'il contient `CREATE TABLE "indicateur_responsable"` avec la PK composite `(indicateur_id, utilisateur_id)`, l'index `(indicateur_id, created_at)` et les deux FK `ON DELETE CASCADE`.

- [ ] **Step 4: Ajouter le seed (miroir du bloc PAN-005)**

Dans `seed.ts`, juste après `const panierResponsablesCount = 2` (~ligne 826), ajouter un bloc désignant des responsables sur un indicateur existant. Repérer un `publicId` d'indicateur présent dans le seed (chercher `indicateur.upsert` / `indicateursByPublicId`) et réutiliser `ditpAdmin.id` + `claireDupont.id` déjà résolus plus haut :

```ts
  // Responsables indicateur : ditp.admin et claire.dupont sont responsables de IND-001.
  const ind001 = indicateursByPublicId.get('IND-001')!
  for (const utilisateurId of [ditpAdmin.id, claireDupont.id]) {
    await prisma.indicateurResponsable.upsert({
      where: { indicateurId_utilisateurId: { indicateurId: ind001.id, utilisateurId } },
      update: {},
      create: { indicateurId: ind001.id, utilisateurId },
    })
  }
  const indicateurResponsablesCount = 2
```

Adapter `IND-001` et la source du map (`indicateursByPublicId`) au nom réel utilisé dans `seed.ts`. Si un `console.log` récapitulatif liste les compteurs, y ajouter `indicateurResponsablesCount`.

- [ ] **Step 5: Rejouer le seed**

Run: `pnpm -F @pilote/mb-api exec prisma db seed`
Expected: exécution sans erreur.

- [ ] **Step 6: Commit**

```bash
git add apps/mb-api/prisma
git commit -m "feat(db): table indicateur_responsable + seed"
```

---

## Task 2: Schéma partagé `responsable` (mb-shared)

**Files:**
- Create: `packages/mb-shared/src/responsable.ts`
- Modify: `packages/mb-shared/package.json` (bloc `exports`, ajouter `./responsable`)

**Interfaces:**
- Produces: `responsableApiModelSchema` (Zod object), type `ResponsableApiModel`.

- [ ] **Step 1: Créer le fichier partagé**

`packages/mb-shared/src/responsable.ts` :

```ts
import { z } from 'zod'

export const responsableApiModelSchema = z.object({
  email:    z.string().email(),
  nom:      z.string(),
  prenom:   z.string(),
  service:  z.string(),
  fonction: z.string(),
})
export type ResponsableApiModel = z.infer<typeof responsableApiModelSchema>
```

- [ ] **Step 2: Déclarer l'export du package**

Dans `packages/mb-shared/package.json`, ajouter dans `exports` (à côté de `./panierResponsable`) :

```json
    "./responsable": {
      "types": "./src/responsable.ts",
      "default": "./src/responsable.ts"
    },
```

- [ ] **Step 3: Vérifier le typecheck partagé via un consommateur**

Run: `pnpm -F @pilote/mb-api exec tsc --noEmit`
Expected: PASS (aucun import cassé ; le fichier est autonome).

- [ ] **Step 4: Commit**

```bash
git add packages/mb-shared/src/responsable.ts packages/mb-shared/package.json
git commit -m "feat(mb-shared): schéma partagé responsable"
```

---

## Task 3: Embarquer les responsables dans le GET détail panier (backend)

Additif : on garde temporairement la route/query `getPanierResponsables` (retirées en task 6) pour ne pas casser le webapp entre deux tasks.

**Files:**
- Modify: `packages/mb-shared/src/panier.ts` (`panierApiModelSchema`)
- Modify: `apps/mb-api/src/panier/queries/getPanierByPublicId.ts` (`include`)
- Modify: `apps/mb-api/src/panier/utils.ts` (`PanierWithIndicateurs`, `toPanierApiModel`)
- Test: `apps/mb-api/src/panier/queries/getPanierByPublicId.test.ts`

**Interfaces:**
- Consumes: `responsableApiModelSchema` (Task 2).
- Produces: `panierApiModelSchema.responsables: ResponsableApiModel[]` (tri `createdAt ASC`).

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter dans `getPanierByPublicId.test.ts` (suivre le style des `it` existants — `integrationTest`, `fixtures`, `runAsPrincipal`) :

```ts
  it(
    'retourne les responsables du panier triés par ordre d’assignation',
    integrationTest(async () => {
      const panId = testPanierId()
      await fixtures.panierResponsable(
        {
          panier: { publicId: panId, visibilite: 'PUBLIC' },
          utilisateur: {
            email: `resp-a-${panId}@example.com`,
            nom: 'Martin',
            prenom: 'Alice',
            service: 'DITP',
            fonction: 'Chargée de mission',
          },
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panId))

      expect(result._unsafeUnwrap().responsables).toEqual([
        {
          email: `resp-a-${panId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      ])
    }),
  )
```

Vérifier que `testPanierId` est importé (sinon l'ajouter depuis `@/test/randomIds`).

- [ ] **Step 2: Lancer le test — échec attendu**

Run: `pnpm -F @pilote/mb-api exec vitest run src/panier/queries/getPanierByPublicId.test.ts`
Expected: FAIL (propriété `responsables` absente du modèle / du résultat).

- [ ] **Step 3: Ajouter le champ au schéma partagé**

Dans `packages/mb-shared/src/panier.ts`, importer le schéma responsable en tête :

```ts
import { responsableApiModelSchema } from './responsable'
```

Puis, dans `panierApiModelSchema`, ajouter après `indicateurIds` :

```ts
  responsables: z
    .array(responsableApiModelSchema)
    .describe("Utilisateurs désignés responsables du panier, triés par ordre d'assignation (createdAt ASC)."),
```

- [ ] **Step 4: Joindre les responsables dans la query**

Dans `getPanierByPublicId.ts`, étendre l'`include` :

```ts
      include: {
        indicateurs: {
          orderBy: { createdAt: 'asc' },
          include: { indicateur: { select: { publicId: true } } },
        },
        responsables: {
          orderBy: { createdAt: 'asc' },
          include: { utilisateur: true },
        },
      },
```

- [ ] **Step 5: Projeter dans le mapper**

Dans `panier/utils.ts`, étendre le type et le mapper :

```ts
import { type PanierApiModel } from '@pilote/mb-shared/panier'

import {
  type IndicateurModel,
  type PanierModel,
  type UtilisateurModel,
} from '@/generated/prisma/models'

export type PanierWithIndicateurs = PanierModel & {
  indicateurs: Array<{ indicateur: Pick<IndicateurModel, 'publicId'> }>
  responsables: Array<{ utilisateur: UtilisateurModel }>
}

export const toPanierApiModel = (panier: PanierWithIndicateurs): PanierApiModel => ({
  id: panier.publicId,
  nom: panier.nom,
  description: panier.description,
  visibilite: panier.visibilite,
  indicateurIds: panier.indicateurs.map((lien) => lien.indicateur.publicId),
  responsables: panier.responsables.map(({ utilisateur: u }) => ({
    email: u.email,
    nom: u.nom,
    prenom: u.prenom,
    service: u.service,
    fonction: u.fonction,
  })),
  createdAt: panier.createdAt.toISOString(),
  updatedAt: panier.updatedAt.toISOString(),
})
```

- [ ] **Step 6: Lancer le test — succès attendu**

Run: `pnpm -F @pilote/mb-api exec vitest run src/panier/queries/getPanierByPublicId.test.ts`
Expected: PASS.

- [ ] **Step 7: Lint/typecheck**

Run: `pnpm -F @pilote/mb-api lint`
Expected: PASS (le `getPanierResponsables` existant compile toujours).

- [ ] **Step 8: Commit**

```bash
git add packages/mb-shared/src/panier.ts apps/mb-api/src/panier
git commit -m "feat(panier): embarquer les responsables dans le GET détail"
```

---

## Task 4: Embarquer les responsables dans le GET détail indicateur (backend) + fixture

**Files:**
- Modify: `apps/mb-api/src/test/fixtures.ts` (nouvelle fixture `indicateurResponsable`)
- Modify: `packages/mb-shared/src/indicateur.ts` (`indicateurApiModelSchema`)
- Modify: `apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.ts` (`include`)
- Modify: `apps/mb-api/src/indicateur/utils.ts` (`IndicateurWithReferentiels`, `toIndicateurApiModel`)
- Test: `apps/mb-api/src/indicateur/queries/getIndicateurByPublicId.test.ts`

**Interfaces:**
- Consumes: `responsableApiModelSchema` (Task 2), modèle Prisma `IndicateurResponsable` (Task 1).
- Produces: `fixtures.indicateurResponsable({ indicateur, utilisateur })`, `indicateurApiModelSchema.responsables: ResponsableApiModel[]`.

- [ ] **Step 1: Ajouter la fixture `indicateurResponsable`**

Dans `fixtures.ts`, en miroir du bloc `PanierResponsable` (~ligne 763), ajouter (importer `IndicateurResponsableModel` depuis `@/generated/prisma/models` dans le bloc d'imports de types existant) :

```ts
// --- IndicateurResponsable (deps requises) -----------------------------------

type IndicateurResponsableOverrides = {
  indicateur: IndicateurOverrides
  utilisateur: UtilisateurOverrides
}

const upsertIndicateurResponsable = async (o: IndicateurResponsableOverrides) => {
  const indicateurRow = await upsertIndicateur(o.indicateur)
  const utilisateurRow = await upsertUtilisateur(o.utilisateur)
  return db().indicateurResponsable.upsert({
    where: {
      indicateurId_utilisateurId: {
        indicateurId: indicateurRow.id,
        utilisateurId: utilisateurRow.id,
      },
    },
    update: {},
    create: { indicateurId: indicateurRow.id, utilisateurId: utilisateurRow.id },
  })
}

function indicateurResponsable(
  override: IndicateurResponsableOverrides,
): Promise<IndicateurResponsableModel>
function indicateurResponsable(
  o1: IndicateurResponsableOverrides,
  o2: IndicateurResponsableOverrides,
  ...rest: IndicateurResponsableOverrides[]
): Promise<IndicateurResponsableModel[]>
async function indicateurResponsable(
  ...overrides: IndicateurResponsableOverrides[]
): Promise<IndicateurResponsableModel | IndicateurResponsableModel[]> {
  if (overrides.length === 1) return upsertIndicateurResponsable(overrides[0]!)
  const results: IndicateurResponsableModel[] = []
  for (const o of overrides) results.push(await upsertIndicateurResponsable(o))
  return results
}
```

Puis exposer dans l'objet `fixtures` (~ligne 935, à côté de `panierResponsable`) :

```ts
  indicateurResponsable,
```

Vérifier que les helpers `upsertIndicateur` et `upsertUtilisateur` et le type `IndicateurOverrides` / `UtilisateurOverrides` existent déjà (utilisés ailleurs dans le fichier) — c'est le cas.

- [ ] **Step 2: Écrire le test qui échoue**

Dans `getIndicateurByPublicId.test.ts`, ajouter deux cas — projection + accès via panier (spécificité indicateur) :

```ts
  it(
    'retourne les responsables de l’indicateur triés par ordre d’assignation',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateurResponsable({
        indicateur: { publicId: indId, visibilite: 'PUBLIC' },
        utilisateur: {
          email: `resp-${indId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result._unsafeUnwrap().responsables).toEqual([
        {
          email: `resp-${indId}@example.com`,
          nom: 'Martin',
          prenom: 'Alice',
          service: 'DITP',
          fonction: 'Chargée de mission',
        },
      ])
    }),
  )

  it(
    'expose les responsables via une permission READ propagée par un panier',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const panId = testPanierId()
      await fixtures.indicateurResponsable({
        indicateur: { publicId: indId, visibilite: 'PRIVE' },
        utilisateur: { email: `resp2-${indId}@example.com` },
      })
      await db().panierIndicateur.create({
        data: {
          panier: { connect: { publicId: panId } },
          indicateur: { connect: { publicId: indId } },
        },
      })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: panId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getIndicateurByPublicId(indId))

      expect(result._unsafeUnwrap().responsables).toHaveLength(1)
    }),
  )
```

Vérifier les imports en tête du fichier : `testPanierId` depuis `@/test/randomIds` (ajouter si absent). Pour le panier PRIVE lié, adapter la création du lien `panierIndicateur` au helper existant s'il y en a un (chercher `fixtures.panier` avec `indicateurs`) — sinon la création directe ci-dessus convient. Le champ `panierPermissions` sur `fixtures.apiKey` existe (cf. `getPanierResponsables.test.ts`).

- [ ] **Step 3: Lancer les tests — échec attendu**

Run: `pnpm -F @pilote/mb-api exec vitest run src/indicateur/queries/getIndicateurByPublicId.test.ts`
Expected: FAIL (`responsables` absent).

- [ ] **Step 4: Ajouter le champ au schéma partagé**

Dans `packages/mb-shared/src/indicateur.ts`, importer en tête :

```ts
import { responsableApiModelSchema } from './responsable'
```

Dans `indicateurApiModelSchema`, ajouter après `referentiels` :

```ts
  responsables: z
    .array(responsableApiModelSchema)
    .describe("Utilisateurs désignés responsables de l'indicateur, triés par ordre d'assignation (createdAt ASC)."),
```

- [ ] **Step 5: Joindre les responsables dans la query**

Dans `getIndicateurByPublicId.ts`, étendre l'`include` :

```ts
      include: {
        referentiels: { include: { referentiel: true } },
        responsables: {
          orderBy: { createdAt: 'asc' },
          include: { utilisateur: true },
        },
      },
```

- [ ] **Step 6: Projeter dans le mapper**

Dans `indicateur/utils.ts`, étendre le type et le mapper. Ajouter `UtilisateurModel` à l'import `@/generated/prisma/models`, puis :

```ts
export type IndicateurWithReferentiels = IndicateurModel & {
  referentiels: Array<{
    fonctionAgregation: FonctionAgregation
    referentiel: ReferentielModel
  }>
  responsables: Array<{ utilisateur: UtilisateurModel }>
}
```

Et dans l'objet retourné par `toIndicateurApiModel`, ajouter après `referentiels: [...]` :

```ts
  responsables: indicateur.responsables.map(({ utilisateur: u }) => ({
    email: u.email,
    nom: u.nom,
    prenom: u.prenom,
    service: u.service,
    fonction: u.fonction,
  })),
```

- [ ] **Step 7: Lancer les tests — succès attendu**

Run: `pnpm -F @pilote/mb-api exec vitest run src/indicateur/queries/getIndicateurByPublicId.test.ts`
Expected: PASS.

- [ ] **Step 8: Lint/typecheck**

Run: `pnpm -F @pilote/mb-api lint`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/mb-shared/src/indicateur.ts apps/mb-api/src/indicateur apps/mb-api/src/test/fixtures.ts
git commit -m "feat(indicateur): embarquer les responsables dans le GET détail"
```

---

## Task 5: Webapp — composant `ResponsablesList` partagé + branchement panier & indicateur

Aucun test unitaire de composant dans ce repo pour cette zone : vérification par `lint` (tsc --noEmit) et lecture. Le composant `ResponsablesList` reprend à l'identique le markup actuel de `PanierGouvernanceTab`.

**Files:**
- Create: `apps/mb-webapp/src/components/ui/ResponsablesList.tsx`
- Modify: `apps/mb-webapp/src/components/paniers/PanierGouvernanceTab.tsx`
- Modify: `apps/mb-webapp/src/routes/_authenticated/paniers/$id.tsx`
- Modify: `apps/mb-webapp/src/api/paniers.ts`
- Modify: `apps/mb-webapp/src/queries/paniers.ts`
- Modify: `apps/mb-webapp/src/components/indicateurs/IndicateurMetadonnees.tsx`

**Interfaces:**
- Consumes: `panierApiModelSchema.responsables`, `indicateurApiModelSchema.responsables` (Tasks 3-4).
- Produces: `ResponsablesList({ responsables })` où `responsables: ResponsableApiModel[]`.

- [ ] **Step 1: Créer `ResponsablesList`**

`apps/mb-webapp/src/components/ui/ResponsablesList.tsx` (markup extrait de `PanierGouvernanceTab`) :

```tsx
import { Mail } from 'lucide-react'
import { type ResponsableApiModel } from '@pilote/mb-shared/responsable'

import { EmptyState } from '@/components/ui/EmptyState'
import { Text } from '@/components/ui/Typography'

function Initiales({ nom, prenom }: { nom: string; prenom: string }) {
  const initiales = [prenom, nom]
    .filter(Boolean)
    .map((s) => s[0]!.toUpperCase())
    .join('')
    .slice(0, 2)
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary select-none">
      {initiales || '?'}
    </div>
  )
}

export function ResponsablesList({ responsables }: { responsables: ResponsableApiModel[] }) {
  if (responsables.length === 0) {
    return <EmptyState title="Aucun responsable désigné." />
  }
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {responsables.map((r) => {
        const nomComplet = [r.prenom, r.nom].filter(Boolean).join(' ')
        const meta = [r.fonction, r.service].filter(Boolean).join(' · ')
        return (
          <li key={r.email} className="flex items-center gap-4 px-5 py-4">
            <Initiales nom={r.nom} prenom={r.prenom} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Text weight="medium">{nomComplet || r.email}</Text>
              {meta && (
                <Text variant="caption" tone="muted">
                  {meta}
                </Text>
              )}
            </div>
            <a
              href={`mailto:${r.email}`}
              aria-label={`Envoyer un email à ${r.email}`}
              className="flex shrink-0 items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              <Mail className="size-4" aria-hidden />
              <span className="hidden sm:inline">{r.email}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 2: Simplifier `PanierGouvernanceTab` pour consommer une prop**

Remplacer intégralement `PanierGouvernanceTab.tsx` par une version qui reçoit `responsables` et `panierId` (le fetch responsables disparaît ; les contacts utiles restent via `panierId`) :

```tsx
import { type ResponsableApiModel } from '@pilote/mb-shared/responsable'

import { PanierContactsUtiles } from '@/components/paniers/PanierContactsUtiles'
import { ResponsablesList } from '@/components/ui/ResponsablesList'
import { Heading } from '@/components/ui/Typography'

export function PanierGouvernanceTab({
  panierId,
  responsables,
}: {
  panierId: string
  responsables: ResponsableApiModel[]
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Heading size="sm">Responsables</Heading>
        <ResponsablesList responsables={responsables} />
      </div>

      <PanierContactsUtiles panierId={panierId} />
    </div>
  )
}
```

- [ ] **Step 3: Adapter la route panier `$id.tsx`**

Dans `apps/mb-webapp/src/routes/_authenticated/paniers/$id.tsx` :
- Retirer l'import `panierResponsablesQueryOptions` (ligne ~31).
- Retirer la ligne de prefetch `queryClient.prefetchQuery(panierResponsablesQueryOptions(params.id)),` (ligne ~82).
- Passer les responsables au tab (ligne ~199) :

```tsx
            <PanierGouvernanceTab panierId={id} responsables={panier.responsables} />
```

`panier` est déjà chargé via `useSuspenseQuery(panierQueryOptions(id))` (ligne ~98). Le `Suspense` autour du tab peut rester (inoffensif) ou être retiré ; le laisser.

- [ ] **Step 4: Retirer `fetchPanierResponsables` et `panierResponsablesQueryOptions`**

Dans `apps/mb-webapp/src/api/paniers.ts` : supprimer la fonction `fetchPanierResponsables` (lignes ~46-51) et les imports devenus inutiles de `@pilote/mb-shared/panierResponsable` (lignes ~13-15).

Dans `apps/mb-webapp/src/queries/paniers.ts` : supprimer `panierResponsablesQueryOptions` (lignes ~57-62) et l'import `fetchPanierResponsables` (ligne ~7).

- [ ] **Step 5: Afficher les responsables dans l'onglet Métadonnées de l'indicateur**

Dans `apps/mb-webapp/src/components/indicateurs/IndicateurMetadonnees.tsx` :
- Ajouter aux imports :

```tsx
import { type ResponsableApiModel } from '@pilote/mb-shared/responsable'

import { Heading } from '@/components/ui/Typography'
import { ResponsablesList } from '@/components/ui/ResponsablesList'
```

- Ajouter `responsables` au type de prop `indicateur` :

```ts
    responsables: ReadonlyArray<ResponsableApiModel>
```

- Envelopper le rendu actuel et ajouter une section sous la `DescriptionList` :

```tsx
  return (
    <div className="flex flex-col gap-8">
      <DescriptionList>
        {/* … items existants inchangés … */}
      </DescriptionList>

      <div className="flex flex-col gap-4">
        <Heading size="sm">Responsables</Heading>
        <ResponsablesList responsables={[...indicateur.responsables]} />
      </div>
    </div>
  )
```

(`indicateur.responsables` vient de l'objet déjà chargé via `useSuspenseQuery(indicateurQueryOptions(id))` dans la route indicateur `$id.tsx` ligne ~91 ; aucun fetch ni prefetch à ajouter.)

- [ ] **Step 6: Typecheck + lint webapp**

Run: `pnpm -F @pilote/mb-webapp lint`
Expected: PASS (plus aucune référence à `fetchPanierResponsables` / `panierResponsablesQueryOptions` / `mb-shared/panierResponsable` dans le webapp).

- [ ] **Step 7: Commit**

```bash
git add apps/mb-webapp/src
git commit -m "feat(webapp): responsables via l'objet détail (panier + indicateur)"
```

---

## Task 6: Nettoyage — suppression route/query panier responsables + `panierResponsable.ts`

Tous les consommateurs de l'ancien mécanisme sont migrés (backend task 3, webapp task 5). On supprime le code mort.

**Files:**
- Delete: `apps/mb-api/src/panier/queries/getPanierResponsables.ts`
- Delete: `apps/mb-api/src/panier/queries/getPanierResponsables.test.ts`
- Modify: `apps/mb-api/src/panier/routes.ts` (retrait route + schéma + handler responsables)
- Delete: `packages/mb-shared/src/panierResponsable.ts`
- Modify: `packages/mb-shared/package.json` (retrait export `./panierResponsable`)

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: surface API réduite (plus de `GET /paniers/{id}/responsables`).

- [ ] **Step 1: Supprimer la query et son test**

```bash
git rm apps/mb-api/src/panier/queries/getPanierResponsables.ts \
       apps/mb-api/src/panier/queries/getPanierResponsables.test.ts
```

- [ ] **Step 2: Retirer la route responsables de `panier/routes.ts`**

Dans `apps/mb-api/src/panier/routes.ts`, supprimer :
- l'import `import { getPanierResponsables } from '@/panier/queries/getPanierResponsables'` (~ligne 43) ;
- l'import et l'usage `panierResponsablesApiModelSchema` / `PanierResponsablesApiModelSchema` (~lignes 14, 53-56) depuis `@pilote/mb-shared/panierResponsable` ;
- la définition `getPanierResponsablesRoute` (~lignes 135-154) ;
- le bloc `panierRoutes.openapi(getPanierResponsablesRoute, …)` (~lignes 227-240).

- [ ] **Step 3: Supprimer le schéma partagé obsolète**

```bash
git rm packages/mb-shared/src/panierResponsable.ts
```

Dans `packages/mb-shared/package.json`, supprimer le bloc d'export `./panierResponsable` (~lignes 87-90).

- [ ] **Step 4: Vérifier qu'il ne reste aucune référence**

Run: `grep -rn "panierResponsable\|getPanierResponsables\|PanierResponsablesApiModel" apps packages --include=*.ts --include=*.tsx | grep -v node_modules`
Expected: aucune sortie (le modèle Prisma `PanierResponsable`, lui, reste — ce grep ne matche que le camelCase/schéma ; vérifier que les seules occurrences éventuelles sont `db().panierResponsable` dans `fixtures.ts` et `seed.ts`, qui sont légitimes).

- [ ] **Step 5: Lint/typecheck des deux apps**

Run: `pnpm -F @pilote/mb-api lint && pnpm -F @pilote/mb-webapp lint`
Expected: PASS pour les deux.

- [ ] **Step 6: Suite complète mb-api**

Run: `pnpm -F @pilote/mb-api test`
Expected: PASS (les cas de `getPanierResponsables` supprimés sont couverts par ceux ajoutés dans `getPanierByPublicId.test.ts` en task 3).

- [ ] **Step 7: Commit**

```bash
git add apps/mb-api/src/panier/routes.ts packages/mb-shared/package.json
git commit -m "refactor(panier): supprimer la route/query responsables dédiée"
```

---

## Self-Review (effectuée)

- **Spec coverage :** table indicateur (T1) · schéma partagé (T2) · embed panier + suppression route (T3+T6) · embed indicateur + accès via panier (T4) · UI panier & indicateur + composant partagé (T5) · seed (T1) · hors scope contacts utiles/écriture respectés. ✅
- **Placeholders :** aucun ; tout le code est fourni. Les `~ligne N` sont des repères indicatifs, le code cité est exact. ✅
- **Type consistency :** `responsableApiModelSchema` / `ResponsableApiModel` cohérents T2→T3→T4→T5 ; `PanierWithIndicateurs` et `IndicateurWithReferentiels` étendus avec `responsables: Array<{ utilisateur: UtilisateurModel }>` ; `ResponsablesList({ responsables })` signature identique côté panier et indicateur. ✅
