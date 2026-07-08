# Administration des responsables d'indicateur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un administrateur de gérer (ajouter / retirer) les responsables d'un indicateur depuis `kpilote-admin`, via le formulaire d'édition existant.

**Architecture:** On ajoute un champ optionnel `responsables` (UUIDs, replace-all) au body du `PUT /indicateurs/:id` existant : l'écriture est atomique dans la transaction de l'upsert, aucune nouvelle route. Le modèle de lecture des responsables est enrichi de l'`id` utilisateur pour permettre le pré-remplissage côté admin. Côté admin, une section « Responsables » est ajoutée au formulaire, alimentée par un `FieldSelect` peuplé de tous les utilisateurs.

**Tech Stack:** TypeScript, Zod, Prisma, Hono (API) ; React 19, React Hook Form, TanStack Query, `ky` (admin) ; Vitest (tests API intégration).

## Global Constraints

- **Named exports/imports uniquement** — jamais de `export default`.
- **Paramètres de fonction** : privilégier un objet nommé pour les helpers à plusieurs paramètres (les helpers existants du fichier `upsertIndicateur.ts` prennent des positionnels ; on suit le style local du fichier).
- **neverthrow** : les commands retournent `ResultAsync` ; on n'ajoute pas de nouvelle command, on étend `upsertIndicateur` (déjà en `ResultAsync`).
- **Tests API** : `uuidv7` (pas `randomUUID`), valeurs hardcodées (isolation transactionnelle), fixtures `fixtures.<entity>(...)`.
- **Prisma** : pas de `$transaction` nesté ; pas de `select` granulaires (findMany + map) ; filtres enum sans `as const`.
- **Le champ `responsables` du body est optionnel** : absent = « ne pas toucher » ; présent (y compris `[]`) = replace-all.
- Commandes test API : `pnpm -F @pilote/kpilote-api test <chemin-relatif>` (nécessite la base de test up, comme d'habitude). Lint API : `pnpm -F @pilote/kpilote-api lint`. Lint admin (inclut `tsc --noEmit`) : `pnpm -F @pilote/kpilote-admin lint`.

---

## File Structure

**API (`kpilote-api` / `kpilote-shared`)**
- `packages/kpilote-shared/src/responsable.ts` — ajout `id` au read model.
- `packages/kpilote-shared/src/indicateur.ts` — ajout champ `responsables` au body upsert.
- `apps/kpilote-api/src/indicateur/utils.ts` — sérialisation de `id`.
- `apps/kpilote-api/src/panier/utils.ts` — sérialisation de `id`.
- `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts` — helpers `resoudreResponsables` / `remplacerResponsables` + branchement.
- Tests : `upsertIndicateur.test.ts`, `getIndicateurByPublicId.test.ts`, `getPanierByPublicId.test.ts`.

**Admin (`kpilote-admin`)**
- `apps/kpilote-admin/src/api/utilisateurs.ts` — `fetchAllUtilisateurs`.
- `apps/kpilote-admin/src/components/indicateurs/indicateurFormSchema.ts` — champ `responsables`, `buildInitialValues`, `toUpsertBody`.
- `apps/kpilote-admin/src/components/indicateurs/IndicateurForm.tsx` — section « Responsables ».

Les routes admin (`$id.tsx`, `nouveau.tsx`) ne changent pas : `responsables` transite par `toUpsertBody` → `upsertIndicateur`.

---

## Task 1: Enrichir le read model des responsables avec l'`id`

**Files:**
- Modify: `packages/kpilote-shared/src/responsable.ts`
- Modify: `apps/kpilote-api/src/indicateur/utils.ts` (bloc `responsables:` du `toIndicateurApiModel`)
- Modify: `apps/kpilote-api/src/panier/utils.ts` (bloc `responsables:` du `toPanierApiModel`)
- Test: `apps/kpilote-api/src/indicateur/queries/getIndicateurByPublicId.test.ts`
- Test: `apps/kpilote-api/src/panier/queries/getPanierByPublicId.test.ts`

**Interfaces:**
- Produces: `responsableApiModelSchema` gagne un champ `id: string` (UUID). Utilisé par le read model indicateur/panier et, plus tard, par le form admin.

- [ ] **Step 1: Mettre à jour les assertions de test (indicateur) — doivent échouer**

Dans `getIndicateurByPublicId.test.ts`, test « retourne tous les champs d'un responsable de l'indicateur » : capturer la liaison renvoyée par le fixture et asserter `id`.

```ts
const liaison = await fixtures.indicateurResponsable({
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
    id: liaison.utilisateurId,
    email: `resp-${indId}@example.com`,
    nom: 'Martin',
    prenom: 'Alice',
    service: 'DITP',
    fonction: 'Chargée de mission',
  },
])
```

- [ ] **Step 2: Mettre à jour les assertions de test (panier) — doivent échouer**

Dans `getPanierByPublicId.test.ts`, test « retourne les responsables du panier triés par ordre d'assignation » : idem.

```ts
const liaison = await fixtures.panierResponsable({
  panier: { publicId: panId, visibilite: 'PUBLIC' },
  utilisateur: {
    email: `resp-a-${panId}@example.com`,
    nom: 'Martin',
    prenom: 'Alice',
    service: 'DITP',
    fonction: 'Chargée de mission',
  },
})
const apiKey = await fixtures.apiKey()

const result = await runAsPrincipal(apiKey.id, () => getPanierByPublicId(panId))

expect(result._unsafeUnwrap().responsables).toEqual([
  {
    id: liaison.utilisateurId,
    email: `resp-a-${panId}@example.com`,
    nom: 'Martin',
    prenom: 'Alice',
    service: 'DITP',
    fonction: 'Chargée de mission',
  },
])
```

- [ ] **Step 3: Lancer les tests pour vérifier l'échec**

Run:
```bash
pnpm -F @pilote/kpilote-api test src/indicateur/queries/getIndicateurByPublicId.test.ts src/panier/queries/getPanierByPublicId.test.ts
```
Expected: FAIL — les objets responsables ne contiennent pas encore `id`.

- [ ] **Step 4: Ajouter `id` au schéma partagé**

Dans `packages/kpilote-shared/src/responsable.ts` :

```ts
import { z } from 'zod'

export const responsableApiModelSchema = z.object({
  id: z.string().uuid().describe("Identifiant (UUID) de l'utilisateur responsable."),
  email: z.string().email(),
  nom: z.string(),
  prenom: z.string(),
  service: z.string(),
  fonction: z.string(),
})
export type ResponsableApiModel = z.infer<typeof responsableApiModelSchema>
```

- [ ] **Step 5: Sérialiser `id` côté indicateur**

Dans `apps/kpilote-api/src/indicateur/utils.ts`, bloc `responsables:` :

```ts
responsables: indicateur.responsables.map(({ utilisateur }) => ({
  id: utilisateur.id,
  email: utilisateur.email,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  service: utilisateur.service,
  fonction: utilisateur.fonction,
})),
```

- [ ] **Step 6: Sérialiser `id` côté panier**

Dans `apps/kpilote-api/src/panier/utils.ts`, bloc `responsables:` :

```ts
responsables: panier.responsables.map(({ utilisateur }) => ({
  id: utilisateur.id,
  email: utilisateur.email,
  nom: utilisateur.nom,
  prenom: utilisateur.prenom,
  service: utilisateur.service,
  fonction: utilisateur.fonction,
})),
```

- [ ] **Step 7: Lancer les tests pour vérifier le succès**

Run:
```bash
pnpm -F @pilote/kpilote-api test src/indicateur/queries/getIndicateurByPublicId.test.ts src/panier/queries/getPanierByPublicId.test.ts
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/kpilote-shared/src/responsable.ts apps/kpilote-api/src/indicateur/utils.ts apps/kpilote-api/src/panier/utils.ts apps/kpilote-api/src/indicateur/queries/getIndicateurByPublicId.test.ts apps/kpilote-api/src/panier/queries/getPanierByPublicId.test.ts
git commit -m "feat(responsable): expose l'id utilisateur dans le read model responsable"
```

---

## Task 2: Ajouter le champ `responsables` au body d'upsert

**Files:**
- Modify: `packages/kpilote-shared/src/indicateur.ts` (`upsertIndicateurBodySchema`)

**Interfaces:**
- Produces: `upsertIndicateurBodySchema` gagne `responsables?: string[]` (UUIDs). Consommé par la command (Task 3) et le form admin (Task 5).

- [ ] **Step 1: Ajouter le champ au schéma**

Dans `packages/kpilote-shared/src/indicateur.ts`, dans `upsertIndicateurBodySchema`, après le champ `referentiels` :

```ts
  responsables: z
    .array(z.string().uuid())
    .optional()
    .describe(
      'UUIDs des utilisateurs responsables (replace-all quand présent). ' +
        'Champ optionnel : absent = inchangé ; `[]` = aucun responsable. Doublons dédupliqués.',
    ),
```

- [ ] **Step 2: Vérifier la compilation du package partagé**

Run:
```bash
pnpm -F @pilote/kpilote-api exec tsc --noEmit
```
Expected: PASS (aucune erreur de type introduite ; `responsables` optionnel n'impacte pas les appelants existants).

- [ ] **Step 3: Commit**

```bash
git add packages/kpilote-shared/src/indicateur.ts
git commit -m "feat(indicateur): champ responsables optionnel dans le body d'upsert"
```

---

## Task 3: Gérer les responsables dans la command `upsertIndicateur`

**Files:**
- Modify: `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts`
- Test: `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.test.ts`

**Interfaces:**
- Consumes: `upsertIndicateurBodySchema.responsables` (Task 2).
- Produces: `upsertIndicateur(publicId, body)` applique désormais les responsables (replace-all quand `body.responsables !== undefined`). Signature inchangée (`ResultAsync<void, never>`).

- [ ] **Step 1: Écrire les tests d'échec**

Dans `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.test.ts`, ajouter en haut l'import `uuidv7` et un helper de lecture :

```ts
import { uuidv7 } from 'uuidv7'

const getResponsableUtilisateurIds = async (publicId: string): Promise<string[]> => {
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId },
    include: { responsables: { orderBy: { createdAt: 'asc' } } },
  })
  return indicateur.responsables.map((responsable) => responsable.utilisateurId)
}
```

Puis, dans le `describe('upsertIndicateur')`, ajouter les tests suivants :

```ts
it(
  'assigne des responsables à la création',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const apiKey = await fixtures.apiKey()
    const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })
    const userB = await fixtures.utilisateur({ email: `b-${indId}@example.com` })

    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, responsables: [userA.id, userB.id] }),
    )

    const ids = await getResponsableUtilisateurIds(indId)
    expect(new Set(ids)).toEqual(new Set([userA.id, userB.id]))
  }),
)

it(
  'remplace intégralement la liste des responsables (replace-all)',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const apiKey = await fixtures.apiKey()
    const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })
    const userB = await fixtures.utilisateur({ email: `b-${indId}@example.com` })
    const userC = await fixtures.utilisateur({ email: `c-${indId}@example.com` })

    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, responsables: [userA.id, userB.id] }),
    )
    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, responsables: [userB.id, userC.id] }),
    )

    const ids = await getResponsableUtilisateurIds(indId)
    expect(new Set(ids)).toEqual(new Set([userB.id, userC.id]))
  }),
)

it(
  'laisse les responsables inchangés quand le champ est absent',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const apiKey = await fixtures.apiKey()
    const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })

    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, responsables: [userA.id] }),
    )
    // Pas de clé `responsables` → ne pas toucher.
    await runAsAdmin(apiKey.id, () => upsertIndicateur(indId, { ...BODY_BASE, nom: 'Renommé' }))

    const ids = await getResponsableUtilisateurIds(indId)
    expect(ids).toEqual([userA.id])
  }),
)

it(
  'vide les responsables quand le champ vaut []',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const apiKey = await fixtures.apiKey()
    const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })

    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, responsables: [userA.id] }),
    )
    await runAsAdmin(apiKey.id, () => upsertIndicateur(indId, { ...BODY_BASE, responsables: [] }))

    const ids = await getResponsableUtilisateurIds(indId)
    expect(ids).toEqual([])
  }),
)

it(
  'déduplique les responsables en doublon',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const apiKey = await fixtures.apiKey()
    const userA = await fixtures.utilisateur({ email: `a-${indId}@example.com` })

    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, responsables: [userA.id, userA.id] }),
    )

    const ids = await getResponsableUtilisateurIds(indId)
    expect(ids).toEqual([userA.id])
  }),
)

it(
  'échoue avec VALIDATION_ERROR quand un utilisateur est inconnu (aucun indicateur créé)',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const apiKey = await fixtures.apiKey()
    const inconnu = uuidv7()

    await expect(
      runAsAdmin(apiKey.id, () =>
        upsertIndicateur(indId, { ...BODY_BASE, responsables: [inconnu] }),
      ),
    ).rejects.toMatchObject({
      constructor: ValidationError,
      details: { unknownUtilisateurIds: [inconnu] },
    })

    const created = await db().indicateur.findUnique({ where: { publicId: indId } })
    expect(created).toBeNull()
  }),
)

it(
  'préserve le createdAt des responsables conservés lors d’un remplacement',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const apiKey = await fixtures.apiKey()
    const userA = await fixtures.utilisateur({ email: `keep-a-${indId}@example.com` })
    const userB = await fixtures.utilisateur({ email: `keep-b-${indId}@example.com` })

    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, responsables: [userA.id] }),
    )
    const avant = await db().indicateurResponsable.findFirstOrThrow({
      where: { utilisateurId: userA.id },
    })

    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, responsables: [userA.id, userB.id] }),
    )
    const apres = await db().indicateurResponsable.findFirstOrThrow({
      where: { utilisateurId: userA.id },
    })

    expect(apres.createdAt).toEqual(avant.createdAt)
    // userA (inséré en 1er, createdAt préservé) précède userB (inséré ensuite).
    const ids = await getResponsableUtilisateurIds(indId)
    expect(ids).toEqual([userA.id, userB.id])
  }),
)
```

Note : `BODY_BASE` (déjà défini dans le fichier) contient `referentiels: []` et les métadonnées vides ; il ne contient pas de clé `responsables`.

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run:
```bash
pnpm -F @pilote/kpilote-api test src/indicateur/commands/upsertIndicateur.test.ts
```
Expected: FAIL — les responsables ne sont pas encore gérés par la command (les assertions sur la liste échouent ; le test d'utilisateur inconnu ne lève pas encore).

- [ ] **Step 3: Ajouter les helpers responsables dans la command**

Dans `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts`, ajouter après `remplacerConfigurationsReferentiels` (les helpers réutilisent `db()` et `ValidationError`, déjà importés) :

```ts
const resoudreResponsables = async (
  utilisateurIds: ReadonlyArray<string>,
): Promise<string[]> => {
  const idsUniques = [...new Set(utilisateurIds)]
  if (idsUniques.length === 0) return []
  const utilisateurs = await db().utilisateur.findMany({ where: { id: { in: idsUniques } } })
  const idsTrouves = new Set(utilisateurs.map((utilisateur) => utilisateur.id))
  const idsInconnus = idsUniques.filter((id) => !idsTrouves.has(id))
  if (idsInconnus.length > 0) {
    throw new ValidationError('Utilisateurs inconnus', {
      unknownUtilisateurIds: idsInconnus.sort(),
    })
  }
  return idsUniques
}

const remplacerResponsables = async (
  indicateurId: string,
  utilisateurIdsCibles: string[],
): Promise<void> => {
  const cibles = new Set(utilisateurIdsCibles)
  const existantes = await db().indicateurResponsable.findMany({ where: { indicateurId } })
  const aSupprimer = existantes
    .filter((liaison) => !cibles.has(liaison.utilisateurId))
    .map((liaison) => liaison.utilisateurId)
  if (aSupprimer.length > 0) {
    await db().indicateurResponsable.deleteMany({
      where: { indicateurId, utilisateurId: { in: aSupprimer } },
    })
  }
  for (const utilisateurId of utilisateurIdsCibles) {
    await db().indicateurResponsable.upsert({
      where: { indicateurId_utilisateurId: { indicateurId, utilisateurId } },
      update: {},
      create: { indicateurId, utilisateurId },
    })
  }
}
```

- [ ] **Step 4: Brancher dans le chemin de mise à jour**

Dans `updateIndicateurExistant`, résoudre les responsables juste après les référentiels (fail-fast avant toute écriture), puis les appliquer après `remplacerConfigurationsReferentiels` :

```ts
const updateIndicateurExistant = async (
  publicId: string,
  indicateurId: string,
  body: UpsertIndicateurBody,
  principalId: string,
): Promise<void> => {
  await assertWritePermission(indicateurId, principalId)
  const configurations = await resoudreConfigurationsReferentiels(body.referentiels)
  const responsablesCibles =
    body.responsables === undefined ? undefined : await resoudreResponsables(body.responsables)
  await db().indicateur.update({
    where: { publicId },
    data: {
      nom: body.nom,
      visibilite: body.visibilite,
      unite: body.unite,
      ...metadonneesData(body),
    },
  })
  await remplacerConfigurationsReferentiels(indicateurId, configurations)
  if (responsablesCibles !== undefined) {
    await remplacerResponsables(indicateurId, responsablesCibles)
  }
}
```

- [ ] **Step 5: Brancher dans le chemin de création**

Dans `createIndicateurAvecGrants`, résoudre les responsables avant de créer (pour que « utilisateur inconnu » n'ait créé aucun indicateur), puis les appliquer après les référentiels :

```ts
const createIndicateurAvecGrants = async (
  publicId: string,
  body: UpsertIndicateurBody,
  principalId: string,
): Promise<void> => {
  const configurations = await resoudreConfigurationsReferentiels(body.referentiels)
  const responsablesCibles =
    body.responsables === undefined ? undefined : await resoudreResponsables(body.responsables)
  const indicateurId = uuidv7()
  await db().indicateur.create({
    data: {
      id: indicateurId,
      publicId,
      nom: body.nom,
      visibilite: body.visibilite,
      unite: body.unite,
      ...metadonneesData(body),
    },
  })
  await grantOwnerPermissions(principalId, indicateurId)
  if (configurations.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: configurations.map((configuration) => ({
        indicateurId,
        referentielId: configuration.referentielId,
        fonctionAgregation: configuration.fonctionAgregation,
      })),
    })
  }
  if (responsablesCibles !== undefined) {
    await remplacerResponsables(indicateurId, responsablesCibles)
  }
}
```

- [ ] **Step 6: Lancer les tests pour vérifier le succès**

Run:
```bash
pnpm -F @pilote/kpilote-api test src/indicateur/commands/upsertIndicateur.test.ts
```
Expected: PASS (nouveaux tests + tests existants).

- [ ] **Step 7: Lint API**

Run:
```bash
pnpm -F @pilote/kpilote-api lint
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts apps/kpilote-api/src/indicateur/commands/upsertIndicateur.test.ts
git commit -m "feat(indicateur): applique les responsables (replace-all) dans l'upsert"
```

---

## Task 4: Charger tous les utilisateurs côté admin (`fetchAllUtilisateurs`)

**Files:**
- Modify: `apps/kpilote-admin/src/api/utilisateurs.ts`

**Interfaces:**
- Consumes: `fetchUtilisateurs` (existant), `fetchAllPages` (`@/lib/fetchAllPages`, existant).
- Produces: `fetchAllUtilisateurs(): Promise<UtilisateurApiModel[]>` — agrège toutes les pages de `GET /utilisateurs`. Consommé par le form admin (Task 6).

- [ ] **Step 1: Ajouter `fetchAllUtilisateurs`**

Dans `apps/kpilote-admin/src/api/utilisateurs.ts`, ajouter l'import et le helper (miroir de `fetchAllReferentiels`) :

```ts
import { fetchAllPages } from '@/lib/fetchAllPages'
```

```ts
export const fetchAllUtilisateurs = (): Promise<UtilisateurApiModel[]> =>
  fetchAllPages((cursor) => fetchUtilisateurs({ cursor }))
```

Placer le helper juste après `fetchUtilisateurs`. `UtilisateurApiModel` est déjà importé (type) dans le fichier.

- [ ] **Step 2: Vérifier le typecheck admin**

Run:
```bash
pnpm -F @pilote/kpilote-admin exec tsc --noEmit
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/kpilote-admin/src/api/utilisateurs.ts
git commit -m "feat(admin): fetchAllUtilisateurs pour peupler le select des responsables"
```

---

## Task 5: Étendre le schéma de formulaire indicateur (admin)

**Files:**
- Modify: `apps/kpilote-admin/src/components/indicateurs/indicateurFormSchema.ts`

**Interfaces:**
- Consumes: `responsableApiModelSchema.id` (Task 1) via `IndicateurApiModel.responsables[].id` ; `upsertIndicateurBodySchema.responsables` (Task 2).
- Produces: `IndicateurFormValues.responsables: { id; nom; prenom; email }[]`. `buildInitialValues` le pré-remplit ; `toUpsertBody` renvoie `responsables: string[]`.

- [ ] **Step 1: Ajouter le champ `responsables` au schéma du formulaire**

Dans `buildIndicateurFormSchema`, ajouter au `z.object({ ... })` (à côté de `referentiels`) :

```ts
      responsables: z.array(
        z.object({
          id: z.string(),
          nom: z.string(),
          prenom: z.string(),
          email: z.string(),
        }),
      ),
```

- [ ] **Step 2: Pré-remplir dans `buildInitialValues`**

Ajouter au retour de `buildInitialValues`, après `referentiels` :

```ts
    responsables:
      indicateur?.responsables.map((responsable) => ({
        id: responsable.id,
        nom: responsable.nom,
        prenom: responsable.prenom,
        email: responsable.email,
      })) ?? [],
```

- [ ] **Step 3: Mapper vers le body dans `toUpsertBody`**

Ajouter au retour de `toUpsertBody`, après `referentiels` :

```ts
    responsables: values.responsables.map((responsable) => responsable.id),
```

- [ ] **Step 4: Vérifier le typecheck admin**

Run:
```bash
pnpm -F @pilote/kpilote-admin exec tsc --noEmit
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/kpilote-admin/src/components/indicateurs/indicateurFormSchema.ts
git commit -m "feat(admin): champ responsables dans le schéma du formulaire indicateur"
```

---

## Task 6: Section « Responsables » dans le formulaire (admin)

**Files:**
- Modify: `apps/kpilote-admin/src/components/indicateurs/IndicateurForm.tsx`

**Interfaces:**
- Consumes: `fetchAllUtilisateurs` (Task 4) ; `IndicateurFormValues.responsables` (Task 5).

- [ ] **Step 1: Importer les dépendances**

En haut de `IndicateurForm.tsx`, ajouter :

```ts
import { fetchAllUtilisateurs } from '@/api/utilisateurs'
```

- [ ] **Step 2: Déclarer le field array et la query utilisateurs**

Dans le composant `IndicateurForm`, après le `useFieldArray` des `referentiels` :

```ts
  const {
    fields: responsablesFields,
    append: appendResponsable,
    remove: removeResponsable,
  } = useFieldArray({ control: form.control, name: 'responsables' })

  const utilisateursQuery = useQuery({
    queryKey: ['utilisateurs', 'all-for-select'],
    queryFn: () => fetchAllUtilisateurs(),
  })
  const utilisateursDisponibles = (utilisateursQuery.data ?? []).filter(
    (utilisateur) => !responsablesFields.some((responsable) => responsable.id === utilisateur.id),
  )
```

- [ ] **Step 3: Rendre la section « Responsables »**

Juste après le bloc `<div className="border-t border-border pt-5">…Référentiels liés…</div>` (avant la fermeture de la carte du formulaire), ajouter une section jumelle :

```tsx
        <div className="border-t border-border pt-5">
          <span className="mb-1 block text-sm font-bold">Responsables</span>
          <p className="mb-4 text-xs text-text-subtle">
            Utilisateurs désignés responsables de l'indicateur. Cette liste remplace{' '}
            <b>intégralement</b> l'existant à l'enregistrement.
          </p>

          <FieldSelect
            label="Ajouter un responsable"
            value=""
            disabled={utilisateursQuery.isLoading}
            onChange={(event) => {
              const utilisateur = utilisateursDisponibles.find(
                (candidat) => candidat.id === event.target.value,
              )
              if (!utilisateur) return
              appendResponsable({
                id: utilisateur.id,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email: utilisateur.email,
              })
            }}
          >
            <option value="" disabled>
              {utilisateursQuery.isLoading ? 'Chargement…' : 'Choisir un utilisateur…'}
            </option>
            {utilisateursDisponibles.map((utilisateur) => (
              <option key={utilisateur.id} value={utilisateur.id}>
                {utilisateur.prenom} {utilisateur.nom} · {utilisateur.email}
              </option>
            ))}
          </FieldSelect>

          <ul className="mt-3 space-y-2">
            {responsablesFields.map((responsable, index) => (
              <li
                key={responsable.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
              >
                <span>
                  {responsable.prenom} {responsable.nom}{' '}
                  <span className="text-text-subtle">· {responsable.email}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeResponsable(index)}
                  className="text-accent"
                  aria-label="Retirer"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
```

Note : `FieldSelect`, `Trash2`, `useFieldArray`, `useQuery` sont déjà importés dans le fichier. La `key` de la liste utilise `responsable.id` de `useFieldArray` (identifiant de field RHF, stable).

- [ ] **Step 4: Vérifier le lint admin (inclut tsc)**

Run:
```bash
pnpm -F @pilote/kpilote-admin lint
```
Expected: PASS.

- [ ] **Step 5: Vérification manuelle**

Lancer l'admin, ouvrir un indicateur en édition :
- les responsables déjà assignés apparaissent dans la liste ;
- le select ne propose pas les utilisateurs déjà sélectionnés ;
- ajouter puis retirer un responsable, enregistrer, rouvrir : la liste reflète les changements ;
- créer un nouvel indicateur avec des responsables : ils sont bien persistés.

- [ ] **Step 6: Commit**

```bash
git add apps/kpilote-admin/src/components/indicateurs/IndicateurForm.tsx
git commit -m "feat(admin): section responsables dans le formulaire d'indicateur"
```

---

## Self-Review

- **Couverture spec** : read model `id` (Task 1) ✓ ; champ body optionnel replace-all (Task 2) ✓ ; command diff préservant createdAt + validation ids inconnus + dédup (Task 3) ✓ ; autorisation inchangée (déjà couverte par `assertWritePermission` et les tests de permission existants du fichier, non ré-implémentée) ✓ ; `fetchAllUtilisateurs` (Task 4) ✓ ; form schema + initial + body (Task 5) ✓ ; section UI FieldSelect + chips (Task 6) ✓ ; pas de changement de route ni de flux de mutation ✓ ; whitelist BFF inchangée (pas de nouveau path) ✓.
- **Type consistency** : `responsables` = `string[]` (UUIDs) partout dans le body ; `IndicateurFormValues.responsables` = `{ id; nom; prenom; email }[]` ; `toUpsertBody` mappe vers `string[]`. `responsableApiModelSchema` gagne `id` en premier champ, cohérent entre sérialisation indicateur/panier et assertions de test.
- **Placeholders** : aucun — tout le code est fourni.
