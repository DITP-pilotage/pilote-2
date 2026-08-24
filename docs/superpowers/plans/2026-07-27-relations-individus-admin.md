# Relations entre individus — panel admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouvrir en écriture la table `relation` (hiérarchie parent/enfant des individus) via quatre endpoints `kpilote-api`, et livrer l'écran `/relations` du panel admin qui les consomme.

**Architecture:** Nouveau module `src/relation/` dans `kpilote-api` (routes + queries + commands), calqué sur les modules `referentiel` et `individu` existants. La règle « un individu a au plus un parent » est un invariant structurel : la relation est identifiée par le public ID de son **enfant**, et `PUT` est un remplacement idempotent. Côté admin, un écran TanStack Router avec infinite query sur `GET /relations` et deux `Picker` alimentés par un `GET /individus` chargé intégralement une fois.

**Tech Stack:** Hono + `@hono/zod-openapi`, Prisma, `neverthrow` (`ResultAsync`), Zod 4, Vitest (tests d'intégration sur base réelle), React 19 + TanStack Router/Query, Tailwind, cmdk, `@pilote/kpilote-ui`.

## Global Constraints

- **Gestionnaire de paquets : `pnpm` uniquement** (v10). Jamais `npm`.
- **Aucune migration Prisma.** La table `relation` existe déjà et le client est généré. Ne pas toucher à `schema.prisma`.
- **Ne rien faire sur les conteneurs Docker de la base.** Les tests d'intégration ont besoin de la base de test : si elle ne répond pas, demander à l'utilisateur de vérifier que Docker tourne, ne pas tenter de démarrer/arrêter un conteneur.
- **Nommage kpilote :** verbes et termes techniques en anglais, noms d'entités métier en français (`upsertRelationParent`, `listRelations`, `supprimerRelation`).
- **Public IDs sans suffixe `Id` dans les payloads API.** Le champ du body est `parent`, pas `parentId`. L'UUID interne n'est jamais exposé.
- **`@/<dossier>/*` doit être déclaré explicitement** dans `apps/kpilote-api/tsconfig.json`. Vite et Vitest résolvent via `resolve: { tsconfigPaths: true }` : sans l'entrée, le module ne résout ni à l'exécution ni aux tests.
- **Chaque nouveau fichier de `packages/kpilote-shared/src`** doit être ajouté à la map `exports` de `packages/kpilote-shared/package.json`, sinon l'import échoue.
- **Pas de commentaires explicatifs superflus** dans le code. Un commentaire n'est justifié que pour une contrainte non devinable (ex. pourquoi un second critère de tri est obligatoire).
- **Tailwind + composants `@pilote/kpilote-ui`**, jamais de classes DSFR `fr-*`, jamais de couleur en dur (utiliser les tokens : `text-text`, `border-border`, `bg-surface`, `text-primary`…).
- **Pas de tests front.** Les tests portent uniquement sur `kpilote-api`.
- **`pnpm lint` doit passer avant chaque commit** (`lint` = eslint + `tsc --noEmit` + prettier).
- **Pas de trailer `Co-Authored-By`** dans les messages de commit.

## Écart assumé vis-à-vis de la spec

La spec prévoit `404` sur `DELETE /relations/{id}` quand l'individu n'a pas de parent. Le plan retient **`204` idempotent**, conformément à la convention déjà en place dans le repo pour les suppressions (`objectifIndicateurIndividu/routes.ts:98`, `valeurAvancement/routes.ts:173` : « Idempotent : retourne `204` même si l'objectif n'existait pas »). Le comportement observable côté admin est identique.

## File Structure

### `packages/kpilote-shared`

| Fichier | Responsabilité |
|---|---|
| `src/relation.ts` *(nouveau)* | Schémas Zod du modèle API relation, de la liste paginée, de la query de liste et du body d'upsert |
| `src/individu.ts` *(modifié)* | Ajout de `listIndividusQuerySchema` |
| `package.json` *(modifié)* | Entrée `./relation` dans `exports` |

### `apps/kpilote-api`

| Fichier | Responsabilité |
|---|---|
| `src/relation/utils.ts` *(nouveau)* | `relationInclude` + `toRelationApiModel` (mapping Prisma → modèle API) |
| `src/relation/queries/listRelations.ts` *(nouveau)* | Liste paginée triée par nom d'enfant |
| `src/relation/queries/getRelationByEnfant.ts` *(nouveau)* | Lecture d'une relation par public ID de l'enfant, pour la réponse du `PUT` |
| `src/relation/commands/upsertRelationParent.ts` *(nouveau)* | Écriture idempotente + garde d'autorisation + refus auto-parent et cycle |
| `src/relation/commands/supprimerRelation.ts` *(nouveau)* | Suppression idempotente + garde d'autorisation |
| `src/relation/routes.ts` *(nouveau)* | Déclarations OpenAPI et handlers des 3 routes `/relations` |
| `src/individu/queries/listIndividus.ts` *(nouveau)* | Liste paginée globale des individus |
| `src/individu/routes.ts` *(modifié)* | Ajout de `GET /individus` |
| `src/app.ts` *(modifié)* | Enregistrement de `relationRoutes` |
| `tsconfig.json` *(modifié)* | Alias `@/relation/*` |

### `apps/kpilote-admin`

| Fichier | Responsabilité |
|---|---|
| `src/server/api/router.ts` *(modifié)* | Ajout de `relations` à l'allowlist `SAFE_PATH` du proxy BFF |
| `src/api/relations.ts` *(nouveau)* | Appels HTTP relations (fetch, upsert, delete) + parsing Zod |
| `src/api/individus.ts` *(nouveau)* | Appel HTTP `GET /individus` + pagination complète |
| `src/queries/relations.ts` *(nouveau)* | `relationsInfiniteQueryOptions` |
| `src/queries/individus.ts` *(nouveau)* | `individusAllQueryOptions` |
| `src/components/relations/IndividuPicker.tsx` *(nouveau)* | Picker d'individus, servant à la fois de contrôle d'ajout et de cellule parent |
| `src/routes/_authed/relations/index.tsx` *(nouveau)* | L'écran : tableau, ajout, édition, suppression, verrou prod |
| `src/routes/_authed/fonctionnalites.tsx` *(modifié)* | `BarCard` « Gérer les relations » |

---

## Task 1: Schémas partagés et query `listRelations`

**Files:**
- Create: `packages/kpilote-shared/src/relation.ts`
- Modify: `packages/kpilote-shared/package.json` (map `exports`)
- Create: `apps/kpilote-api/src/relation/utils.ts`
- Create: `apps/kpilote-api/src/relation/queries/listRelations.ts`
- Test: `apps/kpilote-api/src/relation/queries/listRelations.test.ts`
- Modify: `apps/kpilote-api/tsconfig.json` (alias `@/relation/*`)

**Interfaces:**
- Consumes: `createPaginatedApiListSchema`, `listQuerySchema` (`@pilote/kpilote-shared/pagination`) ; `individuPublicIdSchema`, `referentielPublicIdSchema` (`@pilote/kpilote-shared/publicIds`) ; `buildPaginationArgs`, `toPaginatedResponse` (`@/framework/persistence/paginate`) ; `db()` (`@/framework/persistence/dbStore`)
- Produces:
  - `relationApiModelSchema`, `relationListApiModelSchema`, `listRelationsQuerySchema`, `upsertRelationBodySchema` et les types `RelationApiModel`, `RelationListApiModel`, `ListRelationsQuery`, `UpsertRelationBody` depuis `@pilote/kpilote-shared/relation`
  - `relationInclude` et `toRelationApiModel(row: RelationWithIndividus): RelationApiModel` depuis `@/relation/utils`
  - `listRelations(params: ListRelationsQuery): ResultAsync<RelationListApiModel, never>` depuis `@/relation/queries/listRelations`

---

- [ ] **Step 1: Créer les schémas partagés**

Créer `packages/kpilote-shared/src/relation.ts` :

```ts
import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { individuPublicIdSchema, referentielPublicIdSchema } from './publicIds'

const relationIndividuSchema = z.object({
  id: individuPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'individu."),
  referentiel: referentielPublicIdSchema.describe("Référentiel auquel l'individu appartient."),
})

export const relationApiModelSchema = z.object({
  enfant: relationIndividuSchema.describe("Individu enfant. Il identifie la relation : un individu a au plus un parent."),
  parent: relationIndividuSchema.describe("Individu parent."),
})
export type RelationApiModel = z.infer<typeof relationApiModelSchema>

export const relationListApiModelSchema = createPaginatedApiListSchema(relationApiModelSchema)
export type RelationListApiModel = z.infer<typeof relationListApiModelSchema>

export const listRelationsQuerySchema = listQuerySchema
export type ListRelationsQuery = z.infer<typeof listRelationsQuerySchema>

export const upsertRelationBodySchema = z.object({
  parent: individuPublicIdSchema.describe("Identifiant public de l'individu parent."),
})
export type UpsertRelationBody = z.infer<typeof upsertRelationBodySchema>
```

- [ ] **Step 2: Déclarer l'export du package**

Dans `packages/kpilote-shared/package.json`, ajouter dans `exports`, juste après l'entrée `"./referentiel"` :

```json
    "./relation": {
      "types": "./src/relation.ts",
      "default": "./src/relation.ts"
    },
```

- [ ] **Step 3: Déclarer l'alias TypeScript**

Dans `apps/kpilote-api/tsconfig.json`, ajouter dans `compilerOptions.paths`, juste après la ligne `"@/referentiel/*"` :

```json
      "@/relation/*": ["./src/relation/*"],
```

Sans cette entrée, `@/relation/...` ne résout ni sous `tsc` ni sous Vitest (`resolve: { tsconfigPaths: true }`).

- [ ] **Step 4: Écrire le mapping Prisma → modèle API**

Créer `apps/kpilote-api/src/relation/utils.ts` :

```ts
import { type RelationApiModel } from '@pilote/kpilote-shared/relation'

import { type IndividuModel, type RelationModel } from '@/generated/prisma/models'

type IndividuAvecReferentiel = IndividuModel & { referentiel: { publicId: string } }

export type RelationWithIndividus = RelationModel & {
  parent: IndividuAvecReferentiel
  child: IndividuAvecReferentiel
}

export const relationInclude = {
  parent: { include: { referentiel: true } },
  child: { include: { referentiel: true } },
} as const

const toIndividu = (individu: IndividuAvecReferentiel) => ({
  id: individu.publicId,
  nom: individu.nom,
  referentiel: individu.referentiel.publicId,
})

export const toRelationApiModel = (relation: RelationWithIndividus): RelationApiModel => ({
  enfant: toIndividu(relation.child),
  parent: toIndividu(relation.parent),
})
```

- [ ] **Step 5: Écrire le test qui échoue**

Créer `apps/kpilote-api/src/relation/queries/listRelations.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { listRelations } from '@/relation/queries/listRelations'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testReferentielId, testRegId } from '@/test/randomIds'

describe.concurrent('listRelations', () => {
  it(
    "retourne une liste vide quand aucune relation n'existe",
    integrationTest(async () => {
      const result = await listRelations({})

      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    "expose l'enfant et le parent avec leur référentiel",
    integrationTest(async () => {
      const refDept = testReferentielId()
      const refReg = testReferentielId()
      const [dept] = testDeptIds(1)
      const reg = testRegId()
      await fixtures.relation({
        parent: { publicId: reg, nom: 'Occitanie', referentiel: { publicId: refReg } },
        child: { publicId: dept, nom: 'Gers', referentiel: { publicId: refDept } },
      })

      const result = await listRelations({})

      expect(result._unsafeUnwrap().items).toEqual([
        {
          enfant: { id: dept, nom: 'Gers', referentiel: refDept },
          parent: { id: reg, nom: 'Occitanie', referentiel: refReg },
        },
      ])
    }),
  )

  it(
    "trie par nom d'enfant croissant",
    integrationTest(async () => {
      const refDept = testReferentielId()
      const [a, b, c] = testDeptIds(3)
      const reg = testRegId()
      const parent = { publicId: reg, nom: 'Parent' }
      await fixtures.relation(
        { parent, child: { publicId: b, nom: 'Bouches-du-Rhône', referentiel: { publicId: refDept } } },
        { parent, child: { publicId: c, nom: 'Cantal', referentiel: { publicId: refDept } } },
        { parent, child: { publicId: a, nom: 'Ain', referentiel: { publicId: refDept } } },
      )

      const result = await listRelations({})

      expect(result._unsafeUnwrap().items.map((item) => item.enfant.nom)).toEqual([
        'Ain',
        'Bouches-du-Rhône',
        'Cantal',
      ])
    }),
  )

  it(
    "filtre sur le nom de l'enfant, sans tenir compte de la casse",
    integrationTest(async () => {
      const refDept = testReferentielId()
      const [garsonne, autre] = testDeptIds(2)
      const reg = testRegId()
      const parent = { publicId: reg, nom: 'Parent' }
      await fixtures.relation(
        { parent, child: { publicId: garsonne, nom: 'Zzgarsonne', referentiel: { publicId: refDept } } },
        { parent, child: { publicId: autre, nom: 'Zzautre', referentiel: { publicId: refDept } } },
      )

      const result = await listRelations({ recherche: 'ZZGARS' })

      expect(result._unsafeUnwrap().items.map((item) => item.enfant.id)).toEqual([garsonne])
    }),
  )

  it(
    'pagine de façon stable même quand plusieurs enfants portent le même nom',
    integrationTest(async () => {
      const refDept = testReferentielId()
      const [e1, e2, e3] = testDeptIds(3)
      const reg = testRegId()
      const parent = { publicId: reg, nom: 'Parent' }
      await fixtures.relation(
        { parent, child: { publicId: e1, nom: 'Homonyme', referentiel: { publicId: refDept } } },
        { parent, child: { publicId: e2, nom: 'Homonyme', referentiel: { publicId: refDept } } },
        { parent, child: { publicId: e3, nom: 'Homonyme', referentiel: { publicId: refDept } } },
      )

      const premiere = await listRelations({ pageSize: 2 })
      const page1 = premiere._unsafeUnwrap()
      expect(page1.items).toHaveLength(2)
      expect(page1.pagination.hasMore).toBe(true)

      const seconde = await listRelations({ pageSize: 2, cursor: page1.pagination.cursor! })
      const page2 = seconde._unsafeUnwrap()

      const vus = [...page1.items, ...page2.items].map((item) => item.enfant.id)
      expect(new Set(vus).size).toBe(3)
    }),
  )
})
```

- [ ] **Step 6: Lancer le test pour vérifier qu'il échoue**

```bash
pnpm -F @pilote/kpilote-api test src/relation/queries/listRelations.test.ts
```

Attendu : ÉCHEC, le module `@/relation/queries/listRelations` n'existe pas.

Si l'échec porte sur une connexion base refusée, ne pas toucher aux conteneurs : demander à l'utilisateur de vérifier que Docker est démarré.

- [ ] **Step 7: Implémenter la query**

Créer `apps/kpilote-api/src/relation/queries/listRelations.ts` :

```ts
import {
  type ListRelationsQuery,
  type RelationListApiModel,
} from '@pilote/kpilote-shared/relation'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { relationInclude, toRelationApiModel } from '@/relation/utils'

export const listRelations = (
  params: ListRelationsQuery,
): ResultAsync<RelationListApiModel, never> => {
  const where = params.recherche
    ? { child: { nom: { contains: params.recherche, mode: 'insensitive' as const } } }
    : {}

  const fetchPage = db().relation.findMany({
    where,
    // `id` en second critère : le curseur de pagination se positionne dessus,
    // l'ordre doit donc être total même quand deux enfants sont homonymes.
    orderBy: [{ child: { nom: 'asc' } }, { id: 'asc' }],
    include: relationInclude,
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().relation.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toRelationApiModel, params.pageSize),
  )
}
```

- [ ] **Step 8: Lancer le test pour vérifier qu'il passe**

```bash
pnpm -F @pilote/kpilote-api test src/relation/queries/listRelations.test.ts
```

Attendu : 5 tests PASS.

- [ ] **Step 9: Lint**

```bash
pnpm -F @pilote/kpilote-api lint
```

Attendu : aucune erreur.

- [ ] **Step 10: Commit**

```bash
git add packages/kpilote-shared/src/relation.ts packages/kpilote-shared/package.json \
  apps/kpilote-api/tsconfig.json apps/kpilote-api/src/relation
git commit -m "feat(relation): schémas partagés et query de listing des relations"
```

---

## Task 2: Route `GET /relations`

**Files:**
- Create: `apps/kpilote-api/src/relation/routes.ts`
- Modify: `apps/kpilote-api/src/app.ts`
- Test: `apps/kpilote-api/src/relation/routes.test.ts`

**Interfaces:**
- Consumes: `listRelations` (Task 1) ; `relationApiModelSchema`, `listRelationsQuerySchema` (Task 1) ; `createOpenApiHono`, `jsonResponseOk`, `requireAuthentication`, `never`, `createPaginatedApiListSchema`
- Produces: `relationRoutes` (`OpenAPIHono`) depuis `@/relation/routes`, monté sur `/` dans `app.ts`

---

- [ ] **Step 1: Écrire le test qui échoue**

Créer `apps/kpilote-api/src/relation/routes.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { relationRoutes } from '@/relation/routes'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey, testDeptIds, testReferentielId, testRegId } from '@/test/randomIds'

const buildApp = () => buildTestApp(relationRoutes)

describe.concurrent('GET /relations', () => {
  it(
    'retourne les relations avec enfant, parent et référentiels',
    integrationTest(async () => {
      const refDept = testReferentielId()
      const refReg = testReferentielId()
      const [dept] = testDeptIds(1)
      const reg = testRegId()
      const rawKey = testApiKeyRawKey()
      await fixtures.relation({
        parent: { publicId: reg, nom: 'Normandie', referentiel: { publicId: refReg } },
        child: { publicId: dept, nom: 'Orne', referentiel: { publicId: refDept } },
      })
      await fixtures.apiKey({ rawKey })

      const response = await buildApp().request('/relations?recherche=Orne', {
        headers: { Authorization: `Bearer ${rawKey}` },
      })

      expect(response.status).toBe(200)
      const body = (await response.json()) as {
        items: Array<{ enfant: { id: string; referentiel: string }; parent: { id: string } }>
      }
      expect(body.items).toEqual([
        {
          enfant: { id: dept, nom: 'Orne', referentiel: refDept },
          parent: { id: reg, nom: 'Normandie', referentiel: refReg },
        },
      ])
    }),
  )

  it(
    'refuse une requête non authentifiée',
    integrationTest(async () => {
      const response = await buildApp().request('/relations')

      expect(response.status).toBe(401)
    }),
  )
})
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
pnpm -F @pilote/kpilote-api test src/relation/routes.test.ts
```

Attendu : ÉCHEC, `@/relation/routes` n'existe pas.

- [ ] **Step 3: Implémenter la route**

Créer `apps/kpilote-api/src/relation/routes.ts` :

```ts
import { createRoute } from '@hono/zod-openapi'
import { createPaginatedApiListSchema } from '@pilote/kpilote-shared/pagination'
import { listRelationsQuerySchema, relationApiModelSchema } from '@pilote/kpilote-shared/relation'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400 } from '@/framework/openapi/responses'
import { listRelations } from '@/relation/queries/listRelations'

const RelationApiModelSchema = relationApiModelSchema.openapi('RelationApiModel')
const RelationListApiModelSchema =
  createPaginatedApiListSchema(relationApiModelSchema).openapi('RelationListApiModel')

const getRelationsRoute = createRoute({
  method: 'get',
  path: '/relations',
  tags: ['Relation'],
  summary: 'Lister les relations parent/enfant entre individus',
  description:
    "Retourne la liste paginée des relations hiérarchiques entre individus, triée par nom de l'individu enfant. Un individu a au plus un parent : l'enfant identifie donc la relation. Filtre optionnel `recherche` sur le nom de l'enfant. Pagination cursor-based.",
  middleware: [requireAuthentication],
  request: { query: listRelationsQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: RelationListApiModelSchema } },
      description: 'Liste paginée des relations',
    },
    400: erreur400,
  },
})

export const relationRoutes = createOpenApiHono()

relationRoutes.openapi(getRelationsRoute, async (context) => {
  const { recherche, cursor, pageSize } = context.req.valid('query')

  return listRelations({ recherche, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: RelationListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

export { RelationApiModelSchema }
```

- [ ] **Step 4: Enregistrer la route dans l'application**

Dans `apps/kpilote-api/src/app.ts`, ajouter l'import après celui de `referentielRoutes` (ligne 20) :

```ts
import { relationRoutes } from '@/relation/routes'
```

et l'enregistrement après `app.route('/', individuRoutes)` (ligne 47) :

```ts
app.route('/', relationRoutes)
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

```bash
pnpm -F @pilote/kpilote-api test src/relation/routes.test.ts
```

Attendu : 2 tests PASS.

- [ ] **Step 6: Lint**

```bash
pnpm -F @pilote/kpilote-api lint
```

- [ ] **Step 7: Commit**

```bash
git add apps/kpilote-api/src/relation apps/kpilote-api/src/app.ts
git commit -m "feat(relation): endpoint GET /relations"
```

---

## Task 3: Commande `upsertRelationParent`

**Files:**
- Create: `apps/kpilote-api/src/relation/commands/upsertRelationParent.ts`
- Create: `apps/kpilote-api/src/relation/queries/getRelationByEnfant.ts`
- Test: `apps/kpilote-api/src/relation/commands/upsertRelationParent.test.ts`

**Interfaces:**
- Consumes: `db()`, `ensurePrincipal`, `isApiKeyAdmin`, `isOidcUser`, `uuidv7`, `relationInclude`/`toRelationApiModel` (Task 1)
- Produces:
  - `type UpsertRelationParentError = { type: 'AUTO_PARENT' } | { type: 'CYCLE_DETECTE' }`
  - `upsertRelationParent(enfantPublicId: string, body: UpsertRelationBody): ResultAsync<void, UpsertRelationParentError>`
  - `getRelationByEnfant(enfantPublicId: string): ResultAsync<RelationApiModel, never>`

---

- [ ] **Step 1: Écrire le test qui échoue**

Créer `apps/kpilote-api/src/relation/commands/upsertRelationParent.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { upsertRelationParent } from '@/relation/commands/upsertRelationParent'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testRegIds } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const parentsDe = async (publicId: string): Promise<string[]> => {
  const relations = await db().relation.findMany({
    where: { child: { publicId } },
    include: { parent: true },
  })
  return relations.map((relation) => relation.parent.publicId).sort()
}

describe.concurrent('upsertRelationParent', () => {
  it(
    "crée la relation quand l'enfant n'a pas de parent",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.individu({ publicId: dept }, { publicId: reg })

      const result = await runAsAdmin('principal-upsert-creation', () =>
        upsertRelationParent(dept, { parent: reg }),
      )

      expect(result.isOk()).toBe(true)
      expect(await parentsDe(dept)).toEqual([reg])
    }),
  )

  it(
    'remplace le parent existant sans laisser de doublon',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [ancien, nouveau] = testRegIds(2)
      await fixtures.relation({ parent: { publicId: ancien }, child: { publicId: dept } })
      await fixtures.individu({ publicId: nouveau })

      const result = await runAsAdmin('principal-upsert-remplacement', () =>
        upsertRelationParent(dept, { parent: nouveau }),
      )

      expect(result.isOk()).toBe(true)
      expect(await parentsDe(dept)).toEqual([nouveau])
    }),
  )

  it(
    'est idempotent : rejouer la même écriture ne crée pas de seconde relation',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.individu({ publicId: dept }, { publicId: reg })

      await runAsAdmin('principal-upsert-idem', () => upsertRelationParent(dept, { parent: reg }))
      await runAsAdmin('principal-upsert-idem', () => upsertRelationParent(dept, { parent: reg }))

      expect(await parentsDe(dept)).toEqual([reg])
    }),
  )

  it(
    "refuse qu'un individu soit son propre parent",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      await fixtures.individu({ publicId: dept })

      const result = await runAsAdmin('principal-upsert-auto', () =>
        upsertRelationParent(dept, { parent: dept }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'AUTO_PARENT' })
      expect(await parentsDe(dept)).toEqual([])
    }),
  )

  it(
    'refuse un parent qui est un enfant direct de la cible',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.relation({ parent: { publicId: reg }, child: { publicId: dept } })

      const result = await runAsAdmin('principal-upsert-cycle-court', () =>
        upsertRelationParent(reg, { parent: dept }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'CYCLE_DETECTE' })
      expect(await parentsDe(reg)).toEqual([])
    }),
  )

  it(
    'refuse un parent qui est un descendant indirect de la cible',
    integrationTest(async () => {
      const [petitEnfant] = testDeptIds(1)
      const [enfant, racine] = testRegIds(2)
      await fixtures.relation(
        { parent: { publicId: racine }, child: { publicId: enfant } },
        { parent: { publicId: enfant }, child: { publicId: petitEnfant } },
      )

      const result = await runAsAdmin('principal-upsert-cycle-long', () =>
        upsertRelationParent(racine, { parent: petitEnfant }),
      )

      expect(result._unsafeUnwrapErr()).toEqual({ type: 'CYCLE_DETECTE' })
    }),
  )

  it(
    "échoue quand l'individu enfant n'existe pas",
    integrationTest(async () => {
      const [reg] = testRegIds(1)
      await fixtures.individu({ publicId: reg })

      await expect(
        runAsAdmin('principal-upsert-enfant-inconnu', () =>
          upsertRelationParent('DEPT-INEXISTANT', { parent: reg }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "échoue quand l'individu parent n'existe pas",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      await fixtures.individu({ publicId: dept })

      await expect(
        runAsAdmin('principal-upsert-parent-inconnu', () =>
          upsertRelationParent(dept, { parent: 'REG-INEXISTANT' }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "refuse une clé API qui n'est pas ADMIN",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.individu({ publicId: dept }, { publicId: reg })

      await expect(
        runAsContributor('principal-upsert-contributor', () =>
          upsertRelationParent(dept, { parent: reg }),
        ),
      ).rejects.toThrow('Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN')
    }),
  )
})
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
pnpm -F @pilote/kpilote-api test src/relation/commands/upsertRelationParent.test.ts
```

Attendu : ÉCHEC, `@/relation/commands/upsertRelationParent` n'existe pas.

- [ ] **Step 3: Implémenter la commande**

Créer `apps/kpilote-api/src/relation/commands/upsertRelationParent.ts` :

```ts
import { type UpsertRelationBody } from '@pilote/kpilote-shared/relation'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensurePrincipal, isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

export type UpsertRelationParentError = { type: 'AUTO_PARENT' } | { type: 'CYCLE_DETECTE' }

// Remontée des ancêtres du parent visé. Le Set de visités protège des cycles
// déjà présents en base (les seeds historiques ne passaient pas par cette garde).
const estDescendant = async (candidatId: string, ancetreId: string): Promise<boolean> => {
  const visites = new Set<string>([candidatId])
  let courant = [candidatId]

  while (courant.length > 0) {
    if (courant.includes(ancetreId)) return true
    const relations = await db().relation.findMany({
      where: { childId: { in: courant } },
      select: { parentId: true },
    })
    courant = relations.map((relation) => relation.parentId).filter((id) => !visites.has(id))
    for (const id of courant) visites.add(id)
  }

  return false
}

const performUpsert = async (
  enfantPublicId: string,
  body: UpsertRelationBody,
): Promise<Result<void, UpsertRelationParentError>> => {
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN',
  )

  if (enfantPublicId === body.parent) return err({ type: 'AUTO_PARENT' })

  const enfant = await db().individu.findUniqueOrThrow({
    where: { publicId: enfantPublicId },
    select: { id: true },
  })
  const parent = await db().individu.findUniqueOrThrow({
    where: { publicId: body.parent },
    select: { id: true },
  })

  if (await estDescendant(parent.id, enfant.id)) return err({ type: 'CYCLE_DETECTE' })

  await db().relation.deleteMany({ where: { childId: enfant.id } })
  await db().relation.create({
    data: { id: uuidv7(), parentId: parent.id, childId: enfant.id },
  })

  return ok(undefined)
}

export const upsertRelationParent = (
  enfantPublicId: string,
  body: UpsertRelationBody,
): ResultAsync<void, UpsertRelationParentError> =>
  ResultAsync.fromSafePromise(performUpsert(enfantPublicId, body)).andThen((result) => result)
```

- [ ] **Step 4: Implémenter la query de relecture**

Créer `apps/kpilote-api/src/relation/queries/getRelationByEnfant.ts` :

```ts
import { type RelationApiModel } from '@pilote/kpilote-shared/relation'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { relationInclude, toRelationApiModel } from '@/relation/utils'

export const getRelationByEnfant = (
  enfantPublicId: string,
): ResultAsync<RelationApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().relation.findFirstOrThrow({
      where: { child: { publicId: enfantPublicId } },
      include: relationInclude,
    }),
  ).map(toRelationApiModel)
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

```bash
pnpm -F @pilote/kpilote-api test src/relation/commands/upsertRelationParent.test.ts
```

Attendu : 9 tests PASS.

- [ ] **Step 6: Lint**

```bash
pnpm -F @pilote/kpilote-api lint
```

- [ ] **Step 7: Commit**

```bash
git add apps/kpilote-api/src/relation
git commit -m "feat(relation): commande d'upsert du parent avec refus auto-parent et cycle"
```

---

## Task 4: Route `PUT /relations/{id}`

**Files:**
- Modify: `apps/kpilote-api/src/relation/routes.ts`
- Test: `apps/kpilote-api/src/relation/routes.test.ts` (ajout d'un bloc `describe`)

**Interfaces:**
- Consumes: `upsertRelationParent`, `getRelationByEnfant` (Task 3) ; `upsertRelationBodySchema` (Task 1) ; `withTransaction`, `jsonResponseError`, `ErrorApiModelSchema`, `erreur400`, `erreur403`, `erreur404`
- Produces: route `PUT /relations/{id}` sur `relationRoutes`

---

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à la fin de `apps/kpilote-api/src/relation/routes.test.ts` :

```ts
describe.concurrent('PUT /relations/{id}', () => {
  it(
    'crée la relation et retourne le modèle résultant',
    integrationTest(async () => {
      const refDept = testReferentielId()
      const refReg = testReferentielId()
      const [dept] = testDeptIds(1)
      const reg = testRegId()
      const rawKey = testApiKeyRawKey()
      await fixtures.individu(
        { publicId: dept, nom: 'Lozère', referentiel: { publicId: refDept } },
        { publicId: reg, nom: 'Occitanie', referentiel: { publicId: refReg } },
      )
      await fixtures.apiKey({ rawKey, role: 'ADMIN' })

      const response = await buildApp().request(`/relations/${dept}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${rawKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: reg }),
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        enfant: { id: dept, nom: 'Lozère', referentiel: refDept },
        parent: { id: reg, nom: 'Occitanie', referentiel: refReg },
      })
    }),
  )

  it(
    'retourne 400 avec le code AUTO_PARENT quand le parent est la cible',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const rawKey = testApiKeyRawKey()
      await fixtures.individu({ publicId: dept })
      await fixtures.apiKey({ rawKey, role: 'ADMIN' })

      const response = await buildApp().request(`/relations/${dept}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${rawKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: dept }),
      })

      expect(response.status).toBe(400)
      expect((await response.json()) as { code: string }).toMatchObject({ code: 'AUTO_PARENT' })
    }),
  )

  it(
    'retourne 400 avec le code CYCLE_DETECTE quand le parent est un descendant',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const reg = testRegId()
      const rawKey = testApiKeyRawKey()
      await fixtures.relation({ parent: { publicId: reg }, child: { publicId: dept } })
      await fixtures.apiKey({ rawKey, role: 'ADMIN' })

      const response = await buildApp().request(`/relations/${reg}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${rawKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent: dept }),
      })

      expect(response.status).toBe(400)
      expect((await response.json()) as { code: string }).toMatchObject({ code: 'CYCLE_DETECTE' })
    }),
  )
})
```

Ajouter `testRegIds` n'est pas nécessaire ici ; l'import existant `testRegId` suffit.

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
pnpm -F @pilote/kpilote-api test src/relation/routes.test.ts
```

Attendu : ÉCHEC — la route `PUT` n'existe pas, la réponse est un 404 `ROUTE_NOT_FOUND`.

- [ ] **Step 3: Implémenter la route**

Dans `apps/kpilote-api/src/relation/routes.ts`, compléter les imports :

```ts
import { createRoute, z } from '@hono/zod-openapi'
import { createPaginatedApiListSchema } from '@pilote/kpilote-shared/pagination'
import { individuPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import {
  listRelationsQuerySchema,
  relationApiModelSchema,
  upsertRelationBodySchema,
} from '@pilote/kpilote-shared/relation'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema, erreur400, erreur403, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { upsertRelationParent } from '@/relation/commands/upsertRelationParent'
import { getRelationByEnfant } from '@/relation/queries/getRelationByEnfant'
import { listRelations } from '@/relation/queries/listRelations'
```

Ajouter après la déclaration de `getRelationsRoute` :

```ts
const UpsertRelationBodySchema = upsertRelationBodySchema.openapi('UpsertRelationBody')

const detailParamsSchema = z.object({
  id: individuPublicIdSchema,
})

const upsertRelationRoute = createRoute({
  method: 'put',
  path: '/relations/{id}',
  tags: ['Relation', 'Admin'],
  summary: "Définir le parent d'un individu",
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). `id` est l'identifiant public de l'individu **enfant** : un individu a au plus un parent, l'enfant identifie donc la relation. Crée la relation si l'enfant n'en a pas, remplace son parent sinon. Opération idempotente, exécutée dans une transaction. Rejetée si le parent est l'individu lui-même (`AUTO_PARENT`) ou l'un de ses descendants (`CYCLE_DETECTE`).",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertRelationBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: RelationApiModelSchema } },
      description: 'Relation créée ou mise à jour',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})
```

Ajouter le handler après celui de `getRelationsRoute` :

```ts
const MESSAGES_ERREUR: Record<'AUTO_PARENT' | 'CYCLE_DETECTE', string> = {
  AUTO_PARENT: 'Un individu ne peut pas être son propre parent',
  CYCLE_DETECTE: "Le parent choisi est un descendant de l'individu : la hiérarchie formerait un cycle",
}

relationRoutes.openapi(upsertRelationRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  return (
    await withTransaction(async () =>
      upsertRelationParent(id, body).andThen(() => getRelationByEnfant(id)),
    )
  ).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: RelationApiModelSchema,
        status: 200,
      }),
    (error) =>
      jsonResponseError({
        context,
        error: { code: error.type, message: MESSAGES_ERREUR[error.type] },
        schema: ErrorApiModelSchema,
        status: 400,
      }),
  )
})
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

```bash
pnpm -F @pilote/kpilote-api test src/relation/routes.test.ts
```

Attendu : 5 tests PASS.

- [ ] **Step 5: Lint**

```bash
pnpm -F @pilote/kpilote-api lint
```

- [ ] **Step 6: Commit**

```bash
git add apps/kpilote-api/src/relation
git commit -m "feat(relation): endpoint PUT /relations/{id}"
```

---

## Task 5: Suppression `DELETE /relations/{id}`

**Files:**
- Create: `apps/kpilote-api/src/relation/commands/supprimerRelation.ts`
- Modify: `apps/kpilote-api/src/relation/routes.ts`
- Test: `apps/kpilote-api/src/relation/commands/supprimerRelation.test.ts`

**Interfaces:**
- Consumes: `db()`, `ensurePrincipal`, `isApiKeyAdmin`, `isOidcUser`
- Produces: `supprimerRelation(enfantPublicId: string): ResultAsync<void, never>` ; route `DELETE /relations/{id}`

Suppression **idempotente** : `204` même si l'individu n'a pas de parent, conformément à la convention du repo (`objectifIndicateurIndividu`, `valeurAvancement`).

---

- [ ] **Step 1: Écrire le test qui échoue**

Créer `apps/kpilote-api/src/relation/commands/supprimerRelation.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { db } from '@/framework/persistence/dbStore'
import { supprimerRelation } from '@/relation/commands/supprimerRelation'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testRegIds } from '@/test/randomIds'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const compteRelations = (publicId: string) =>
  db().relation.count({ where: { child: { publicId } } })

describe.concurrent('supprimerRelation', () => {
  it(
    "supprime la relation de l'individu",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.relation({ parent: { publicId: reg }, child: { publicId: dept } })

      const result = await runAsAdmin('principal-delete-ok', () => supprimerRelation(dept))

      expect(result.isOk()).toBe(true)
      expect(await compteRelations(dept)).toBe(0)
    }),
  )

  it(
    "réussit sans rien faire quand l'individu n'a pas de parent",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      await fixtures.individu({ publicId: dept })

      const result = await runAsAdmin('principal-delete-idem', () => supprimerRelation(dept))

      expect(result.isOk()).toBe(true)
      expect(await compteRelations(dept)).toBe(0)
    }),
  )

  it(
    'ne touche pas aux relations des autres individus',
    integrationTest(async () => {
      const [cible, voisin] = testDeptIds(2)
      const [reg] = testRegIds(1)
      await fixtures.relation(
        { parent: { publicId: reg }, child: { publicId: cible } },
        { parent: { publicId: reg }, child: { publicId: voisin } },
      )

      await runAsAdmin('principal-delete-isolation', () => supprimerRelation(cible))

      expect(await compteRelations(voisin)).toBe(1)
    }),
  )

  it(
    "refuse une clé API qui n'est pas ADMIN",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.relation({ parent: { publicId: reg }, child: { publicId: dept } })

      await expect(
        runAsContributor('principal-delete-contributor', () => supprimerRelation(dept)),
      ).rejects.toThrow('Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN')
    }),
  )
})
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
pnpm -F @pilote/kpilote-api test src/relation/commands/supprimerRelation.test.ts
```

Attendu : ÉCHEC, `@/relation/commands/supprimerRelation` n'existe pas.

- [ ] **Step 3: Implémenter la commande**

Créer `apps/kpilote-api/src/relation/commands/supprimerRelation.ts` :

```ts
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin, isOidcUser } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performSuppression = async (enfantPublicId: string): Promise<void> => {
  ensurePrincipal(
    (principal) => isApiKeyAdmin(principal) || isOidcUser(principal),
    'Cette opération requiert un utilisateur OIDC ou une clé API de rôle ADMIN',
  )

  await db().relation.deleteMany({ where: { child: { publicId: enfantPublicId } } })
}

export const supprimerRelation = (enfantPublicId: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performSuppression(enfantPublicId))
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

```bash
pnpm -F @pilote/kpilote-api test src/relation/commands/supprimerRelation.test.ts
```

Attendu : 4 tests PASS.

- [ ] **Step 5: Ajouter la route**

Dans `apps/kpilote-api/src/relation/routes.ts`, ajouter la déclaration après `upsertRelationRoute` :

```ts
const supprimerRelationRoute = createRoute({
  method: 'delete',
  path: '/relations/{id}',
  tags: ['Relation', 'Admin'],
  summary: "Supprimer le parent d'un individu",
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). `id` est l'identifiant public de l'individu **enfant**. Idempotent : retourne `204` même si l'individu n'avait pas de parent.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    204: { description: 'Relation supprimée' },
    403: erreur403,
  },
})
```

et le handler à la fin du fichier :

```ts
relationRoutes.openapi(supprimerRelationRoute, async (context) => {
  const { id } = context.req.valid('param')

  return (await supprimerRelation(id)).match(() => context.body(null, 204), never)
})
```

Compléter l'import :

```ts
import { supprimerRelation } from '@/relation/commands/supprimerRelation'
```

- [ ] **Step 6: Ajouter le test de route**

Ajouter à la fin de `apps/kpilote-api/src/relation/routes.test.ts` :

```ts
describe.concurrent('DELETE /relations/{id}', () => {
  it(
    'supprime la relation et retourne 204',
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const reg = testRegId()
      const rawKey = testApiKeyRawKey()
      await fixtures.relation({ parent: { publicId: reg }, child: { publicId: dept } })
      await fixtures.apiKey({ rawKey, role: 'ADMIN' })

      const response = await buildApp().request(`/relations/${dept}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${rawKey}` },
      })

      expect(response.status).toBe(204)
    }),
  )

  it(
    "retourne 204 même si l'individu n'avait pas de parent",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const rawKey = testApiKeyRawKey()
      await fixtures.individu({ publicId: dept })
      await fixtures.apiKey({ rawKey, role: 'ADMIN' })

      const response = await buildApp().request(`/relations/${dept}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${rawKey}` },
      })

      expect(response.status).toBe(204)
    }),
  )
})
```

- [ ] **Step 7: Lancer toute la suite du module**

```bash
pnpm -F @pilote/kpilote-api test src/relation
```

Attendu : tous les tests du module PASS.

- [ ] **Step 8: Lint**

```bash
pnpm -F @pilote/kpilote-api lint
```

- [ ] **Step 9: Commit**

```bash
git add apps/kpilote-api/src/relation
git commit -m "feat(relation): endpoint DELETE /relations/{id}"
```

---

## Task 6: Endpoint `GET /individus`

**Files:**
- Modify: `packages/kpilote-shared/src/individu.ts`
- Create: `apps/kpilote-api/src/individu/queries/listIndividus.ts`
- Modify: `apps/kpilote-api/src/individu/routes.ts`
- Test: `apps/kpilote-api/src/individu/queries/listIndividus.test.ts`

**Interfaces:**
- Consumes: `individuInclude`, `toIndividuApiModel` (`@/individu/utils`, existants) ; `buildPaginationArgs`, `toPaginatedResponse`
- Produces: `listIndividusQuerySchema` depuis `@pilote/kpilote-shared/individu` ; `listIndividus(params: ListQuery): ResultAsync<IndividuListApiModel, never>` ; route `GET /individus`

---

- [ ] **Step 1: Ajouter le schéma de query partagé**

Dans `packages/kpilote-shared/src/individu.ts`, ajouter à la fin du fichier :

```ts
export const listIndividusQuerySchema = listQuerySchema
export type ListIndividusQuery = z.infer<typeof listIndividusQuerySchema>
```

- [ ] **Step 2: Écrire le test qui échoue**

Créer `apps/kpilote-api/src/individu/queries/listIndividus.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { listIndividus } from '@/individu/queries/listIndividus'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptIds, testReferentielId, testRegIds } from '@/test/randomIds'

describe.concurrent('listIndividus', () => {
  it(
    'trie les individus par nom croissant, tous référentiels confondus',
    integrationTest(async () => {
      const refA = testReferentielId()
      const refB = testReferentielId()
      const [d1, d2] = testDeptIds(2)
      const [r1] = testRegIds(1)
      await fixtures.individu(
        { publicId: d2, nom: 'Zzbeta', referentiel: { publicId: refA } },
        { publicId: r1, nom: 'Zzgamma', referentiel: { publicId: refB } },
        { publicId: d1, nom: 'Zzalpha', referentiel: { publicId: refA } },
      )

      const result = await listIndividus({ recherche: 'Zz' })

      expect(result._unsafeUnwrap().items.map((individu) => individu.nom)).toEqual([
        'Zzalpha',
        'Zzbeta',
        'Zzgamma',
      ])
    }),
  )

  it(
    "expose les parents de chaque individu, ce qui permet de distinguer les individus déjà rattachés",
    integrationTest(async () => {
      const [dept] = testDeptIds(1)
      const [reg] = testRegIds(1)
      await fixtures.relation({
        parent: { publicId: reg, nom: 'Zzparent' },
        child: { publicId: dept, nom: 'Zzenfant' },
      })

      const result = await listIndividus({ recherche: 'Zzenfant' })

      expect(result._unsafeUnwrap().items[0]?.parents).toEqual([reg])
    }),
  )

  it(
    'pagine les résultats',
    integrationTest(async () => {
      const ref = testReferentielId()
      const [i1, i2, i3] = testDeptIds(3)
      await fixtures.individu(
        { publicId: i1, nom: 'Zzpage0', referentiel: { publicId: ref } },
        { publicId: i2, nom: 'Zzpage1', referentiel: { publicId: ref } },
        { publicId: i3, nom: 'Zzpage2', referentiel: { publicId: ref } },
      )

      const premiere = await listIndividus({ recherche: 'Zzpage', pageSize: 2 })
      const page1 = premiere._unsafeUnwrap()

      expect(page1.items).toHaveLength(2)
      expect(page1.pagination.hasMore).toBe(true)
      expect(page1.total).toBe(3)
    }),
  )
})
```

- [ ] **Step 3: Lancer le test pour vérifier qu'il échoue**

```bash
pnpm -F @pilote/kpilote-api test src/individu/queries/listIndividus.test.ts
```

Attendu : ÉCHEC, `@/individu/queries/listIndividus` n'existe pas.

- [ ] **Step 4: Implémenter la query**

Créer `apps/kpilote-api/src/individu/queries/listIndividus.ts` :

```ts
import {
  type IndividuListApiModel,
  type ListIndividusQuery,
} from '@pilote/kpilote-shared/individu'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { individuInclude, toIndividuApiModel } from '@/individu/utils'

export const listIndividus = (
  params: ListIndividusQuery,
): ResultAsync<IndividuListApiModel, never> => {
  const where = params.recherche
    ? { nom: { contains: params.recherche, mode: 'insensitive' as const } }
    : {}

  const fetchPage = db().individu.findMany({
    where,
    // `id` en second critère : le curseur de pagination se positionne dessus,
    // l'ordre doit donc être total même quand deux individus sont homonymes.
    orderBy: [{ nom: 'asc' }, { id: 'asc' }],
    include: individuInclude,
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().individu.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toIndividuApiModel, params.pageSize),
  )
}
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

```bash
pnpm -F @pilote/kpilote-api test src/individu/queries/listIndividus.test.ts
```

Attendu : 3 tests PASS.

- [ ] **Step 6: Ajouter la route**

Dans `apps/kpilote-api/src/individu/routes.ts`, compléter les imports :

```ts
import {
  individuApiModelSchema,
  individuPublicIdSchema,
  listIndividusQuerySchema,
} from '@pilote/kpilote-shared/individu'
import { createPaginatedApiListSchema } from '@pilote/kpilote-shared/pagination'

import { listIndividus } from '@/individu/queries/listIndividus'
import { erreur400 } from '@/framework/openapi/responses'
```

Ajouter la déclaration après `IndividuApiModelSchema` :

```ts
const IndividuListApiModelSchema =
  createPaginatedApiListSchema(individuApiModelSchema).openapi('IndividuListApiModel')

const getIndividusRoute = createRoute({
  method: 'get',
  path: '/individus',
  tags: ['Individu'],
  summary: 'Lister les individus',
  description:
    "Retourne la liste paginée des individus, tous référentiels confondus, triée par nom. Filtre optionnel `recherche` sur le nom. Chaque item inclut `parents`, ce qui permet d'identifier les individus déjà rattachés à un parent. Pagination cursor-based.",
  middleware: [requireAuthentication],
  request: { query: listIndividusQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndividuListApiModelSchema } },
      description: 'Liste paginée des individus',
    },
    400: erreur400,
  },
})
```

`IndividuListApiModel` est déjà enregistré sous ce nom OpenAPI par `referentiel/routes.ts`. Enregistrer le même schéma sous le même nom est sans effet de bord — c'est exactement le même objet Zod source.

Ajouter le handler **avant** celui de `getIndividuByIdRoute` (une route littérale doit être déclarée avant la route paramétrée qui pourrait la capturer) :

```ts
individuRoutes.openapi(getIndividusRoute, async (context) => {
  const { recherche, cursor, pageSize } = context.req.valid('query')

  return listIndividus({ recherche, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndividuListApiModelSchema,
        status: 200,
      }),
    never,
  )
})
```

- [ ] **Step 7: Lancer toute la suite `individu` + `relation`**

```bash
pnpm -F @pilote/kpilote-api test src/individu src/relation
```

Attendu : tous PASS.

- [ ] **Step 8: Lint**

```bash
pnpm -F @pilote/kpilote-api lint
```

- [ ] **Step 9: Commit**

```bash
git add packages/kpilote-shared/src/individu.ts apps/kpilote-api/src/individu
git commit -m "feat(individu): endpoint GET /individus paginé et trié par nom"
```

---

## Task 7: Couche d'accès admin (proxy BFF, api, queries)

**Files:**
- Modify: `apps/kpilote-admin/src/server/api/router.ts`
- Create: `apps/kpilote-admin/src/api/relations.ts`
- Create: `apps/kpilote-admin/src/api/individus.ts`
- Create: `apps/kpilote-admin/src/queries/relations.ts`
- Create: `apps/kpilote-admin/src/queries/individus.ts`

**Interfaces:**
- Consumes: `bffClient` (`@/api/client`), `fetchAllPages` (`@/lib/fetchAllPages`), schémas de Task 1 et Task 6
- Produces:
  - `fetchRelations(params)`, `upsertRelationParent(id, body)`, `supprimerRelation(id)` depuis `@/api/relations`
  - `fetchAllIndividus()` depuis `@/api/individus`
  - `relationsInfiniteQueryOptions(recherche: string)` depuis `@/queries/relations`
  - `individusAllQueryOptions()` depuis `@/queries/individus`

Pas de test : la consigne du projet exclut les tests front.

---

- [ ] **Step 1: Autoriser la ressource dans le proxy BFF**

Dans `apps/kpilote-admin/src/server/api/router.ts`, ajouter `relations` à l'allowlist (ligne 10) :

```ts
const SAFE_PATH =
  /^(indicateurs|referentiels|individus|relations|api-keys|utilisateurs|collections|permissions|features|centre-aide)(\/[A-Za-z0-9_-]+)*$/
```

Sans cet ajout, tout appel `/api/relations…` est rejeté en `403` par le proxy avant même d'atteindre l'API.

- [ ] **Step 2: Écrire la couche HTTP relations**

Créer `apps/kpilote-admin/src/api/relations.ts` :

```ts
import type {
  RelationApiModel,
  RelationListApiModel,
  UpsertRelationBody,
} from '@pilote/kpilote-shared/relation'
import {
  relationApiModelSchema,
  relationListApiModelSchema,
} from '@pilote/kpilote-shared/relation'

import { bffClient } from '@/api/client'

export const fetchRelations = async (
  params: { recherche?: string | undefined; cursor?: string | undefined } = {},
): Promise<RelationListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('relations', { searchParams }).json()
  return relationListApiModelSchema.parse(json)
}

export const upsertRelationParent = async (
  id: string,
  body: UpsertRelationBody,
): Promise<RelationApiModel> => {
  const json = await bffClient.put(`relations/${id}`, { json: body }).json()
  return relationApiModelSchema.parse(json)
}

export const supprimerRelation = async (id: string): Promise<void> => {
  await bffClient.delete(`relations/${id}`)
}
```

`supprimerRelation` n'appelle pas `.json()` : la réponse est un `204` sans corps.

- [ ] **Step 3: Écrire la couche HTTP individus**

Créer `apps/kpilote-admin/src/api/individus.ts` :

```ts
import type { IndividuApiModel, IndividuListApiModel } from '@pilote/kpilote-shared/individu'
import { individuListApiModelSchema } from '@pilote/kpilote-shared/individu'

import { bffClient } from '@/api/client'
import { fetchAllPages } from '@/lib/fetchAllPages'

export const fetchIndividus = async (
  params: { cursor?: string | undefined } = {},
): Promise<IndividuListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('individus', { searchParams }).json()
  return individuListApiModelSchema.parse(json)
}

export const fetchAllIndividus = (): Promise<IndividuApiModel[]> =>
  fetchAllPages((cursor) => fetchIndividus(cursor ? { cursor } : {}))
```

- [ ] **Step 4: Écrire les query options**

Créer `apps/kpilote-admin/src/queries/relations.ts` :

```ts
import { infiniteQueryOptions } from '@tanstack/react-query'

import { fetchRelations } from '@/api/relations'

export const relationsInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['relations', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchRelations({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })
```

Créer `apps/kpilote-admin/src/queries/individus.ts` :

```ts
import { queryOptions } from '@tanstack/react-query'

import { fetchAllIndividus } from '@/api/individus'

export const individusAllQueryOptions = () =>
  queryOptions({
    queryKey: ['individus', 'all'],
    queryFn: () => fetchAllIndividus(),
  })
```

- [ ] **Step 5: Vérifier la compilation**

```bash
pnpm -F @pilote/kpilote-admin lint
```

Attendu : aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add apps/kpilote-admin/src/server/api/router.ts apps/kpilote-admin/src/api/relations.ts \
  apps/kpilote-admin/src/api/individus.ts apps/kpilote-admin/src/queries/relations.ts \
  apps/kpilote-admin/src/queries/individus.ts
git commit -m "feat(admin): couche d'accès aux relations et aux individus"
```

---

## Task 8: Composant `IndividuPicker`

**Files:**
- Create: `apps/kpilote-admin/src/components/relations/IndividuPicker.tsx`

**Interfaces:**
- Consumes: `individusAllQueryOptions` (Task 7) ; `Picker`, `PickerOptionNomId` (`@pilote/kpilote-ui`)
- Produces:

```ts
export function IndividuPicker(props: {
  excludedIds: string[]
  onSelect: (id: string) => void
  value?: string
  disabled?: boolean
  placeholder?: string
  filtre?: (individu: IndividuApiModel) => boolean
}): React.JSX.Element
```

Le même composant sert de contrôle d'ajout (`filtre` = sans parent, pas de `value`, le trigger réaffiche son placeholder) et de cellule parent (`value` = public ID du parent courant).

---

- [ ] **Step 1: Écrire le composant**

Créer `apps/kpilote-admin/src/components/relations/IndividuPicker.tsx` :

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import type { IndividuApiModel } from '@pilote/kpilote-shared/individu'

import { Picker } from '@pilote/kpilote-ui/Picker'
import { PickerOptionNomId } from '@pilote/kpilote-ui/PickerOptionNomId'
import { individusAllQueryOptions } from '@/queries/individus'

export function IndividuPicker({
  excludedIds,
  onSelect,
  value,
  disabled,
  placeholder = 'Choisir un individu',
  filtre,
}: {
  excludedIds: string[]
  onSelect: (id: string) => void
  value?: string
  disabled?: boolean
  placeholder?: string
  filtre?: (individu: IndividuApiModel) => boolean
}) {
  const { data } = useSuspenseQuery(individusAllQueryOptions())
  const excluded = new Set(excludedIds)
  const items = data
    .filter((individu) => !excluded.has(individu.id))
    .filter((individu) => (filtre ? filtre(individu) : true))

  return (
    <Picker
      items={items}
      onSelect={(individu) => onSelect(individu.id)}
      getKey={(individu) => individu.id}
      getSearchText={(individu) => `${individu.id} ${individu.nom} ${individu.referentiel}`}
      renderItem={(individu) => <PickerOptionNomId nom={individu.nom} id={individu.id} />}
      triggerLabel={placeholder}
      searchPlaceholder="Rechercher un individu…"
      emptyLabel="Aucun individu."
      disabled={disabled ?? false}
      {...(value !== undefined ? { value } : {})}
    />
  )
}
```

`value` est passé conditionnellement : `exactOptionalPropertyTypes` est activé, transmettre `value={undefined}` ne compile pas.

- [ ] **Step 2: Vérifier la compilation**

```bash
pnpm -F @pilote/kpilote-admin lint
```

Le composant n'est pas encore utilisé ; ESLint ne signale pas les exports inutilisés, la vérification porte sur les types.

- [ ] **Step 3: Commit**

```bash
git add apps/kpilote-admin/src/components/relations/IndividuPicker.tsx
git commit -m "feat(admin): picker d'individus réutilisable pour les relations"
```

---

## Task 9: Écran `/relations`

**Files:**
- Create: `apps/kpilote-admin/src/routes/_authed/relations/index.tsx`
- Modify: `apps/kpilote-admin/src/routes/_authed/fonctionnalites.tsx`
- Généré: `apps/kpilote-admin/src/routeTree.gen.ts` (via `tsr generate`, inclus dans `lint`)

**Interfaces:**
- Consumes: `relationsInfiniteQueryOptions` (Task 7), `individusAllQueryOptions` (Task 7), `IndividuPicker` (Task 8), `upsertRelationParent`/`supprimerRelation` (Task 7), `useProdEditUnlock`, `extractApiError`, `useToast`, `Breadcrumb`, `PageHeading`, `Table`, `Button`, `EmptyState`

---

- [ ] **Step 1: Écrire l'écran**

Créer `apps/kpilote-admin/src/routes/_authed/relations/index.tsx` :

```tsx
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { supprimerRelation, upsertRelationParent } from '@/api/relations'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { IndividuPicker } from '@/components/relations/IndividuPicker'
import { useAppConfig } from '@/context/AppConfigContext'
import { extractApiError } from '@/lib/apiError'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { individusAllQueryOptions } from '@/queries/individus'
import { relationsInfiniteQueryOptions } from '@/queries/relations'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Table } from '@pilote/kpilote-ui/Table'
import { useToast } from '@pilote/kpilote-ui/Toast'

export const Route = createFileRoute('/_authed/relations/')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(individusAllQueryOptions())
  },
  component: RelationsComponent,
})

type LigneEnAttente = { id: string; nom: string; referentiel: string }

function RelationsComponent() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isProd, environment } = useAppConfig()
  const { locked, unlock } = useProdEditUnlock()
  const [recherche, setRecherche] = useState('')
  const [enAttente, setEnAttente] = useState<LigneEnAttente[]>([])

  const query = useInfiniteQuery(relationsInfiniteQueryOptions(recherche))
  const { data: individus } = useSuspenseQuery(individusAllQueryOptions())

  const relations = query.data?.pages.flatMap((page) => page.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  const invalider = async () => {
    await queryClient.invalidateQueries({ queryKey: ['relations'] })
    await queryClient.invalidateQueries({ queryKey: ['individus'] })
  }

  const upsert = useMutation({
    mutationFn: ({ enfant, parent }: { enfant: string; parent: string }) =>
      upsertRelationParent(enfant, { parent }),
    onSuccess: async (_data, variables) => {
      setEnAttente((lignes) => lignes.filter((ligne) => ligne.id !== variables.enfant))
      await invalider()
      toast({ title: 'Relation enregistrée.' })
    },
    onError: (error: unknown) => {
      toast({ title: extractApiError(error), variant: 'error' })
    },
  })

  const suppression = useMutation({
    mutationFn: (enfant: string) => supprimerRelation(enfant),
    onSuccess: async () => {
      await invalider()
      toast({ title: 'Relation supprimée.' })
    },
    onError: (error: unknown) => {
      toast({ title: extractApiError(error), variant: 'error' })
    },
  })

  const idsEnAttente = enAttente.map((ligne) => ligne.id)
  const idsDejaRattaches = relations.map((relation) => relation.enfant.id)

  const ajouterLigne = (id: string) => {
    const individu = individus.find((candidat) => candidat.id === id)
    if (!individu) return
    setEnAttente((lignes) => [
      { id: individu.id, nom: individu.nom, referentiel: individu.referentiel },
      ...lignes,
    ])
  }

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Relations</span>
      </Breadcrumb>
      <PageHeading
        title="Relations"
        subtitle={
          <>
            {total} relation{total > 1 ? 's' : ''} · environnement{' '}
            <b className={isProd ? 'text-red-marianne' : undefined}>{environment}</b>
          </>
        }
      />

      {locked ? (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-red-marianne/30 bg-surface px-4 py-3">
          <p className="text-sm text-text">
            Environnement de production : l’édition des relations est verrouillée.
          </p>
          <Button variant="secondary" type="button" onClick={unlock}>
            Déverrouiller
          </Button>
        </div>
      ) : null}

      <div className="mb-6 max-w-md">
        <p className="mb-1.5 text-xs font-semibold text-text">Ajouter une relation</p>
        <IndividuPicker
          excludedIds={[...idsDejaRattaches, ...idsEnAttente]}
          filtre={(individu) => individu.parents.length === 0}
          onSelect={ajouterLigne}
          placeholder="Rechercher un individu…"
          disabled={locked}
        />
      </div>

      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <Search className="size-4 text-text-subtle" />
        <input
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Filtrer par nom d’individu…"
          className="w-full bg-transparent focus:outline-none"
        />
      </div>

      {relations.length === 0 && enAttente.length === 0 && !query.isLoading ? (
        <EmptyState
          title="Aucune relation"
          description="Ajoutez un individu ci-dessus pour lui définir un parent."
        />
      ) : (
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Individu</Table.HeaderCell>
              <Table.HeaderCell>Référentiel</Table.HeaderCell>
              <Table.HeaderCell>Parent</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {enAttente.map((ligne) => (
              <Table.Row key={`attente-${ligne.id}`} className="bg-surface-tinted">
                <Table.Cell>
                  <span className="font-semibold">{ligne.nom}</span>{' '}
                  <span className="font-mono text-xs text-text-muted">{ligne.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-xs text-text-muted">{ligne.referentiel}</span>
                </Table.Cell>
                <Table.Cell>
                  <IndividuPicker
                    excludedIds={[ligne.id]}
                    onSelect={(parent) => upsert.mutate({ enfant: ligne.id, parent })}
                    placeholder="Parent à choisir"
                    disabled={locked || upsert.isPending}
                  />
                </Table.Cell>
                <Table.Cell align="right">
                  <button
                    type="button"
                    aria-label="Retirer la ligne"
                    onClick={() =>
                      setEnAttente((lignes) => lignes.filter((autre) => autre.id !== ligne.id))
                    }
                    className="text-text-muted hover:text-red-marianne"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Table.Cell>
              </Table.Row>
            ))}
            {relations.map((relation) => (
              <Table.Row key={relation.enfant.id}>
                <Table.Cell>
                  <span className="font-semibold">{relation.enfant.nom}</span>{' '}
                  <span className="font-mono text-xs text-text-muted">{relation.enfant.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-xs text-text-muted">
                    {relation.enfant.referentiel}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <IndividuPicker
                    excludedIds={[relation.enfant.id]}
                    value={relation.parent.id}
                    onSelect={(parent) =>
                      upsert.mutate({ enfant: relation.enfant.id, parent })
                    }
                    disabled={locked || upsert.isPending}
                  />
                </Table.Cell>
                <Table.Cell align="right">
                  <button
                    type="button"
                    aria-label={`Supprimer la relation de ${relation.enfant.nom}`}
                    disabled={locked || suppression.isPending}
                    onClick={() => suppression.mutate(relation.enfant.id)}
                    className="text-text-muted hover:text-red-marianne disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {query.hasNextPage ? (
        <div className="mt-4 flex justify-center">
          <Button
            variant="secondary"
            type="button"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? 'Chargement…' : 'Charger plus'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
```

`Table.Row` accepte `className` (`packages/kpilote-ui/src/Table.tsx:31` : `ComponentProps<'tr'>` fusionné via `clsxm`), la ligne en attente peut donc porter son fond distinct.

- [ ] **Step 2: Ajouter l'entrée du menu**

Dans `apps/kpilote-admin/src/routes/_authed/fonctionnalites.tsx` :

Ajouter `Network` à l'import `lucide-react` (garder l'ordre alphabétique de la liste existante : `BarChart3, FolderTree, KeyRound, LifeBuoy, Network, Terminal, ToggleLeft, Users`).

Ajouter la carte après celle des référentiels (`delayMs={120}`), et décaler les délais suivants de 60 ms :

```tsx
        <FadeIn delayMs={180}>
          <BarCard
            icon={Network}
            title="Gérer les relations"
            description="Définir le parent de chaque individu dans la hiérarchie des référentiels."
            onClick={() => void navigate({ to: '/relations' })}
          />
        </FadeIn>
```

Les `FadeIn` suivants passent respectivement à `240`, `300`, `360`, `420`, `480`.

- [ ] **Step 3: Régénérer l'arbre de routes et vérifier**

```bash
pnpm -F @pilote/kpilote-admin lint
```

`lint` lance `tsr generate` en premier : `routeTree.gen.ts` intègre la nouvelle route et `navigate({ to: '/relations' })` devient typé.

Attendu : aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add apps/kpilote-admin/src/routes apps/kpilote-admin/src/routeTree.gen.ts
git commit -m "feat(admin): écran de gestion des relations entre individus"
```

---

## Task 10: Vérification de bout en bout

**Files:** aucun (vérification)

---

- [ ] **Step 1: Lancer toute la suite de tests API**

```bash
pnpm -F @pilote/kpilote-api test
```

Attendu : suite verte. Si la base ne répond pas, demander à l'utilisateur de vérifier que Docker tourne — ne pas manipuler les conteneurs.

- [ ] **Step 2: Lint des deux applications et du package partagé**

```bash
pnpm -F @pilote/kpilote-api lint && \
pnpm -F @pilote/kpilote-admin lint && \
pnpm -F @pilote/kpilote-shared lint
```

Attendu : aucune erreur.

- [ ] **Step 3: Vérifier que le schéma OpenAPI se génère**

```bash
pnpm -F @pilote/kpilote-api test src/framework/openapi
```

Attendu : PASS — confirme que les nouveaux schémas nommés (`RelationApiModel`, `RelationListApiModel`, `UpsertRelationBody`) n'entrent pas en collision.

- [ ] **Step 4: Vérification manuelle par l'utilisateur**

Démarrer l'API et l'admin, puis laisser l'utilisateur valider l'écran lui-même (il teste le front, ce n'est pas piloté depuis ici) :

```bash
pnpm dev:kpilote-api
pnpm -F @pilote/kpilote-admin dev
```

Points à faire vérifier :
1. `/fonctionnalites` affiche la carte « Gérer les relations »
2. Le tableau liste les relations triées par nom d'individu, avec le référentiel des deux côtés
3. Changer un parent enregistre immédiatement et affiche un toast
4. Choisir un descendant comme parent affiche le message de cycle et ne modifie rien
5. Le Picker d'ajout ne propose que des individus sans parent ; la ligne ajoutée n'est persistée qu'après choix du parent
6. La suppression retire la ligne

---

## Self-Review

**Couverture de la spec :**

| Exigence de la spec | Tâche |
|---|---|
| `GET /relations` paginé, trié par nom d'enfant, filtre `recherche` | 1, 2 |
| Référentiel exposé des deux côtés | 1 |
| `PUT /relations/{id}` idempotent, body `{ parent }` | 3, 4 |
| `DELETE /relations/{id}` | 5 |
| `GET /individus` | 6 |
| `400 AUTO_PARENT`, `400 CYCLE_DETECTE` | 3, 4 |
| `403` hors ADMIN/OIDC | 3, 5 |
| Aucune migration | — (contrainte globale) |
| Picker d'ajout inline avec `excludedIds` | 8, 9 |
| Cellule parent en Picker, exclusion de la ligne elle-même | 8, 9 |
| Sauvegarde immédiate par ligne, rollback + toast | 9 |
| Ligne en attente non persistée | 9 |
| Suppression | 9 |
| Verrou prod | 9 |
| `BarCard` dans `/fonctionnalites` | 9 |
| Alias tsconfig `@/relation/*` | 1 |
| Allowlist BFF | 7 |
| Tests API colocalisés, pas de tests front | 1, 3, 5, 6 |

Écart documenté : `DELETE` idempotent `204` au lieu de `404`, aligné sur la convention du repo (section « Écart assumé »).

Ajout non prévu par la spec mais indispensable : l'allowlist `SAFE_PATH` du proxy BFF admin (Task 7, Step 1). Sans elle, tous les appels `/api/relations` renvoient `403`.
