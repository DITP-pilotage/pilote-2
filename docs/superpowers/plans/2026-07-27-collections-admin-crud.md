# CRUD des collections dans le panel admin — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouvrir l'écriture des collections — création, modification, suppression, affectation d'indicateurs et d'utilisateurs — via de nouvelles routes `kpilote-api` et un écran d'administration à onglets dans `kpilote-admin`.

**Architecture:** L'API expose une commande par intention (créer, remplacer, supprimer, ajouter un indicateur…), chacune gardée par `ensurePrincipal(isApiKeyAdmin, …)` et exécutée dans une transaction. Le panel admin consomme ces routes via son proxy BFF, avec un écran liste calqué sur `/indicateurs` et une fiche à trois onglets calquée sur `/utilisateurs/$id`. Les affectations s'écrivent une par une, sans bouton Enregistrer.

**Tech Stack:** Hono + `@hono/zod-openapi`, Prisma (PostgreSQL), neverthrow, Zod, Vitest côté API. React 19, TanStack Router (routes fichiers) + TanStack Query, Tailwind, `@pilote/kpilote-ui` côté admin.

**Spec:** `docs/superpowers/specs/2026-07-27-collections-admin-crud-design.md`

## Global Constraints

- **pnpm uniquement**, jamais npm. Les commandes ciblent un workspace : `pnpm -F @pilote/kpilote-api …`, `pnpm -F @pilote/kpilote-admin …`.
- **Lint avant chaque commit** : `pnpm -F @pilote/kpilote-api lint` et/ou `pnpm -F @pilote/kpilote-admin lint` selon les fichiers touchés. Le lint admin lance `tsr generate` puis `eslint`, `tsc --noEmit` et `prettier --check`.
- **Commits via le skill `commit-billable`**, jamais `git commit` en direct. Pas de trailer `Co-Authored-By`.
- **Nommage** : verbes et termes techniques en anglais, noms d'entités en français (`createCollection`, `listCollectionPermissions`, `ponderation`).
- **Les tests d'intégration API exigent la base Docker.** Ne rien manipuler sur les conteneurs : si les tests échouent à la connexion, demander à l'utilisateur de vérifier que Docker tourne.
- **Écritures réservées aux clés API `ADMIN`** : `ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)` en première ligne de chaque commande, avec `MESSAGE_ADMIN = 'Cette opération requiert une clé API de rôle ADMIN'`.
- **Pas de tests front** : les écrans admin ne sont pas couverts par des tests automatisés, conformément à l'usage du projet. Leur vérification est le lint (dont `tsc --noEmit`).
- **Tailwind + composants `@pilote/kpilote-ui`**, jamais de classes DSFR `fr-*`, jamais de couleur en dur hors palette (`text-text`, `border-border`, `text-red-marianne`…).
- **Pas de commentaire narratif** : ne commenter que ce qui n'est pas lisible dans le code (un invariant, une raison).

## Structure des fichiers

**`packages/kpilote-shared/src/`**
- `collection.ts` *(modifié)* — `collectionApiModelSchema.indicateurs`, plus les schémas de body des cinq routes d'écriture.
- `permission.ts` *(modifié)* — `collectionPermissionsApiModelSchema` (lecture inverse).

**`apps/kpilote-api/src/collection/`**
- `utils.ts` *(modifié)* — `MESSAGE_ADMIN`, `collectionInclude`, `toCollectionApiModel` avec la pondération.
- `queries/getCollectionByPublicId.ts` *(modifié)* — bypass ADMIN.
- `queries/listCollectionPermissions.ts` *(créé)* — lecture inverse des permissions.
- `commands/createCollection.ts` *(créé)* — `POST`, identifiant généré.
- `commands/upsertCollection.ts` *(créé)* — `PUT` replace-all.
- `commands/deleteCollection.ts` *(créé)*
- `commands/addCollectionIndicateur.ts`, `updateCollectionIndicateurPonderation.ts`, `removeCollectionIndicateur.ts` *(créés)*
- `commands/addCollectionResponsable.ts`, `removeCollectionResponsable.ts` *(créés)*
- `routes.ts` *(modifié)* — les huit nouvelles routes.

Une commande par fichier : chacune porte une intention et son test, et reste lisible d'un seul regard.

**`apps/kpilote-admin/src/`**
- `api/collections.ts` *(modifié)* — un appel par route.
- `queries/collections.ts` *(créé)* — options React Query.
- `components/collections/CollectionForm.tsx` *(créé)* — formulaire partagé création / édition.
- `components/collections/CollectionIndicateurs.tsx` *(créé)* — onglet Indicateurs.
- `components/collections/CollectionUtilisateurs.tsx` *(créé)* — onglet Utilisateurs (responsables + accès).
- `routes/_authed/collections/index.tsx`, `nouveau.tsx`, `$id.tsx` *(créés)*
- `routes/_authed/fonctionnalites.tsx` *(modifié)* — la carte d'entrée.

Chaque onglet est un composant à part : la fiche `$id.tsx` ne fait qu'orchestrer, et un onglet peut être relu sans charger les deux autres.

**`apps/kpilote-webapp/src/`**
- `components/collections/CollectionCard.tsx`, `routes/_authenticated/collections/$id.tsx` *(modifiés)* — répercussion du renommage `indicateurIds` → `indicateurs`.

---

### Task 1 : Contrat `CollectionApiModel` — `indicateurIds` devient `indicateurs`

**Files:**
- Modify: `packages/kpilote-shared/src/collection.ts`
- Modify: `apps/kpilote-api/src/collection/utils.ts`
- Modify: `apps/kpilote-api/src/collection/queries/getCollectionByPublicId.test.ts:32,56`
- Modify: `apps/kpilote-api/src/collection/queries/listCollections.test.ts:105,120`
- Modify: `apps/kpilote-webapp/src/components/collections/CollectionCard.tsx:20,23`
- Modify: `apps/kpilote-webapp/src/routes/_authenticated/collections/$id.tsx:53,54,95,103`

**Interfaces:**
- Produces: `collectionIndicateurApiModelSchema` = `{ id: string; ponderation: number }`. `CollectionApiModel.indicateurs: CollectionIndicateurApiModel[]` remplace `indicateurIds: string[]`. `toCollectionApiModel` inchangé côté signature.

- [ ] **Step 1 : Basculer les assertions des tests de query**

Dans `getCollectionByPublicId.test.ts`, remplacer la ligne 32 :

```ts
        indicateurs: [
          { id: indA, ponderation: 1 },
          { id: indB, ponderation: 1 },
        ],
```

et la ligne 56 :

```ts
        indicateurs: [],
```

Dans `listCollections.test.ts`, remplacer la ligne 105 :

```ts
      expect(collection?.indicateurs).toEqual([
        { id: indA, ponderation: 1 },
        { id: indB, ponderation: 1 },
        { id: indC, ponderation: 1 },
      ])
```

et la ligne 120 :

```ts
      expect(collection?.indicateurs).toEqual([])
```

- [ ] **Step 2 : Lancer les tests pour les voir échouer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/queries`
Expected: FAIL — les objets retournés contiennent `indicateurIds`, pas `indicateurs`.

- [ ] **Step 3 : Modifier le schéma partagé**

Dans `packages/kpilote-shared/src/collection.ts`, remplacer le champ `indicateurIds` de `collectionApiModelSchema` par :

```ts
export const collectionIndicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  ponderation: z
    .number()
    .describe(
      'Poids de l’indicateur dans la moyenne pondérée du taux de progression de la collection. 1 par défaut ; 0 exclut l’indicateur du calcul.',
    ),
})
export type CollectionIndicateurApiModel = z.infer<typeof collectionIndicateurApiModelSchema>
```

puis, dans `collectionApiModelSchema` :

```ts
  indicateurs: z
    .array(collectionIndicateurApiModelSchema)
    .describe(
      "Indicateurs composant la collection, triés par ordre d'insertion (createdAt ASC), avec leur pondération.",
    ),
```

- [ ] **Step 4 : Modifier le mapper**

Dans `apps/kpilote-api/src/collection/utils.ts`, ajouter l'import du type `Decimal` et adapter le type de jointure et le mapper :

```ts
import { type Decimal } from '@/framework/decimal'
```

```ts
export type CollectionWithIndicateurs = CollectionModel & {
  indicateurs: Array<{ ponderation: Decimal; indicateur: Pick<IndicateurModel, 'publicId'> }>
  responsables: Array<{ utilisateur: UtilisateurModel }>
  contactsUtiles: ContactUtileLien[]
}
```

```ts
  indicateurs: collection.indicateurs.map((lien) => ({
    id: lien.indicateur.publicId,
    ponderation: lien.ponderation.toNumber(),
  })),
```

Les `include` de `listCollections.ts` et `getCollectionByPublicId.ts` remontent déjà tous les scalaires de la jointure : aucune requête à modifier.

- [ ] **Step 5 : Lancer les tests pour les voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection`
Expected: PASS

- [ ] **Step 6 : Répercuter côté webapp**

Dans `CollectionCard.tsx`, ligne 20 puis 23 :

```tsx
  collection: Pick<CollectionApiModel, 'id' | 'nom' | 'description' | 'indicateurs'>
```

```tsx
  const nb = collection.indicateurs.length
```

Dans `routes/_authenticated/collections/$id.tsx`, dans le `loader`, remplacer les lignes 53-55 :

```tsx
    const indicateurIds = collection.indicateurs.map((lien) => lien.id)
    if (indicateurIds.length > 0) {
      await queryClient.ensureQueryData(indicateursQueryOptions({ ids: indicateurIds }))
    }
```

Dans `CollectionDetailComponent`, remplacer les lignes 95 et 103 :

```tsx
  const indicateurIds = collection.indicateurs.map((lien) => lien.id)
  const { data: indicateurs } = useSuspenseQuery(indicateursQueryOptions({ ids: indicateurIds }))
```

```tsx
  const orderedIndicateurs = indicateurIds
    .map((indicateurId) => indicateurById.get(indicateurId))
    .filter((i): i is NonNullable<typeof i> => i !== undefined)
```

`indicateurById` reste défini juste au-dessus, inchangé.

- [ ] **Step 7 : Vérifier la compilation des trois workspaces**

Run: `pnpm -F @pilote/kpilote-api lint && pnpm -F @pilote/kpilote-webapp lint && pnpm -F @pilote/kpilote-shared lint`
Expected: aucune erreur. Toute occurrence restante de `indicateurIds` sur un `CollectionApiModel` sort ici.

- [ ] **Step 8 : Commit** (skill `commit-billable`, description : `expose la pondération des indicateurs dans le modèle collection`)

---

### Task 2 : Détail de collection visible par les principals ADMIN

**Files:**
- Modify: `apps/kpilote-api/src/collection/queries/getCollectionByPublicId.ts`
- Modify: `apps/kpilote-api/src/collection/queries/getCollectionByPublicId.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `getCollectionByPublicId(publicId)` renvoie désormais toute collection à un principal ADMIN, y compris `PRIVE` sans permission directe. Les tâches 3 à 7 s'en servent pour recharger le modèle après écriture.

`listCollections.ts:32` court-circuite déjà le filtre de permission pour un principal ADMIN ; le détail ne le fait pas. Une collection `PRIVE` créée depuis le panel admin serait donc introuvable par son propre créateur.

- [ ] **Step 1 : Écrire le test qui échoue**

Ajouter dans `getCollectionByPublicId.test.ts`, dans le `describe` existant :

```ts
  it(
    'retourne une collection PRIVE à une clé ADMIN sans permission directe',
    integrationTest(async () => {
      const colPrive = testCollectionId()
      await fixtures.collection({
        publicId: colPrive,
        nom: 'Collection privée',
        visibilite: 'PRIVE',
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () => getCollectionByPublicId(colPrive))

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toMatchObject({ id: colPrive, visibilite: 'PRIVE' })
    }),
  )
```

Vérifier au passage la signature de `fixtures.apiKey` dans `src/test/fixtures.ts` : si le champ de rôle ne s'appelle pas `role`, utiliser le nom réel.

- [ ] **Step 2 : Lancer le test pour le voir échouer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/queries/getCollectionByPublicId.test.ts`
Expected: FAIL — `findFirstOrThrow` lève `P2025`, le résultat n'est pas `ok`.

- [ ] **Step 3 : Aligner la query sur le listing**

Dans `getCollectionByPublicId.ts`, importer `isAdminPrincipal` et remplacer le `where` :

```ts
import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
```

```ts
  const principalId = requireCurrentPrincipalId()
  // Même règle que `listCollections` : un principal ADMIN administre toutes les
  // collections, publiques comme privées.
  const where = isAdminPrincipal()
    ? { publicId }
    : withCollectionReadPermission({ publicId }, principalId)

  return ResultAsync.fromSafePromise(
    db().collection.findFirstOrThrow({
      where,
      include: { … },
    }),
  ).map(toCollectionApiModel)
```

- [ ] **Step 4 : Lancer les tests pour les voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/queries/getCollectionByPublicId.test.ts`
Expected: PASS, y compris les tests existants de refus pour un principal non-ADMIN.

- [ ] **Step 5 : Commit** (`aligne le détail de collection sur le listing pour les principals ADMIN`)

---

### Task 3 : `POST /collections` — création avec identifiant généré

**Files:**
- Modify: `packages/kpilote-shared/src/collection.ts`
- Modify: `apps/kpilote-api/src/collection/utils.ts`
- Create: `apps/kpilote-api/src/collection/commands/createCollection.ts`
- Create: `apps/kpilote-api/src/collection/commands/createCollection.test.ts`
- Modify: `apps/kpilote-api/src/collection/routes.ts`
- Modify: `apps/kpilote-api/src/test/randomIds.ts`

**Interfaces:**
- Consumes: `getCollectionByPublicId` (Task 2), `toCollectionApiModel` (Task 1).
- Produces: `createCollection(body: CreateCollectionBody): ResultAsync<CollectionApiModel, never>` et `createCollectionBodySchema` = `{ nom: string; description: string | null; visibilite: 'PUBLIC' | 'PRIVE' }`.

- [ ] **Step 1 : Ajouter le schéma de body partagé**

Dans `packages/kpilote-shared/src/collection.ts` :

```ts
export const createCollectionBodySchema = z.object({
  nom: z.string().trim().min(1, 'Le nom est requis'),
  description: z.string().nullable(),
  visibilite: collectionVisibiliteSchema,
})
export type CreateCollectionBody = z.infer<typeof createCollectionBodySchema>
```

- [ ] **Step 2 : Ajouter les constantes partagées de la couche collection**

Dans `apps/kpilote-api/src/collection/utils.ts`, en tête :

```ts
export const MESSAGE_ADMIN = 'Cette opération requiert une clé API de rôle ADMIN'
```

- [ ] **Step 3 : Ajouter un générateur d'identifiant numérique aux helpers de test**

Dans `apps/kpilote-api/src/test/randomIds.ts`, à côté de `randomToken` :

```ts
const DIGITS = '0123456789'
const randomDigits = (length: number): string => {
  let out = ''
  for (let i = 0; i < length; i++) out += DIGITS[Math.floor(Math.random() * DIGITS.length)]
  return out
}

// `testCollectionId` produit un suffixe alphanumérique, refusé par
// `collectionPublicIdSchema` (`COL-<chiffres>`) qui valide les réponses de route
// et sert de base au calcul de l'identifiant suivant.
export const testCollectionNumericId = (): string => `COL-9${randomDigits(11)}`
```

Le préfixe `9` garantit un identifiant supérieur à ceux du seed (`COL-001` à `COL-005`), ce qui rend déterministes les tests de génération.

- [ ] **Step 4 : Écrire le test qui échoue**

Créer `apps/kpilote-api/src/collection/commands/createCollection.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { createCollection } from '@/collection/commands/createCollection'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

const body = { nom: 'Santé de proximité', description: null, visibilite: 'PUBLIC' as const }

describe('createCollection', () => {
  it(
    'attribue l’identifiant suivant le plus grand identifiant numérique existant',
    integrationTest(async () => {
      const existant = testCollectionNumericId()
      await fixtures.collection({ publicId: existant })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })
      const suivant = `COL-${Number(existant.slice(4)) + 1}`

      const result = await runAsPrincipal(apiKey.id, () => createCollection(body))

      expect(result._unsafeUnwrap()).toMatchObject({
        id: suivant,
        nom: 'Santé de proximité',
        description: null,
        visibilite: 'PUBLIC',
        indicateurs: [],
        responsables: [],
      })
    }),
  )

  it(
    'ignore les trous dans la suite et repart du maximum',
    integrationTest(async () => {
      const base = Number(testCollectionNumericId().slice(4))
      await fixtures.collection({ publicId: `COL-${base}` }, { publicId: `COL-${base + 5}` })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () => createCollection(body))

      expect(result._unsafeUnwrap().id).toBe(`COL-${base + 6}`)
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey({ role: 'CONTRIBUTOR' })

      await expect(runAsPrincipal(apiKey.id, () => createCollection(body))).rejects.toThrow(
        'Cette opération requiert une clé API de rôle ADMIN',
      )
    }),
  )
})
```

Ce `describe` n'est volontairement pas `concurrent` : le verrou consultatif sérialise les créations, deux tests concurrents s'attendraient mutuellement.

- [ ] **Step 5 : Lancer le test pour le voir échouer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/createCollection.test.ts`
Expected: FAIL — `Cannot find module '@/collection/commands/createCollection'`.

- [ ] **Step 6 : Écrire la commande**

Créer `apps/kpilote-api/src/collection/commands/createCollection.ts` :

```ts
import {
  type CollectionApiModel,
  type CreateCollectionBody,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'

// Verrou consultatif porté par la transaction : deux créations concurrentes
// calculeraient sinon le même identifiant. Un retry sur violation d'unicité ne
// suffirait pas — sous Postgres, l'erreur avorte la transaction courante.
const lockPublicIdSequence = async (): Promise<void> => {
  await db().$executeRaw`SELECT pg_advisory_xact_lock(hashtext('collection_public_id'))`
}

// Le cast est en BIGINT et le motif borné à 15 chiffres : les identifiants de
// test dépassent la capacité d'un INTEGER.
const nextPublicId = async (): Promise<string> => {
  const rows = await db().$queryRaw<Array<{ next: bigint }>>`
    SELECT COALESCE(MAX(CAST(SUBSTRING(public_id FROM 5) AS BIGINT)), 0) + 1 AS next
    FROM collection
    WHERE public_id ~ '^COL-[0-9]{1,15}$'
  `
  const next = rows[0]?.next ?? 1n
  return `COL-${String(next).padStart(3, '0')}`
}

const performCreate = async (body: CreateCollectionBody): Promise<string> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  await lockPublicIdSequence()
  const publicId = await nextPublicId()
  await db().collection.create({
    data: {
      id: uuidv7(),
      publicId,
      nom: body.nom,
      description: body.description,
      visibilite: body.visibilite,
    },
  })
  return publicId
}

export const createCollection = (
  body: CreateCollectionBody,
): ResultAsync<CollectionApiModel, never> =>
  ResultAsync.fromSafePromise(performCreate(body)).andThen(getCollectionByPublicId)
```

- [ ] **Step 7 : Lancer le test pour le voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/createCollection.test.ts`
Expected: PASS

- [ ] **Step 8 : Brancher la route**

Dans `apps/kpilote-api/src/collection/routes.ts`, ajouter les imports puis la route, à la suite des routes de lecture :

```ts
import { createCollectionBodySchema } from '@pilote/kpilote-shared/collection'
import { createCollection } from '@/collection/commands/createCollection'
```

```ts
const CreateCollectionBodySchema = createCollectionBodySchema.openapi('CreateCollectionBody')

// --- POST /collections -----------------------------------------------------------

const createCollectionRoute = createRoute({
  method: 'post',
  path: '/collections',
  tags: ['Collection', 'Admin'],
  summary: 'Créer une collection',
  description:
    "Réservé aux clés API de rôle `ADMIN`. L'identifiant public est généré par l'API au format `COL-NNN` : il suit le plus grand identifiant numérique existant. Pour imposer un identifiant, utiliser `PUT /collections/{id}`.",
  middleware: [requireAuthentication],
  request: {
    body: { content: { 'application/json': { schema: CreateCollectionBodySchema } }, required: true },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: CollectionApiModelSchema } },
      description: 'Collection créée',
    },
    400: erreur400,
    403: erreur403,
  },
})

collectionRoutes.openapi(createCollectionRoute, async (context) => {
  const body = context.req.valid('json')
  const result = await withTransaction(async () => createCollection(body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CollectionApiModelSchema, status: 201 }),
    never,
  )
})
```

- [ ] **Step 9 : Vérifier le câblage**

Ajouter dans `apps/kpilote-api/src/collection/routes.test.ts` (créer le fichier s'il n'existe pas, sur le modèle de `src/relation/routes.test.ts`) :

```ts
import { describe, expect, it } from 'vitest'

import { app } from '../app'

describe('routes collection — câblage', () => {
  it('déclare les routes d’écriture dans le doc OpenAPI', async () => {
    const response = await app.request('/openapi.json')

    expect(response.status).toBe(200)
    const doc = (await response.json()) as { paths: Record<string, Record<string, unknown>> }
    expect(doc.paths['/collections']?.post).toBeDefined()
  })

  it('renvoie 401 sans authentification', async () => {
    const response = await app.request('/collections', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nom: 'X', description: null, visibilite: 'PUBLIC' }),
    })

    expect(response.status).toBe(401)
  })
})
```

Run: `pnpm -F @pilote/kpilote-api test src/collection`
Expected: PASS

- [ ] **Step 10 : Lint puis commit** (`ajoute la création de collection avec identifiant généré`)

---

### Task 4 : `PUT /collections/{id}` — upsert replace-all

**Files:**
- Modify: `packages/kpilote-shared/src/collection.ts`
- Create: `apps/kpilote-api/src/collection/commands/upsertCollection.ts`
- Create: `apps/kpilote-api/src/collection/commands/upsertCollection.test.ts`
- Modify: `apps/kpilote-api/src/collection/routes.ts`
- Modify: `apps/kpilote-api/src/collection/routes.test.ts`

**Interfaces:**
- Consumes: `MESSAGE_ADMIN`, `getCollectionByPublicId`, `testCollectionNumericId`.
- Produces: `upsertCollection(publicId: string, body: UpsertCollectionBody): ResultAsync<CollectionApiModel, never>`. `upsertCollectionBodySchema` porte les mêmes trois champs que `createCollectionBodySchema`.

- [ ] **Step 1 : Ajouter le schéma de body partagé**

Dans `packages/kpilote-shared/src/collection.ts` :

```ts
export const upsertCollectionBodySchema = createCollectionBodySchema
export type UpsertCollectionBody = z.infer<typeof upsertCollectionBodySchema>
```

- [ ] **Step 2 : Écrire les tests qui échouent**

Créer `apps/kpilote-api/src/collection/commands/upsertCollection.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { upsertCollection } from '@/collection/commands/upsertCollection'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('upsertCollection', () => {
  it(
    'crée la collection quand l’identifiant est libre',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertCollection(publicId, {
          nom: 'Créée par PUT',
          description: 'Description',
          visibilite: 'PRIVE',
        }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        id: publicId,
        nom: 'Créée par PUT',
        description: 'Description',
        visibilite: 'PRIVE',
      })
    }),
  )

  it(
    'remplace les champs scalaires sans toucher aux indicateurs affectés',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      await fixtures.collection({
        publicId,
        nom: 'Ancien nom',
        description: 'Ancienne description',
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: indicateurId }],
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () =>
        upsertCollection(publicId, {
          nom: 'Nouveau nom',
          description: null,
          visibilite: 'PUBLIC',
        }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        nom: 'Nouveau nom',
        description: null,
        visibilite: 'PUBLIC',
        indicateurs: [{ id: indicateurId, ponderation: 1 }],
      })
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey({ role: 'CONTRIBUTOR' })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          upsertCollection(testCollectionNumericId(), {
            nom: 'X',
            description: null,
            visibilite: 'PUBLIC',
          }),
        ),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})
```

- [ ] **Step 3 : Lancer les tests pour les voir échouer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/upsertCollection.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 4 : Écrire la commande**

Créer `apps/kpilote-api/src/collection/commands/upsertCollection.ts` :

```ts
import {
  type CollectionApiModel,
  type UpsertCollectionBody,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'

// Seuls les champs scalaires sont remplacés : les affectations (indicateurs,
// responsables, permissions) ont leurs propres routes, et les inclure ici
// permettrait à l'écran d'édition d'écraser un ajout concurrent.
const performUpsert = async (publicId: string, body: UpsertCollectionBody): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  const champs = { nom: body.nom, description: body.description, visibilite: body.visibilite }
  await db().collection.upsert({
    where: { publicId },
    update: champs,
    create: { id: uuidv7(), publicId, ...champs },
  })
}

export const upsertCollection = (
  publicId: string,
  body: UpsertCollectionBody,
): ResultAsync<CollectionApiModel, never> =>
  ResultAsync.fromSafePromise(performUpsert(publicId, body)).andThen(() =>
    getCollectionByPublicId(publicId),
  )
```

- [ ] **Step 5 : Lancer les tests pour les voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/upsertCollection.test.ts`
Expected: PASS

- [ ] **Step 6 : Brancher la route**

Dans `routes.ts` :

```ts
const UpsertCollectionBodySchema = upsertCollectionBodySchema.openapi('UpsertCollectionBody')

// --- PUT /collections/:id --------------------------------------------------------

const upsertCollectionRoute = createRoute({
  method: 'put',
  path: '/collections/{id}',
  tags: ['Collection', 'Admin'],
  summary: 'Créer ou remplacer une collection',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Crée la collection si l'identifiant est libre, remplace sinon `nom`, `description` et `visibilite`. Les indicateurs, responsables et permissions affectés ne sont pas modifiés : ils ont leurs propres routes.",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: { content: { 'application/json': { schema: UpsertCollectionBodySchema } }, required: true },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionApiModelSchema } },
      description: 'Collection créée ou mise à jour',
    },
    400: erreur400,
    403: erreur403,
  },
})

collectionRoutes.openapi(upsertCollectionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => upsertCollection(id, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CollectionApiModelSchema, status: 200 }),
    never,
  )
})
```

- [ ] **Step 7 : Compléter le test de câblage**

Dans `routes.test.ts`, ajouter à l'assertion OpenAPI existante :

```ts
    expect(doc.paths['/collections/{id}']?.put).toBeDefined()
```

Run: `pnpm -F @pilote/kpilote-api test src/collection`
Expected: PASS

- [ ] **Step 8 : Lint puis commit** (`ajoute l'upsert de collection sur identifiant imposé`)

---

### Task 5 : `DELETE /collections/{id}`

**Files:**
- Create: `apps/kpilote-api/src/collection/commands/deleteCollection.ts`
- Create: `apps/kpilote-api/src/collection/commands/deleteCollection.test.ts`
- Modify: `apps/kpilote-api/src/collection/routes.ts`
- Modify: `apps/kpilote-api/src/collection/routes.test.ts`

**Interfaces:**
- Produces: `deleteCollection(publicId: string): ResultAsync<void, never>`, idempotent.

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `apps/kpilote-api/src/collection/commands/deleteCollection.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { deleteCollection } from '@/collection/commands/deleteCollection'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('deleteCollection', () => {
  it(
    'supprime la collection et ses affectations, sans toucher aux indicateurs',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const indicateurId = testIndicateurId()
      const collection = await fixtures.collection({
        publicId,
        indicateurs: [{ publicId: indicateurId }],
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await runAsPrincipal(apiKey.id, () => deleteCollection(publicId))

      expect(await db().collection.findUnique({ where: { publicId } })).toBeNull()
      expect(
        await db().collectionIndicateur.count({ where: { collectionId: collection.id } }),
      ).toBe(0)
      expect(
        await db().indicateur.findUnique({ where: { publicId: indicateurId } }),
      ).not.toBeNull()
    }),
  )

  it(
    'reste idempotent sur une collection inexistante',
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () =>
        deleteCollection(testCollectionNumericId()),
      )

      expect(result.isOk()).toBe(true)
    }),
  )

  it(
    'refuse une clé API non ADMIN',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const apiKey = await fixtures.apiKey({ role: 'CONTRIBUTOR' })

      await expect(
        runAsPrincipal(apiKey.id, () => deleteCollection(publicId)),
      ).rejects.toThrow('Cette opération requiert une clé API de rôle ADMIN')
    }),
  )
})
```

- [ ] **Step 2 : Lancer les tests pour les voir échouer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/deleteCollection.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Écrire la commande**

Créer `apps/kpilote-api/src/collection/commands/deleteCollection.ts` :

```ts
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'

// `deleteMany` plutôt que `delete` : idempotent, sans P2025 sur une collection
// déjà absente. Les jointures partent en cascade (onDelete: Cascade).
const performDelete = async (publicId: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  await db().collection.deleteMany({ where: { publicId } })
}

export const deleteCollection = (publicId: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performDelete(publicId))
```

- [ ] **Step 4 : Lancer les tests pour les voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/deleteCollection.test.ts`
Expected: PASS

- [ ] **Step 5 : Brancher la route**

Dans `routes.ts` :

```ts
// --- DELETE /collections/:id -----------------------------------------------------

const deleteCollectionRoute = createRoute({
  method: 'delete',
  path: '/collections/{id}',
  tags: ['Collection', 'Admin'],
  summary: 'Supprimer une collection',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Supprime définitivement la collection ainsi que ses indicateurs affectés, responsables, permissions, contacts utiles et commentaires. Les indicateurs eux-mêmes ne sont pas supprimés. Idempotent : renvoie `204` même si la collection n'existait pas.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    204: { description: 'Collection supprimée' },
    403: erreur403,
  },
})

collectionRoutes.openapi(deleteCollectionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const result = await withTransaction(async () => deleteCollection(id))
  return result.match(() => context.body(null, 204), never)
})
```

- [ ] **Step 6 : Compléter le test de câblage**

Dans `routes.test.ts` :

```ts
    expect(doc.paths['/collections/{id}']?.delete).toBeDefined()
```

Run: `pnpm -F @pilote/kpilote-api test src/collection`
Expected: PASS

- [ ] **Step 7 : Lint puis commit** (`ajoute la suppression de collection`)

---

### Task 6 : Indicateurs d'une collection — ajout, pondération, retrait

**Files:**
- Modify: `packages/kpilote-shared/src/collection.ts`
- Create: `apps/kpilote-api/src/collection/commands/addCollectionIndicateur.ts` + `.test.ts`
- Create: `apps/kpilote-api/src/collection/commands/updateCollectionIndicateurPonderation.ts` + `.test.ts`
- Create: `apps/kpilote-api/src/collection/commands/removeCollectionIndicateur.ts` + `.test.ts`
- Modify: `apps/kpilote-api/src/collection/routes.ts`
- Modify: `apps/kpilote-api/src/collection/routes.test.ts`

**Interfaces:**
- Produces: `addCollectionIndicateur(publicId, body)`, `updateCollectionIndicateurPonderation(publicId, indicateurPublicId, body)`, `removeCollectionIndicateur(publicId, indicateurPublicId)` — les trois renvoient `ResultAsync<CollectionApiModel, never>` sauf le retrait, qui renvoie `ResultAsync<void, never>`.

- [ ] **Step 1 : Ajouter les schémas de body partagés**

Dans `packages/kpilote-shared/src/collection.ts` :

```ts
export const ponderationSchema = z
  .number()
  .min(0, 'La pondération ne peut pas être négative')
  .refine((valeur) => Number(valeur.toFixed(2)) === valeur, 'Deux décimales au maximum')
  .describe(
    'Poids de l’indicateur dans la moyenne pondérée de la collection. 0 exclut l’indicateur du calcul.',
  )

export const addCollectionIndicateurBodySchema = z.object({
  indicateurId: indicateurPublicIdSchema,
  ponderation: ponderationSchema.optional(),
})
export type AddCollectionIndicateurBody = z.infer<typeof addCollectionIndicateurBodySchema>

export const updateCollectionIndicateurPonderationBodySchema = z.object({
  ponderation: ponderationSchema,
})
export type UpdateCollectionIndicateurPonderationBody = z.infer<
  typeof updateCollectionIndicateurPonderationBodySchema
>
```

- [ ] **Step 2 : Écrire le test d'ajout**

Créer `addCollectionIndicateur.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { addCollectionIndicateur } from '@/collection/commands/addCollectionIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testIndicateurIds } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('addCollectionIndicateur', () => {
  it(
    'ajoute l’indicateur avec la pondération 1 par défaut',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({ publicId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () =>
        addCollectionIndicateur(publicId, { indicateurId }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, ponderation: 1 }])
    }),
  )

  it(
    'retient la pondération fournie',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({ publicId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () =>
        addCollectionIndicateur(publicId, { indicateurId, ponderation: 2.5 }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, ponderation: 2.5 }])
    }),
  )

  it(
    'refuse un indicateur déjà affecté',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({ publicId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await expect(
        runAsPrincipal(apiKey.id, () => addCollectionIndicateur(publicId, { indicateurId })),
      ).rejects.toThrow('Cet indicateur est déjà affecté à la collection')
    }),
  )

  it(
    'refuse un indicateur inconnu',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          addCollectionIndicateur(publicId, { indicateurId: 'IND-inexistant-000' }),
        ),
      ).rejects.toThrow()
    }),
  )
})
```

Vérifier la signature exacte de `fixtures.indicateur` dans `src/test/fixtures.ts` avant d'écrire ces tests.

- [ ] **Step 3 : Lancer le test pour le voir échouer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/addCollectionIndicateur.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 4 : Écrire la commande d'ajout**

```ts
import {
  type AddCollectionIndicateurBody,
  type CollectionApiModel,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'

const performAdd = async (
  publicId: string,
  body: AddCollectionIndicateurBody,
): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  const collection = await db().collection.findUniqueOrThrow({
    where: { publicId },
    select: { id: true },
  })
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: body.indicateurId },
    select: { id: true },
  })

  const existant = await db().collectionIndicateur.findUnique({
    where: {
      collectionId_indicateurId: { collectionId: collection.id, indicateurId: indicateur.id },
    },
  })
  if (existant) throw new ConflictError('Cet indicateur est déjà affecté à la collection')

  await db().collectionIndicateur.create({
    data: {
      collectionId: collection.id,
      indicateurId: indicateur.id,
      ponderation: body.ponderation ?? 1,
    },
  })
}

export const addCollectionIndicateur = (
  publicId: string,
  body: AddCollectionIndicateurBody,
): ResultAsync<CollectionApiModel, never> =>
  ResultAsync.fromSafePromise(performAdd(publicId, body)).andThen(() =>
    getCollectionByPublicId(publicId),
  )
```

- [ ] **Step 5 : Lancer le test pour le voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/addCollectionIndicateur.test.ts`
Expected: PASS

- [ ] **Step 6 : Écrire le test de pondération**

Créer `updateCollectionIndicateurPonderation.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { updateCollectionIndicateurPonderation } from '@/collection/commands/updateCollectionIndicateurPonderation'
import { getCollectionTauxProgression } from '@/collection/queries/getCollectionTauxProgression'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testIndicateurIds } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('updateCollectionIndicateurPonderation', () => {
  it(
    'remplace la pondération du lien',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({ publicId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () =>
        updateCollectionIndicateurPonderation(publicId, indicateurId, { ponderation: 3 }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, ponderation: 3 }])
    }),
  )

  it(
    'accepte une pondération nulle',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({ publicId, indicateurs: [{ publicId: indicateurId }] })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () =>
        updateCollectionIndicateurPonderation(publicId, indicateurId, { ponderation: 0 }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([{ id: indicateurId, ponderation: 0 }])
    }),
  )

  it(
    'échoue si l’indicateur n’est pas affecté à la collection',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({ publicId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await expect(
        runAsPrincipal(apiKey.id, () =>
          updateCollectionIndicateurPonderation(publicId, indicateurId, { ponderation: 2 }),
        ),
      ).rejects.toThrow()
    }),
  )
})
```

Le fait qu'une pondération modifiée change effectivement le résultat de `getCollectionTauxProgression` est vérifié à l'étape 10 ; l'import ci-dessus y sert.

- [ ] **Step 7 : Lancer le test pour le voir échouer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/updateCollectionIndicateurPonderation.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 8 : Écrire la commande de pondération**

```ts
import {
  type CollectionApiModel,
  type UpdateCollectionIndicateurPonderationBody,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'

const performUpdate = async (
  publicId: string,
  indicateurPublicId: string,
  body: UpdateCollectionIndicateurPonderationBody,
): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  const collection = await db().collection.findUniqueOrThrow({
    where: { publicId },
    select: { id: true },
  })
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: indicateurPublicId },
    select: { id: true },
  })

  // `update` et non `upsert` : un lien absent doit remonter en 404, pas créer
  // une affectation silencieuse.
  await db().collectionIndicateur.update({
    where: {
      collectionId_indicateurId: { collectionId: collection.id, indicateurId: indicateur.id },
    },
    data: { ponderation: body.ponderation },
  })
}

export const updateCollectionIndicateurPonderation = (
  publicId: string,
  indicateurPublicId: string,
  body: UpdateCollectionIndicateurPonderationBody,
): ResultAsync<CollectionApiModel, never> =>
  ResultAsync.fromSafePromise(performUpdate(publicId, indicateurPublicId, body)).andThen(() =>
    getCollectionByPublicId(publicId),
  )
```

- [ ] **Step 9 : Lancer le test pour le voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/updateCollectionIndicateurPonderation.test.ts`
Expected: PASS

- [ ] **Step 10 : Écrire le test qui relie pondération et taux de progression**

Lire d'abord `src/collection/queries/getCollectionTauxProgression.test.ts` pour reprendre son montage de fixtures (indicateur + objectifs + valeurs + individu). Ajouter dans `updateCollectionIndicateurPonderation.test.ts` un cas qui : monte une collection à deux indicateurs dont les taux diffèrent, relève le taux global, porte la pondération du premier à `3`, et vérifie que le taux global s'est déplacé vers celui du premier indicateur.

L'assertion doit comparer deux valeurs mesurées, pas une constante recopiée :

```ts
      const avant = (await runAsPrincipal(apiKey.id, () =>
        getCollectionTauxProgression(publicId, { individu: individuId }),
      ))._unsafeUnwrap().tauxProgression

      await runAsPrincipal(apiKey.id, () =>
        updateCollectionIndicateurPonderation(publicId, indicateurFort, { ponderation: 3 }),
      )

      const apres = (await runAsPrincipal(apiKey.id, () =>
        getCollectionTauxProgression(publicId, { individu: individuId }),
      ))._unsafeUnwrap().tauxProgression

      expect(apres).not.toBe(avant)
      expect(apres!).toBeGreaterThan(avant!)
```

- [ ] **Step 11 : Lancer le test**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/updateCollectionIndicateurPonderation.test.ts`
Expected: PASS — sans modifier une ligne de code de calcul.

- [ ] **Step 12 : Écrire le test de retrait**

Créer `removeCollectionIndicateur.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { removeCollectionIndicateur } from '@/collection/commands/removeCollectionIndicateur'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testCollectionNumericId, testIndicateurIds } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('removeCollectionIndicateur', () => {
  it(
    'retire le lien sans supprimer l’indicateur',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const [indicateurId] = testIndicateurIds(1)
      const collection = await fixtures.collection({
        publicId,
        indicateurs: [{ publicId: indicateurId }],
      })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      await runAsPrincipal(apiKey.id, () => removeCollectionIndicateur(publicId, indicateurId))

      expect(
        await db().collectionIndicateur.count({ where: { collectionId: collection.id } }),
      ).toBe(0)
      expect(await db().indicateur.findUnique({ where: { publicId: indicateurId } })).not.toBeNull()
    }),
  )

  it(
    'reste idempotent sur un lien absent',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      const [indicateurId] = testIndicateurIds(1)
      await fixtures.collection({ publicId })
      await fixtures.indicateur({ publicId: indicateurId })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () =>
        removeCollectionIndicateur(publicId, indicateurId),
      )

      expect(result.isOk()).toBe(true)
    }),
  )
})
```

- [ ] **Step 13 : Lancer le test pour le voir échouer, puis écrire la commande**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/removeCollectionIndicateur.test.ts`
Expected: FAIL — module introuvable.

```ts
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'

const performRemove = async (publicId: string, indicateurPublicId: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  await db().collectionIndicateur.deleteMany({
    where: {
      collection: { publicId },
      indicateur: { publicId: indicateurPublicId },
    },
  })
}

export const removeCollectionIndicateur = (
  publicId: string,
  indicateurPublicId: string,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performRemove(publicId, indicateurPublicId))
```

- [ ] **Step 14 : Lancer le test pour le voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/removeCollectionIndicateur.test.ts`
Expected: PASS

- [ ] **Step 15 : Brancher les trois routes**

Dans `routes.ts`, ajouter le schéma de params puis les trois routes :

```ts
const collectionIndicateurParamsSchema = z.object({
  id: collectionPublicIdSchema,
  indicateurId: indicateurPublicIdSchema,
})

const AddCollectionIndicateurBodySchema = addCollectionIndicateurBodySchema.openapi(
  'AddCollectionIndicateurBody',
)
const UpdateCollectionIndicateurPonderationBodySchema =
  updateCollectionIndicateurPonderationBodySchema.openapi(
    'UpdateCollectionIndicateurPonderationBody',
  )
```

- `POST /collections/{id}/indicateurs` — `request: { params: detailParamsSchema, body: … }`, réponses `200` (`CollectionApiModelSchema`), `400`, `403`, `404`, `409` (`erreur409`).
- `PATCH /collections/{id}/indicateurs/{indicateurId}` — `request: { params: collectionIndicateurParamsSchema, body: … }`, réponses `200`, `400`, `403`, `404`.
- `DELETE /collections/{id}/indicateurs/{indicateurId}` — `request: { params: collectionIndicateurParamsSchema }`, réponses `204`, `403`.

Chaque handler suit le gabarit des tâches précédentes : `withTransaction`, puis `result.match(…)` avec `jsonResponseOk` ou `context.body(null, 204)`. Descriptions à écrire dans le même registre que les routes existantes, en mentionnant la réservation aux clés `ADMIN` et, pour `PATCH`, l'effet direct sur le taux de progression.

- [ ] **Step 16 : Compléter le test de câblage**

Dans `routes.test.ts` :

```ts
    expect(doc.paths['/collections/{id}/indicateurs']?.post).toBeDefined()
    expect(doc.paths['/collections/{id}/indicateurs/{indicateurId}']?.patch).toBeDefined()
    expect(doc.paths['/collections/{id}/indicateurs/{indicateurId}']?.delete).toBeDefined()
```

Run: `pnpm -F @pilote/kpilote-api test src/collection`
Expected: PASS

- [ ] **Step 17 : Lint puis commit** (`ajoute l'affectation des indicateurs et leur pondération`)

---

### Task 7 : Responsables d'une collection — ajout et retrait

**Files:**
- Modify: `packages/kpilote-shared/src/collection.ts`
- Create: `apps/kpilote-api/src/collection/commands/addCollectionResponsable.ts` + `.test.ts`
- Create: `apps/kpilote-api/src/collection/commands/removeCollectionResponsable.ts` + `.test.ts`
- Modify: `apps/kpilote-api/src/collection/routes.ts`
- Modify: `apps/kpilote-api/src/collection/routes.test.ts`

**Interfaces:**
- Produces: `addCollectionResponsable(publicId, body): ResultAsync<CollectionApiModel, never>` avec `addCollectionResponsableBodySchema` = `{ utilisateurId: string }` (UUID), et `removeCollectionResponsable(publicId, utilisateurId): ResultAsync<void, never>`.

- [ ] **Step 1 : Ajouter le schéma de body partagé**

```ts
export const addCollectionResponsableBodySchema = z.object({
  utilisateurId: z.string().uuid().describe("Identifiant (UUID) de l'utilisateur responsable."),
})
export type AddCollectionResponsableBody = z.infer<typeof addCollectionResponsableBodySchema>
```

- [ ] **Step 2 : Écrire les tests d'ajout qui échouent**

Créer `addCollectionResponsable.test.ts`, sur le gabarit de `addCollectionIndicateur.test.ts`, avec trois cas :

```ts
  it(
    'ajoute l’utilisateur aux responsables',
    integrationTest(async () => {
      const publicId = testCollectionNumericId()
      await fixtures.collection({ publicId })
      const utilisateur = await fixtures.utilisateur({ email: testEmail() })
      const apiKey = await fixtures.apiKey({ role: 'ADMIN' })

      const result = await runAsPrincipal(apiKey.id, () =>
        addCollectionResponsable(publicId, { utilisateurId: utilisateur.id }),
      )

      expect(result._unsafeUnwrap().responsables).toEqual([
        expect.objectContaining({ id: utilisateur.id, email: utilisateur.email }),
      ])
    }),
  )
```

plus « refuse un utilisateur déjà responsable » (attendu : `'Cet utilisateur est déjà responsable de la collection'`) et « refuse une clé API non ADMIN ». Vérifier la signature de `fixtures.utilisateur` avant d'écrire.

- [ ] **Step 3 : Lancer le test pour le voir échouer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/addCollectionResponsable.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 4 : Écrire la commande d'ajout**

```ts
import {
  type AddCollectionResponsableBody,
  type CollectionApiModel,
} from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'

const performAdd = async (
  publicId: string,
  body: AddCollectionResponsableBody,
): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  const collection = await db().collection.findUniqueOrThrow({
    where: { publicId },
    select: { id: true },
  })
  await db().utilisateur.findUniqueOrThrow({ where: { id: body.utilisateurId } })

  const existant = await db().collectionResponsable.findUnique({
    where: {
      collectionId_utilisateurId: {
        collectionId: collection.id,
        utilisateurId: body.utilisateurId,
      },
    },
  })
  if (existant) throw new ConflictError('Cet utilisateur est déjà responsable de la collection')

  await db().collectionResponsable.create({
    data: { collectionId: collection.id, utilisateurId: body.utilisateurId },
  })
}

export const addCollectionResponsable = (
  publicId: string,
  body: AddCollectionResponsableBody,
): ResultAsync<CollectionApiModel, never> =>
  ResultAsync.fromSafePromise(performAdd(publicId, body)).andThen(() =>
    getCollectionByPublicId(publicId),
  )
```

- [ ] **Step 5 : Lancer le test pour le voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands/addCollectionResponsable.test.ts`
Expected: PASS

- [ ] **Step 6 : Écrire le test de retrait qui échoue**

Créer `removeCollectionResponsable.test.ts` avec deux cas : le retrait vide bien `responsables` dans le modèle rechargé, et un retrait sur un utilisateur non responsable reste `ok`.

- [ ] **Step 7 : Écrire la commande de retrait**

```ts
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'

const performRemove = async (publicId: string, utilisateurId: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  await db().collectionResponsable.deleteMany({
    where: { collection: { publicId }, utilisateurId },
  })
}

export const removeCollectionResponsable = (
  publicId: string,
  utilisateurId: string,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performRemove(publicId, utilisateurId))
```

- [ ] **Step 8 : Lancer les tests pour les voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/commands`
Expected: PASS

- [ ] **Step 9 : Brancher les deux routes**

```ts
const collectionResponsableParamsSchema = z.object({
  id: collectionPublicIdSchema,
  utilisateurId: z.string().uuid(),
})
```

- `POST /collections/{id}/responsables` — réponses `200`, `400`, `403`, `404`, `409`.
- `DELETE /collections/{id}/responsables/{utilisateurId}` — réponses `204`, `403`.

Même gabarit de handler que les tâches précédentes.

- [ ] **Step 10 : Compléter le test de câblage puis lancer la suite collection**

```ts
    expect(doc.paths['/collections/{id}/responsables']?.post).toBeDefined()
    expect(doc.paths['/collections/{id}/responsables/{utilisateurId}']?.delete).toBeDefined()
```

Run: `pnpm -F @pilote/kpilote-api test src/collection`
Expected: PASS

- [ ] **Step 11 : Lint puis commit** (`ajoute l'affectation des responsables de collection`)

---

### Task 8 : `GET /collections/{id}/permissions` — lecture inverse

**Files:**
- Modify: `packages/kpilote-shared/src/permission.ts`
- Create: `apps/kpilote-api/src/collection/queries/listCollectionPermissions.ts` + `.test.ts`
- Modify: `apps/kpilote-api/src/collection/routes.ts`
- Modify: `apps/kpilote-api/src/collection/routes.test.ts`

**Interfaces:**
- Produces: `listCollectionPermissions(publicId: string): ResultAsync<CollectionPermissionsApiModel, never>` avec `CollectionPermissionsApiModel = { items: Array<{ principalId: string; type: 'UTILISATEUR' | 'API_KEY'; libelle: string; actions: PermissionActionValue[] }> }`.

- [ ] **Step 1 : Ajouter le schéma partagé**

Dans `packages/kpilote-shared/src/permission.ts` :

```ts
export const collectionPermissionPrincipalTypeSchema = z.enum(['UTILISATEUR', 'API_KEY'])

export const collectionPermissionsApiModelSchema = z.object({
  items: z
    .array(
      z.object({
        principalId: z.string().uuid(),
        type: collectionPermissionPrincipalTypeSchema,
        libelle: z
          .string()
          .describe("Email de l'utilisateur, ou nom de la clé API selon le `type`."),
        actions: z.array(permissionActionSchema).min(1).describe('Triées `READ` avant `WRITE`.'),
      }),
    )
    .describe('Principals disposant d’une permission directe, triés par `type` puis `libelle`.'),
})
export type CollectionPermissionsApiModel = z.infer<typeof collectionPermissionsApiModelSchema>
```

- [ ] **Step 2 : Écrire le test qui échoue**

Créer `listCollectionPermissions.test.ts`. Lire `src/permission/queries/getPrincipalPermissions.test.ts` pour reprendre son montage (`fixtures.apiKey({ collectionPermissions: [...] })`, `fixtures.utilisateur`). Trois cas :

- une collection sans aucune permission renvoie `{ items: [] }`
- un utilisateur avec `READ` + `WRITE` produit une entrée unique, `actions: ['READ', 'WRITE']`, `type: 'UTILISATEUR'`, `libelle` = son email
- une clé API et un utilisateur cohabitent, triés par `type` puis `libelle`

- [ ] **Step 3 : Lancer le test pour le voir échouer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/queries/listCollectionPermissions.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 4 : Écrire la query**

```ts
import {
  type CollectionPermissionsApiModel,
  type PermissionActionValue,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

const ORDRE_ACTIONS: PermissionActionValue[] = [PermissionAction.READ, PermissionAction.WRITE]

const performList = async (publicId: string): Promise<CollectionPermissionsApiModel> => {
  const lignes = await db().collectionPermission.findMany({
    where: { collection: { publicId } },
    include: {
      principal: { include: { utilisateur: true, apiKey: true } },
    },
  })

  const parPrincipal = new Map<string, CollectionPermissionsApiModel['items'][number]>()
  for (const ligne of lignes) {
    const { utilisateur, apiKey } = ligne.principal
    const entree = parPrincipal.get(ligne.principalId) ?? {
      principalId: ligne.principalId,
      type: utilisateur ? ('UTILISATEUR' as const) : ('API_KEY' as const),
      libelle: utilisateur?.email ?? apiKey?.nom ?? ligne.principalId,
      actions: [] as PermissionActionValue[],
    }
    entree.actions.push(ligne.action)
    parPrincipal.set(ligne.principalId, entree)
  }

  const items = [...parPrincipal.values()]
    .map((entree) => ({
      ...entree,
      actions: ORDRE_ACTIONS.filter((action) => entree.actions.includes(action)),
    }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.libelle.localeCompare(b.libelle))

  return { items }
}

export const listCollectionPermissions = (
  publicId: string,
): ResultAsync<CollectionPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performList(publicId))
```

Vérifier dans `schema.prisma` le nom du champ libellé de `ApiKey` (`nom`, `libelle`, `label`…) et l'ajuster.

- [ ] **Step 5 : Lancer le test pour le voir passer**

Run: `pnpm -F @pilote/kpilote-api test src/collection/queries/listCollectionPermissions.test.ts`
Expected: PASS

- [ ] **Step 6 : Brancher la route**

`GET /collections/{id}/permissions`, `tags: ['Collection', 'Permission', 'Admin']`, `middleware: [requireAuthentication]`, `request: { params: detailParamsSchema }`, réponse `200` avec `CollectionPermissionsApiModelSchema`. La description doit préciser que c'est la lecture inverse de `GET /permissions?principalId=…` et que l'octroi passe par `POST /permissions/collection`.

- [ ] **Step 7 : Compléter le test de câblage puis lancer la suite**

```ts
    expect(doc.paths['/collections/{id}/permissions']?.get).toBeDefined()
```

Run: `pnpm -F @pilote/kpilote-api test src/collection && pnpm -F @pilote/kpilote-api lint`
Expected: PASS, aucune erreur de lint.

- [ ] **Step 8 : Commit** (`ajoute la lecture des permissions par collection`)

---

### Task 9 : Panel admin — couche d'accès

**Files:**
- Modify: `apps/kpilote-admin/src/api/collections.ts`
- Create: `apps/kpilote-admin/src/queries/collections.ts`

**Interfaces:**
- Consumes: toutes les routes des tâches 3 à 8.
- Produces: `fetchCollectionById`, `createCollection`, `upsertCollection`, `deleteCollection`, `addCollectionIndicateur`, `updateCollectionIndicateurPonderation`, `removeCollectionIndicateur`, `addCollectionResponsable`, `removeCollectionResponsable`, `fetchCollectionPermissions` ; et les options `collectionsInfiniteQueryOptions(recherche)`, `collectionQueryOptions(id)`, `collectionPermissionsQueryOptions(id)`.

- [ ] **Step 1 : Étendre le client d'API**

Dans `apps/kpilote-admin/src/api/collections.ts`, à la suite de `fetchCollections`, en suivant exactement le style de `api/indicateurs.ts` (parsing systématique de la réponse par le schéma partagé) :

```ts
export const fetchCollectionById = async (id: string): Promise<CollectionApiModel> => {
  const json = await bffClient.get(`collections/${id}`).json()
  return collectionApiModelSchema.parse(json)
}

export const createCollection = async (
  body: CreateCollectionBody,
): Promise<CollectionApiModel> => {
  const json = await bffClient.post('collections', { json: body }).json()
  return collectionApiModelSchema.parse(json)
}

export const upsertCollection = async (
  id: string,
  body: UpsertCollectionBody,
): Promise<CollectionApiModel> => {
  const json = await bffClient.put(`collections/${id}`, { json: body }).json()
  return collectionApiModelSchema.parse(json)
}

export const deleteCollection = async (id: string): Promise<void> => {
  await bffClient.delete(`collections/${id}`)
}

export const addCollectionIndicateur = async (
  id: string,
  body: AddCollectionIndicateurBody,
): Promise<CollectionApiModel> => {
  const json = await bffClient.post(`collections/${id}/indicateurs`, { json: body }).json()
  return collectionApiModelSchema.parse(json)
}

export const updateCollectionIndicateurPonderation = async (
  id: string,
  indicateurId: string,
  ponderation: number,
): Promise<CollectionApiModel> => {
  const json = await bffClient
    .patch(`collections/${id}/indicateurs/${indicateurId}`, { json: { ponderation } })
    .json()
  return collectionApiModelSchema.parse(json)
}

export const removeCollectionIndicateur = async (
  id: string,
  indicateurId: string,
): Promise<void> => {
  await bffClient.delete(`collections/${id}/indicateurs/${indicateurId}`)
}

export const addCollectionResponsable = async (
  id: string,
  utilisateurId: string,
): Promise<CollectionApiModel> => {
  const json = await bffClient
    .post(`collections/${id}/responsables`, { json: { utilisateurId } })
    .json()
  return collectionApiModelSchema.parse(json)
}

export const removeCollectionResponsable = async (
  id: string,
  utilisateurId: string,
): Promise<void> => {
  await bffClient.delete(`collections/${id}/responsables/${utilisateurId}`)
}

export const fetchCollectionPermissions = async (
  id: string,
): Promise<CollectionPermissionsApiModel> => {
  const json = await bffClient.get(`collections/${id}/permissions`).json()
  return collectionPermissionsApiModelSchema.parse(json)
}
```

Compléter les imports de types en tête de fichier.

- [ ] **Step 2 : Créer les options de query**

Créer `apps/kpilote-admin/src/queries/collections.ts`, calqué sur `queries/indicateurs.ts` :

```ts
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { fetchCollectionById, fetchCollectionPermissions, fetchCollections } from '@/api/collections'

export const collectionsInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['collections', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchCollections({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const collectionQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['collection', id], queryFn: () => fetchCollectionById(id) })

export const collectionPermissionsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['collection', id, 'permissions'],
    queryFn: () => fetchCollectionPermissions(id),
  })
```

- [ ] **Step 3 : Vérifier la compilation**

Run: `pnpm -F @pilote/kpilote-admin lint`
Expected: aucune erreur.

- [ ] **Step 4 : Commit** (`ajoute la couche d'accès aux collections dans le panel admin`)

---

### Task 10 : Panel admin — liste `/collections` et carte d'entrée

**Files:**
- Create: `apps/kpilote-admin/src/routes/_authed/collections/index.tsx`
- Modify: `apps/kpilote-admin/src/routes/_authed/fonctionnalites.tsx`

**Interfaces:**
- Consumes: `collectionsInfiniteQueryOptions` (Task 9).
- Produces: la route `/collections`, cible du lien de la carte et du fil d'Ariane des tâches 11 à 14.

- [ ] **Step 1 : Écrire l'écran de liste**

Créer `routes/_authed/collections/index.tsx` en copiant la structure de `routes/_authed/indicateurs/index.tsx` : même `Breadcrumb`, `PageHeading` avec sous-titre `{total} collection{s} · environnement {env}`, même champ de recherche, même `Table`, même bouton « Charger plus ».

Colonnes : `ID` (`font-mono text-primary`), `Nom` (`font-semibold`), `Visibilité` (badge, en réutilisant la constante `VISIBILITE_BADGE` telle qu'elle est écrite dans l'écran indicateurs), `Indicateurs` (`collection.indicateurs.length`, aligné au centre), `Responsables` (`collection.responsables.length`, aligné au centre), puis la colonne flèche.

Ligne cliquable via `clickableRowProps(() => void navigate({ to: '/collections/$id', params: { id: collection.id } }))`.

Action du `PageHeading` :

```tsx
        action={
          <Button asChild>
            <Link to="/collections/nouveau">
              <Plus className="size-4" /> Créer une collection
            </Link>
          </Button>
        }
```

`EmptyState` : titre « Aucune collection », description « Créez votre première collection. »

- [ ] **Step 2 : Ajouter la carte dans le hub**

Dans `fonctionnalites.tsx`, importer `Layers` depuis `lucide-react` et insérer une carte après celle des indicateurs, en décalant de 60 ms les `delayMs` des cartes suivantes :

```tsx
        <FadeIn delayMs={120}>
          <BarCard
            icon={Layers}
            title="Gérer les collections"
            description="Créer ou modifier une collection, ses indicateurs et ses utilisateurs."
            onClick={() => void navigate({ to: '/collections' })}
          />
        </FadeIn>
```

- [ ] **Step 3 : Régénérer l'arbre de routes et vérifier**

Run: `pnpm -F @pilote/kpilote-admin lint`
Expected: aucune erreur. Le script lance `tsr generate` avant ESLint, donc `routeTree.gen.ts` est régénéré et doit être inclus au commit.

- [ ] **Step 4 : Commit** (`ajoute l'écran de liste des collections`)

---

### Task 11 : Panel admin — création `/collections/nouveau`

**Files:**
- Create: `apps/kpilote-admin/src/components/collections/CollectionForm.tsx`
- Create: `apps/kpilote-admin/src/routes/_authed/collections/nouveau.tsx`

**Interfaces:**
- Produces: `CollectionFormValues = { nom: string; description: string; visibilite: CollectionVisibilite }` et le composant `CollectionForm({ initial, pending, onSubmit, onCancel })`. La tâche 12 le réutilise pour l'onglet Détails.

- [ ] **Step 1 : Écrire le formulaire partagé**

Créer `components/collections/CollectionForm.tsx`. Trois champs — `nom` (texte, requis), `description` (`textarea`), `visibilite` (`select` sur `PUBLIC` / `PRIVE`). Aucun champ identifiant.

Suivre le style de `components/UtilisateurForm.tsx` pour la structure, les libellés et les boutons ; s'il utilise `react-hook-form`, brancher le `select` via `Controller` et non via un `input` caché. La conversion `'' → null` de la description passe par `emptyToNull` (`@/lib/emptyToNull`) au moment de la soumission, pas dans le composant.

```tsx
export type CollectionFormValues = {
  nom: string
  description: string
  visibilite: CollectionVisibilite
}

export const buildCollectionInitialValues = (
  collection?: CollectionApiModel,
): CollectionFormValues => ({
  nom: collection?.nom ?? '',
  description: collection?.description ?? '',
  visibilite: collection?.visibilite ?? 'PUBLIC',
})

export const toCollectionBody = (values: CollectionFormValues) => ({
  nom: values.nom,
  description: emptyToNull(values.description),
  visibilite: values.visibilite,
})
```

- [ ] **Step 2 : Écrire l'écran de création**

Créer `routes/_authed/collections/nouveau.tsx`, calqué sur `routes/_authed/indicateurs/nouveau.tsx` :

```tsx
  const mutation = useMutation({
    mutationFn: (values: CollectionFormValues) => createCollection(toCollectionBody(values)),
    onSuccess: async (collection) => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast({ title: 'Collection créée.' })
      void navigate({ to: '/collections/$id', params: { id: collection.id } })
    },
    onError: (err: unknown) => {
      toast({ title: extractApiError(err), variant: 'error' })
    },
  })
```

La redirection vise la fiche et non la liste : les affectations se font dans les onglets, l'utilisateur y enchaîne directement.

- [ ] **Step 3 : Vérifier**

Run: `pnpm -F @pilote/kpilote-admin lint`
Expected: aucune erreur.

- [ ] **Step 4 : Commit** (`ajoute la création de collection dans le panel admin`)

---

### Task 12 : Panel admin — fiche `/collections/$id`, onglet Détails et suppression

**Files:**
- Create: `apps/kpilote-admin/src/routes/_authed/collections/$id.tsx`

**Interfaces:**
- Consumes: `collectionQueryOptions`, `upsertCollection`, `deleteCollection`, `CollectionForm`.
- Produces: la coquille à onglets. Les tâches 13 et 14 y branchent `<CollectionIndicateurs collectionId={id} />` et `<CollectionUtilisateurs collectionId={id} />`.

- [ ] **Step 1 : Écrire la coquille et l'onglet Détails**

Créer `routes/_authed/collections/$id.tsx`, calqué sur `routes/_authed/utilisateurs/$id.tsx` : `loader` avec `ensureQueryData`, `Tabs` / `TabsList` / `TabsTrigger` de `@pilote/kpilote-ui/Tabs`, état local `const [tab, setTab] = useState<'details' | 'indicateurs' | 'utilisateurs'>('details')`.

Le fil d'Ariane pointe `Fonctionnalités` → `Collections` → le nom de la collection. Le `PageHeading` affiche le nom, avec l'identifiant public en sous-titre (`font-mono`).

Onglet Détails :

```tsx
  const modification = useMutation({
    mutationFn: (values: CollectionFormValues) => upsertCollection(id, toCollectionBody(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      await queryClient.invalidateQueries({ queryKey: ['collection', id] })
      toast({ title: 'Collection modifiée.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })
```

Contrairement à l'écran utilisateur, la modification ne redirige pas : on reste sur la fiche pour enchaîner sur les onglets.

- [ ] **Step 2 : Ajouter la suppression**

Sous le formulaire, une zone séparée par une bordure, titrée « Supprimer la collection », avec un texte rappelant que l'opération est définitive et retire aussi les permissions et les affectations, puis un `Button` en rouge :

```tsx
  const suppression = useMutation({
    mutationFn: () => deleteCollection(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast({ title: 'Collection supprimée.' })
      await navigate({ to: '/collections' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })
```

```tsx
            onClick={() => {
              if (window.confirm(`Supprimer définitivement la collection ${collection.nom} ?`))
                suppression.mutate()
            }}
```

`window.confirm` est déjà le mode de confirmation employé par `PrincipalPermissions.tsx:216`.

- [ ] **Step 3 : Poser les deux autres onglets**

Les onglets `indicateurs` et `utilisateurs` rendent pour l'instant un paragraphe de remplacement explicite (`À brancher — tâche 13`, `À brancher — tâche 14`), remplacé aux tâches suivantes. Ne pas laisser ces textes après la tâche 14.

- [ ] **Step 4 : Vérifier**

Run: `pnpm -F @pilote/kpilote-admin lint`
Expected: aucune erreur.

- [ ] **Step 5 : Commit** (`ajoute la fiche collection avec édition et suppression`)

---

### Task 13 : Panel admin — onglet Indicateurs

**Files:**
- Create: `apps/kpilote-admin/src/components/collections/CollectionIndicateurs.tsx`
- Modify: `apps/kpilote-admin/src/routes/_authed/collections/$id.tsx`

**Interfaces:**
- Consumes: `collectionQueryOptions`, `addCollectionIndicateur`, `updateCollectionIndicateurPonderation`, `removeCollectionIndicateur`, `IndicateurPicker`, `indicateursAllQueryOptions`, `useProdEditUnlock`.
- Produces: `<CollectionIndicateurs collectionId={string} />`.

- [ ] **Step 1 : Écrire le composant**

Créer `components/collections/CollectionIndicateurs.tsx`, calqué sur `components/PrincipalPermissions.tsx` : `useSuspenseQuery(collectionQueryOptions(collectionId))`, une mutation unique qui exécute la fonction qu'on lui passe et réinjecte la réponse dans le cache.

```tsx
  const options = collectionQueryOptions(collectionId)
  const { data: collection } = useSuspenseQuery(options)
  const { data: indicateurs } = useSuspenseQuery(indicateursAllQueryOptions())

  const mutation = useMutation({
    mutationFn: (run: () => Promise<CollectionApiModel | void>) => run(),
    onSuccess: async (fresh) => {
      if (fresh) queryClient.setQueryData(options.queryKey, fresh)
      else await queryClient.invalidateQueries({ queryKey: options.queryKey })
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast({ title: 'Collection mise à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })
```

Le retrait ne renvoyant rien (`204`), la branche `else` invalide au lieu de réécrire le cache.

Le bandeau de verrouillage PROD reprend mot pour mot celui de `PrincipalPermissions.tsx:206-224`, avec le libellé de confirmation adapté : « Déverrouiller l'édition des collections en PRODUCTION ? ».

Ajout :

```tsx
        <IndicateurPicker
          excludedIds={collection.indicateurs.map((lien) => lien.id)}
          onSelect={(indicateurId) =>
            mutation.mutate(() => addCollectionIndicateur(collectionId, { indicateurId }))
          }
          disabled={disabled}
        />
```

Liste : une `<ul>` avec la même mise en forme que `PrincipalPermissions` (`divide-y divide-border rounded-lg border border-border`). Chaque ligne affiche le nom de l'indicateur — retrouvé dans `indicateurs` par son identifiant public, avec repli sur l'identifiant si absent —, l'identifiant en `font-mono text-xs`, le champ de pondération, la corbeille.

Le champ de pondération est un état local par ligne, validé au `blur` et sur `Enter`, et n'appelle l'API que si la valeur a changé :

```tsx
function PonderationInput({
  valeur,
  disabled,
  onValider,
}: {
  valeur: number
  disabled: boolean
  onValider: (ponderation: number) => void
}) {
  const [saisie, setSaisie] = useState(String(valeur))

  const valider = () => {
    const nombre = Number(saisie)
    if (!Number.isFinite(nombre) || nombre < 0) {
      setSaisie(String(valeur))
      return
    }
    if (nombre === valeur) return
    onValider(nombre)
  }

  return (
    <input
      type="number"
      min={0}
      step={0.01}
      value={saisie}
      disabled={disabled}
      aria-label="Pondération"
      onChange={(event) => setSaisie(event.target.value)}
      onBlur={valider}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-sm disabled:opacity-50"
    />
  )
}
```

Le composant est déclaré dans le même fichier : il n'a de sens que pour cette liste.

Sous la liste, une phrase en `text-xs text-text-subtle` : « La pondération règle le poids de l'indicateur dans le taux de progression de la collection. 0 l'exclut du calcul. » — elle n'est visible que des administrateurs.

`EmptyState` si `collection.indicateurs` est vide : titre « Aucun indicateur », description « Ajoutez un indicateur à cette collection. »

- [ ] **Step 2 : Brancher l'onglet**

Dans `$id.tsx`, remplacer le paragraphe de remplacement par `<CollectionIndicateurs collectionId={id} />`, et ajouter `indicateursAllQueryOptions()` au `Promise.all` du `loader`.

- [ ] **Step 3 : Vérifier**

Run: `pnpm -F @pilote/kpilote-admin lint`
Expected: aucune erreur.

- [ ] **Step 4 : Commit** (`ajoute l'onglet d'affectation des indicateurs d'une collection`)

---

### Task 14 : Panel admin — onglet Utilisateurs

**Files:**
- Create: `apps/kpilote-admin/src/components/collections/CollectionUtilisateurs.tsx`
- Modify: `apps/kpilote-admin/src/routes/_authed/collections/$id.tsx`

**Interfaces:**
- Consumes: `collectionQueryOptions`, `collectionPermissionsQueryOptions`, `addCollectionResponsable`, `removeCollectionResponsable`, `grantCollectionPermission`, `revokeCollectionPermission`, `UtilisateurPicker`, `utilisateursAllQueryOptions`.
- Produces: `<CollectionUtilisateurs collectionId={string} />`.

- [ ] **Step 1 : Écrire la section Responsables**

Créer `components/collections/CollectionUtilisateurs.tsx`. Même ossature de mutation et même bandeau PROD qu'à la tâche 13.

Section titrée « Responsables », introduite par une phrase en `text-xs text-text-subtle` : « Désignation métier, sans effet sur les droits d'accès. »

```tsx
        <UtilisateurPicker
          excludedIds={collection.responsables.map((responsable) => responsable.id)}
          onSelect={(utilisateur) =>
            mutation.mutate(() => addCollectionResponsable(collectionId, utilisateur.id))
          }
          disabled={disabled}
          placeholder="Ajouter un responsable"
        />
```

Chaque ligne : `{prenom} {nom}`, email en `font-mono text-xs text-text-muted`, corbeille appelant `removeCollectionResponsable`.

- [ ] **Step 2 : Écrire la section Accès**

Section titrée « Accès », alimentée par `useSuspenseQuery(collectionPermissionsQueryOptions(collectionId))`.

Ajout limité aux utilisateurs, en excluant ceux déjà présents :

```tsx
        <UtilisateurPicker
          excludedIds={permissions.items.map((item) => item.principalId)}
          onSelect={(utilisateur) =>
            mutation.mutate(() =>
              grantCollectionPermission({
                principalId: utilisateur.id,
                collectionPublicId: collectionId,
                action: 'READ',
              }),
            )
          }
          disabled={disabled}
          placeholder="Donner accès à un utilisateur"
        />
```

`grantCollectionPermission` et `revokeCollectionPermission` renvoient un `PrincipalPermissionsApiModel`, pas le modèle de collection : leur mutation invalide `collectionPermissionsQueryOptions(collectionId).queryKey` au lieu de réécrire un cache. Prévoir une seconde mutation dédiée dans le composant plutôt que de faire porter deux formes de réponse à la première.

Chaque ligne affiche le libellé, une puce `API` en `text-xs` quand `type === 'API_KEY'`, la mention `Lecture` non cliquable, la bascule `Écriture` reprise de `PrincipalPermissions.tsx:118-131`, et la corbeille appelant `revokeCollectionPermission({ principalId, collectionPublicId: collectionId })` sans `action` — ce qui retire toutes les actions.

La bascule Écriture :

```tsx
                      onClick={() =>
                        permissionMutation.mutate(() =>
                          item.actions.includes('WRITE')
                            ? revokeCollectionPermission({
                                principalId: item.principalId,
                                collectionPublicId: collectionId,
                                action: 'WRITE',
                              })
                            : grantCollectionPermission({
                                principalId: item.principalId,
                                collectionPublicId: collectionId,
                                action: 'WRITE',
                              }),
                        )
                      }
```

Sous la section, une phrase en `text-xs text-text-subtle` : « Les clés API sont listées ici mais s'ajoutent depuis Gérer les clés API. »

- [ ] **Step 3 : Brancher l'onglet**

Dans `$id.tsx`, remplacer le paragraphe de remplacement par `<CollectionUtilisateurs collectionId={id} />`, et ajouter `utilisateursAllQueryOptions()` et `collectionPermissionsQueryOptions(params.id)` au `Promise.all` du `loader`. Vérifier qu'aucun texte « À brancher » ne subsiste dans le fichier.

- [ ] **Step 4 : Vérifier l'ensemble**

Run: `pnpm -F @pilote/kpilote-admin lint && pnpm -F @pilote/kpilote-api lint && pnpm -F @pilote/kpilote-api test`
Expected: aucune erreur, toute la suite API au vert.

- [ ] **Step 5 : Commit** (`ajoute l'onglet d'affectation des utilisateurs d'une collection`)

---

## Vérification finale

- [ ] `pnpm -F @pilote/kpilote-api test` — suite complète au vert, pas seulement `src/collection`.
- [ ] `pnpm -F @pilote/kpilote-api lint`, `pnpm -F @pilote/kpilote-admin lint`, `pnpm -F @pilote/kpilote-webapp lint`, `pnpm -F @pilote/kpilote-shared lint`.
- [ ] `grep -rn "indicateurIds" apps packages --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v pilote-ppg` ne remonte plus rien sur le modèle collection.
- [ ] Parcours manuel dans le panel admin, à faire valider par l'utilisateur : créer une collection, vérifier que son identifiant `COL-NNN` suit le dernier existant, lui affecter deux indicateurs, changer une pondération, ajouter un responsable, donner un accès en lecture puis en écriture, retirer chaque élément, supprimer la collection.
