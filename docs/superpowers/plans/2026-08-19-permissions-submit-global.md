# Permissions : brouillon éditable et enregistrement global — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Remplacer l'écriture-à-chaque-clic de l'écran des permissions d'un principal par un brouillon local validé en un seul appel `PUT /permissions`.

**Architecture :** Un nouvel endpoint bulk reçoit l'état désiré complet du principal et le réconcilie en transaction (`deleteMany` + `createMany`). Côté admin, `PrincipalPermissions` devient un formulaire react-hook-form dont les lignes portent uniquement les actions d'écriture ; `READ` est réinjecté à la sérialisation. `MultiToggle` n'est pas modifié : sa signature `value` / `onValueChange` est déjà celle qu'un `Controller` alimente.

**Tech Stack :** Hono + `@hono/zod-openapi`, Prisma, neverthrow, Vitest (tests d'intégration transactionnels) côté API. React 19, TanStack Query + Router, react-hook-form, Tailwind côté admin.

**Spec :** `docs/superpowers/specs/2026-08-19-permissions-submit-global-design.md`

## Global Constraints

- Gestionnaire de paquets : **pnpm** (v10). Jamais `npm`.
- `pnpm lint` doit passer avant chaque commit (`eslint src scripts && tsc --noEmit && prettier --check .` dans `apps/kpilote-api`).
- Messages de commit sans `Co-Authored-By`.
- Nommage kpilote : verbes et termes techniques en anglais, noms d'entités métier en français (`replacePrincipalPermissions`, `indicateurPublicId`).
- **Aucune migration Prisma** : le schéma de base ne change pas. Ne pas lancer `prisma migrate dev`.
- Aucun nouveau dossier sous `apps/kpilote-api/src` : `@/permission/*` est déjà mappé dans le `tsconfig`, rien à ajouter.
- Le paquet `@pilote/kpilote-ui` n'est **pas** modifié par ce plan.
- Pas de tests front.

---

### Task 1 : Commande `replacePrincipalPermissions`

Le cœur du travail. Le schéma partagé et la classe `NotFoundError` sont des prérequis de cette commande, donc livrés avec elle.

**Files:**
- Modify: `packages/kpilote-shared/src/permission.ts` (ajout en fin de fichier)
- Modify: `apps/kpilote-api/src/framework/errors/AppError.ts` (ajout d'une classe)
- Create: `apps/kpilote-api/src/permission/commands/replacePrincipalPermissions.ts`
- Test: `apps/kpilote-api/src/permission/commands/replacePrincipalPermissions.test.ts`

**Interfaces:**
- Consomme : `loadPrincipalPermissions(principalId)`, `ensurePrincipal(isApiKeyAdmin, message)`, `db()`, `PrincipalPermissionsApiModel` — tous existants.
- Produit :
  - `replacePrincipalPermissionsBodySchema` et le type `ReplacePrincipalPermissionsBody` (consommés par les tâches 2 et 3)
  - `replacePrincipalPermissions(body: ReplacePrincipalPermissionsBody): ResultAsync<PrincipalPermissionsApiModel, never>` (consommée par la tâche 2)
  - `NotFoundError` dans `@/framework/errors/AppError`

**Point de conception à respecter impérativement :** toute la validation (doublons, identifiants inconnus, rôle de l'appelant) précède **toute** écriture. Les tests s'exécutent déjà à l'intérieur d'une transaction fournie par `integrationTest`, donc un `deleteMany` suivi d'un `throw` ne serait pas annulé à l'échelle du test. L'ordre validation-puis-écriture est ce qui rend l'assertion « état précédent intact » vraie indépendamment du rollback.

- [ ] **Step 1 : Ajouter le schéma partagé**

Dans `packages/kpilote-shared/src/permission.ts`, à la suite de la section `// --- Requêtes collection ---` :

```ts
// --- Requête de remplacement global ------------------------------------------

const replaceCollectionEntrySchema = z.object({
  publicId: z.string().describe('Identifiant public de la collection (`COL-…`).'),
  actions: z.array(collectionPermissionActionSchema).min(1),
})

const replaceIndicateurEntrySchema = z.object({
  publicId: z.string().describe("Identifiant public de l'indicateur (`IND-…`)."),
  actions: z.array(indicateurPermissionActionSchema).min(1),
})

export const replacePrincipalPermissionsBodySchema = z.object({
  principalId: z.string().uuid().describe('Principal (UUID) dont on remplace les permissions.'),
  collections: z
    .array(replaceCollectionEntrySchema)
    .describe('État désiré. Toute collection absente de la liste voit ses permissions révoquées.'),
  indicateurs: z
    .array(replaceIndicateurEntrySchema)
    .describe("État désiré. Tout indicateur absent de la liste voit ses permissions révoquées."),
})
export type ReplacePrincipalPermissionsBody = z.infer<typeof replacePrincipalPermissionsBodySchema>
```

Aucune contrainte imposant `READ` : accorder `WRITE_DATA` seul est un état valide côté API. C'est une décision explicite, documentée par un test à l'étape 4.

- [ ] **Step 2 : Ajouter `NotFoundError`**

Dans `apps/kpilote-api/src/framework/errors/AppError.ts`, après `ConflictError` :

```ts
export class NotFoundError extends AppError {
  readonly code = 'ENTITY_NOT_FOUND'
  readonly kind = 'not-found' as const
}
```

Le kind `'not-found'` est déjà mappé sur 404 dans `errorHandler.ts` (`KIND_TO_STATUS`), et le code `ENTITY_NOT_FOUND` est celui que la branche Prisma P2025 renvoie déjà : les clients voient un code cohérent quelle que soit l'origine du 404.

- [ ] **Step 3 : Écrire les tests qui échouent**

Créer `apps/kpilote-api/src/permission/commands/replacePrincipalPermissions.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { ForbiddenError, NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { CollectionPermissionAction, IndicateurPermissionAction } from '@/generated/prisma/enums'
import { replacePrincipalPermissions } from '@/permission/commands/replacePrincipalPermissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000b1'

describe.concurrent('replacePrincipalPermissions', () => {
  it(
    'révoque les permissions des ressources absentes du payload',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const garde = await fixtures.indicateur({ nom: 'Gardé' })
      const retire = await fixtures.indicateur({ nom: 'Retiré' })
      await fixtures.indicateurPermission(
        {
          principalId: target.id,
          indicateur: { publicId: garde.publicId },
          action: IndicateurPermissionAction.READ,
        },
        {
          principalId: target.id,
          indicateur: { publicId: retire.publicId },
          action: IndicateurPermissionAction.READ,
        },
      )

      const result = await runAsAdmin(CALLER_ID, () =>
        replacePrincipalPermissions({
          principalId: target.id,
          collections: [],
          indicateurs: [
            { publicId: garde.publicId, actions: [IndicateurPermissionAction.READ] },
          ],
        }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        {
          publicId: garde.publicId,
          nom: 'Gardé',
          actions: [IndicateurPermissionAction.READ],
        },
      ])
    }),
  )

  it(
    'ajoute une ressource et en retire une autre dans le même appel',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const sortant = await fixtures.indicateur({ nom: 'Sortant' })
      const entrant = await fixtures.indicateur({ nom: 'Entrant' })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: sortant.publicId },
        action: IndicateurPermissionAction.READ,
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        replacePrincipalPermissions({
          principalId: target.id,
          collections: [],
          indicateurs: [
            {
              publicId: entrant.publicId,
              actions: [IndicateurPermissionAction.READ, IndicateurPermissionAction.WRITE_DATA],
            },
          ],
        }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        {
          publicId: entrant.publicId,
          nom: 'Entrant',
          actions: [IndicateurPermissionAction.READ, IndicateurPermissionAction.WRITE_DATA],
        },
      ])
    }),
  )

  it(
    'est idempotent : deux appels identiques donnent le même état',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Indic' })
      const body = {
        principalId: target.id,
        collections: [],
        indicateurs: [
          {
            publicId: ind.publicId,
            actions: [IndicateurPermissionAction.READ, IndicateurPermissionAction.WRITE_COMMENT],
          },
        ],
      }

      const premier = await runAsAdmin(CALLER_ID, () => replacePrincipalPermissions(body))
      const second = await runAsAdmin(CALLER_ID, () => replacePrincipalPermissions(body))

      expect(second._unsafeUnwrap()).toEqual(premier._unsafeUnwrap())
    }),
  )

  it(
    'accepte une action d’écriture sans READ',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Sans lecture' })

      const result = await runAsAdmin(CALLER_ID, () =>
        replacePrincipalPermissions({
          principalId: target.id,
          collections: [],
          indicateurs: [
            { publicId: ind.publicId, actions: [IndicateurPermissionAction.WRITE_DATA] },
          ],
        }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        {
          publicId: ind.publicId,
          nom: 'Sans lecture',
          actions: [IndicateurPermissionAction.WRITE_DATA],
        },
      ])
    }),
  )

  it(
    'rejette un publicId inconnu sans toucher à l’état existant',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Existant' })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: ind.publicId },
        action: IndicateurPermissionAction.READ,
      })

      await expect(
        runAsAdmin(CALLER_ID, () =>
          replacePrincipalPermissions({
            principalId: target.id,
            collections: [],
            indicateurs: [{ publicId: 'IND-inexistant', actions: [IndicateurPermissionAction.READ] }],
          }),
        ),
      ).rejects.toBeInstanceOf(NotFoundError)

      const restantes = await db().indicateurPermission.count({
        where: { principalId: target.id },
      })
      expect(restantes).toBe(1)
    }),
  )

  it(
    'rejette une clé non-ADMIN (ForbiddenError)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})

      await expect(
        runAsContributor(CALLER_ID, () =>
          replacePrincipalPermissions({
            principalId: target.id,
            collections: [],
            indicateurs: [],
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'recalcule les indicateurs hérités après remplacement d’une permission collection',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const collection = await fixtures.collection({
        nom: 'Ma collection',
        indicateurs: [{ nom: 'Porté par la collection' }],
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        replacePrincipalPermissions({
          principalId: target.id,
          collections: [
            { publicId: collection.publicId, actions: [CollectionPermissionAction.READ] },
          ],
          indicateurs: [],
        }),
      )

      const model = result._unsafeUnwrap()
      expect(model.collections).toHaveLength(1)
      expect(model.indicateursHerites).toHaveLength(1)
      expect(model.indicateursHerites[0]?.viaCollectionPublicId).toBe(collection.publicId)
    }),
  )
})
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils échouent**

```bash
pnpm --filter @pilote/kpilote-api test -- replacePrincipalPermissions
```

Attendu : ÉCHEC — le module `@/permission/commands/replacePrincipalPermissions` n'existe pas.

- [ ] **Step 5 : Écrire la commande**

Créer `apps/kpilote-api/src/permission/commands/replacePrincipalPermissions.ts` :

```ts
import {
  type PrincipalPermissionsApiModel,
  type ReplacePrincipalPermissionsBody,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { NotFoundError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

type Entree = { publicId: string; actions: string[] }

const ensureAucunDoublon = (entrees: Entree[], libelle: string): void => {
  const publicIds = entrees.map((entree) => entree.publicId)
  if (new Set(publicIds).size !== publicIds.length)
    throw new ValidationError(`Le payload contient plusieurs fois la même ${libelle}`)
}

const indexerParPublicId = (
  entrees: Entree[],
  lignes: { id: string; publicId: string }[],
  libelle: string,
): Map<string, string> => {
  const connus = new Map(lignes.map((ligne) => [ligne.publicId, ligne.id]))
  const manquants = entrees
    .map((entree) => entree.publicId)
    .filter((publicId) => !connus.has(publicId))
  if (manquants.length > 0)
    throw new NotFoundError(`${libelle} introuvable(s) : ${manquants.join(', ')}`)
  return connus
}

const performReplace = async (
  body: ReplacePrincipalPermissionsBody,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })

  // Toute la validation avant la moindre écriture : un payload invalide laisse
  // l'état existant intact, sans dépendre du rollback de la transaction.
  ensureAucunDoublon(body.indicateurs, 'indicateur')
  ensureAucunDoublon(body.collections, 'collection')

  const [lignesIndicateur, lignesCollection] = await Promise.all([
    db().indicateur.findMany({
      where: { publicId: { in: body.indicateurs.map((entree) => entree.publicId) } },
      select: { id: true, publicId: true },
    }),
    db().collection.findMany({
      where: { publicId: { in: body.collections.map((entree) => entree.publicId) } },
      select: { id: true, publicId: true },
    }),
  ])

  const idsIndicateur = indexerParPublicId(body.indicateurs, lignesIndicateur, 'Indicateur')
  const idsCollection = indexerParPublicId(body.collections, lignesCollection, 'Collection')

  await db().indicateurPermission.deleteMany({ where: { principalId: body.principalId } })
  await db().collectionPermission.deleteMany({ where: { principalId: body.principalId } })

  await db().indicateurPermission.createMany({
    data: body.indicateurs.flatMap((entree) =>
      entree.actions.map((action) => ({
        principalId: body.principalId,
        indicateurId: idsIndicateur.get(entree.publicId)!,
        action,
      })),
    ),
    skipDuplicates: true,
  })
  await db().collectionPermission.createMany({
    data: body.collections.flatMap((entree) =>
      entree.actions.map((action) => ({
        principalId: body.principalId,
        collectionId: idsCollection.get(entree.publicId)!,
        action,
      })),
    ),
    skipDuplicates: true,
  })

  return loadPrincipalPermissions(body.principalId)
}

export const replacePrincipalPermissions = (
  body: ReplacePrincipalPermissionsBody,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performReplace(body))
```

`skipDuplicates` couvre le cas d'un payload répétant deux fois la même action pour une ressource, que le schéma zod n'interdit pas.

- [ ] **Step 6 : Lancer les tests pour vérifier qu'ils passent**

```bash
pnpm --filter @pilote/kpilote-api test -- replacePrincipalPermissions
```

Attendu : 7 tests PASS.

- [ ] **Step 7 : Lint puis commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add packages/kpilote-shared/src/permission.ts apps/kpilote-api/src/framework/errors/AppError.ts apps/kpilote-api/src/permission/commands/replacePrincipalPermissions.ts apps/kpilote-api/src/permission/commands/replacePrincipalPermissions.test.ts
git commit -m "feat(permissions): commande de remplacement global des permissions d'un principal"
```

---

### Task 2 : Route `PUT /permissions`

**Files:**
- Modify: `apps/kpilote-api/src/permission/routes.ts`
- Test: `apps/kpilote-api/src/permission/routes.test.ts`

**Interfaces:**
- Consomme : `replacePrincipalPermissions`, `replacePrincipalPermissionsBodySchema` (tâche 1), `withTransaction`, `createOpenApiHono`, `jsonResponseOk`, `succes200`, `erreur400`, `erreur403`, `erreur404`.
- Produit : la route HTTP `PUT /permissions`, consommée par la tâche 3.

- [ ] **Step 1 : Écrire le test qui échoue**

Dans `apps/kpilote-api/src/permission/routes.test.ts`, ajouter `['/permissions', 'put']` au tableau `attendu` :

```ts
    const attendu: Array<[string, string]> = [
      ['/permissions', 'get'],
      ['/permissions', 'put'],
      ['/permissions/indicateur', 'post'],
      ['/permissions/indicateur', 'delete'],
      ['/permissions/collection', 'post'],
      ['/permissions/collection', 'delete'],
    ]
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
pnpm --filter @pilote/kpilote-api test -- routes.test
```

Attendu : ÉCHEC avec `put /permissions manquant`.

- [ ] **Step 3 : Déclarer et câbler la route**

Dans `apps/kpilote-api/src/permission/routes.ts` — ajouter l'import du schéma et de la commande :

```ts
import {
  grantCollectionPermissionBodySchema,
  grantIndicateurPermissionBodySchema,
  listPrincipalPermissionsQuerySchema,
  principalPermissionsApiModelSchema,
  replacePrincipalPermissionsBodySchema,
  revokeCollectionPermissionQuerySchema,
  revokeIndicateurPermissionQuerySchema,
} from '@pilote/kpilote-shared/permission'
```

```ts
import { replacePrincipalPermissions } from '@/permission/commands/replacePrincipalPermissions'
```

Puis, après la déclaration `GrantCollectionPermissionBodySchema` :

```ts
const ReplacePrincipalPermissionsBodySchema = replacePrincipalPermissionsBodySchema.openapi(
  'ReplacePrincipalPermissionsBody',
)
```

Après le bloc `getPermissionsRoute`, déclarer la route :

```ts
// --- PUT /permissions --------------------------------------------------------

const replacePermissionsRoute = createRoute({
  method: 'put',
  path: '/permissions',
  tags: ['Permission', 'Admin'],
  summary: "Remplacer l'ensemble des permissions d'un principal",
  description:
    'Réservé aux clés API de rôle `ADMIN`. Reçoit l’état désiré complet : toute permission directe ' +
    'absente du payload est révoquée. **Idempotent**, appliqué en transaction. Retourne l’état à jour.',
  middleware: [requireAuthentication],
  request: {
    body: {
      content: { 'application/json': { schema: ReplacePrincipalPermissionsBodySchema } },
      required: true,
    },
  },
  responses: {
    200: succes200('Permissions remplacées, état à jour', PrincipalPermissionsApiModelSchema),
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})
```

Enfin, le handler, à placer juste après `permissionRoutes.openapi(getPermissionsRoute, …)` :

```ts
permissionRoutes.openapi(replacePermissionsRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => replacePrincipalPermissions(body))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

```bash
pnpm --filter @pilote/kpilote-api test -- routes.test
```

Attendu : PASS.

- [ ] **Step 5 : Lancer toute la suite API**

```bash
pnpm --filter @pilote/kpilote-api test
```

Attendu : aucune régression sur les routes unitaires existantes.

- [ ] **Step 6 : Lint puis commit**

```bash
pnpm --filter @pilote/kpilote-api lint
git add apps/kpilote-api/src/permission/routes.ts apps/kpilote-api/src/permission/routes.test.ts
git commit -m "feat(permissions): route PUT /permissions pour le remplacement global"
```

---

### Task 3 : Client API et option de query côté admin

**Files:**
- Modify: `apps/kpilote-admin/src/api/permissions.ts`
- Modify: `apps/kpilote-admin/src/queries/permissions.ts`

**Interfaces:**
- Consomme : `replacePrincipalPermissionsBodySchema` / `ReplacePrincipalPermissionsBody` (tâche 1), la route `PUT /permissions` (tâche 2), `bffClient`.
- Produit : `replacePrincipalPermissions(body: ReplacePrincipalPermissionsBody): Promise<PrincipalPermissionsApiModel>`, consommée par la tâche 5.

- [ ] **Step 1 : Ajouter la fonction client**

Dans `apps/kpilote-admin/src/api/permissions.ts`, compléter l'import de types puis ajouter la fonction juste après `fetchPrincipalPermissions` :

```ts
export const replacePrincipalPermissions = async (
  body: ReplacePrincipalPermissionsBody,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.put('permissions', { json: body }).json()
  return principalPermissionsApiModelSchema.parse(json)
}
```

Ajouter `ReplacePrincipalPermissionsBody` à la liste des types importés depuis `@pilote/kpilote-shared/permission` en tête de fichier.

- [ ] **Step 2 : Empêcher le refetch d'écraser le brouillon**

Dans `apps/kpilote-admin/src/queries/permissions.ts` :

```ts
export const principalPermissionsQueryOptions = (principalId: string) =>
  queryOptions({
    queryKey: ['permissions', principalId],
    queryFn: () => fetchPrincipalPermissions(principalId),
    // Le formulaire est propriétaire de l'état après montage : un refetch au
    // retour de focus écraserait silencieusement le brouillon en cours.
    refetchOnWindowFocus: false,
  })
```

- [ ] **Step 3 : Vérifier la compilation**

```bash
pnpm --filter @pilote/kpilote-admin lint
```

Attendu : aucune erreur TypeScript.

- [ ] **Step 4 : Commit**

```bash
git add apps/kpilote-admin/src/api/permissions.ts apps/kpilote-admin/src/queries/permissions.ts
git commit -m "feat(permissions): client PUT /permissions et query sans refetch au focus"
```

---

### Task 4 : L'écran des permissions en formulaire

Une seule tâche : la nouvelle API de `PermissionSection`, l'élargissement d'`IndicateurPicker` et la refonte de `PrincipalPermissions` ne compilent pas séparément. Un commit unique en fin de tâche.

**Files:**
- Modify: `apps/kpilote-admin/src/components/permissions/IndicateurPicker.tsx:9-19`
- Modify: `apps/kpilote-admin/src/components/permissions/PermissionSection.tsx` (réécriture)
- Create: `apps/kpilote-admin/src/components/permissions/modifications.ts`
- Modify: `apps/kpilote-admin/src/components/PrincipalPermissions.tsx` (réécriture de la logique d'état)

**Interfaces:**
- Consomme : `replacePrincipalPermissions` (tâche 3), `principalPermissionsQueryOptions` (tâche 3), `MultiToggle` / `IconButton` / `Button` / `EmptyState` (`@pilote/kpilote-ui`), `useProdEditUnlock`, `useToast`, `extractApiError`, `CollectionSearchModal`.
- Produit : l'écran final. Rien en aval.

**Pourquoi `IndicateurPicker` change :** en mode brouillon, la ligne ajoutée doit afficher un nom sans aller-retour serveur, or `onSelect(publicId)` ne fournit pas le nom. `indicateursAllQueryOptions` expose déjà `{ id, nom }` ; il suffit de propager l'objet. `CollectionSearchModal` passe déjà le `hit` complet (`{ publicId, nom }`), rien à y changer.

- [ ] **Step 1 : Élargir `IndicateurPicker`**

Dans `apps/kpilote-admin/src/components/permissions/IndicateurPicker.tsx`, la signature :

```tsx
export function IndicateurPicker({
  excludedIds,
  onSelect,
  disabled,
}: {
  excludedIds: string[]
  onSelect: (indicateur: { id: string; nom: string }) => void
  disabled?: boolean
}) {
```

et, dans le rendu, l'appel :

```tsx
      onSelect={(indicateur) => onSelect({ id: indicateur.id, nom: indicateur.nom })}
```

- [ ] **Step 2 : Réécrire `PermissionSection`**

Remplacer intégralement `apps/kpilote-admin/src/components/permissions/PermissionSection.tsx` :

```tsx
import { Eye, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form'

import { IconButton } from '@pilote/kpilote-ui/IconButton'
import { MultiToggle } from '@pilote/kpilote-ui/MultiToggle'

export type PermissionRow<TWrite extends string> = {
  publicId: string
  nom: string
  writeActions: TWrite[]
}

export type WriteActionOption<TWrite extends string> = {
  value: TWrite
  label: string
}

type PermissionSectionProps<TValues extends FieldValues, TWrite extends string> = {
  title: string
  control: Control<TValues>
  name: Path<TValues>
  writeActions: readonly WriteActionOption<TWrite>[]
  addControl: (append: (row: PermissionRow<TWrite>) => void, publicIds: string[]) => ReactNode
  disabled: boolean
  nouveauxPublicIds: ReadonlySet<string>
  extraForRow?: (publicId: string) => ReactNode
}

export function PermissionSection<TValues extends FieldValues, TWrite extends string>({
  title,
  control,
  name,
  writeActions,
  addControl,
  disabled,
  nouveauxPublicIds,
  extraForRow,
}: PermissionSectionProps<TValues, TWrite>) {
  const { fields, append, remove } = useFieldArray({ control, name: name as never })
  const rows = fields as unknown as (PermissionRow<TWrite> & { id: string })[]

  return (
    <div className="mb-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      <div className="mb-2">
        {addControl(
          (row) => append(row as never),
          rows.map((row) => row.publicId),
        )}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-text-subtle">
          Aucune permission directe.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((row, index) => (
            <li key={row.id} className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">{row.nom}</span>
                  <span className="font-mono text-xs text-text-muted">{row.publicId}</span>
                </span>
                {nouveauxPublicIds.has(row.publicId) ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    nouveau
                  </span>
                ) : null}
                <span className="flex items-center gap-2.5">
                  <span
                    title="Lecture toujours accordée pour une ressource ajoutée. Utilisez la corbeille pour la retirer."
                    className="flex items-center gap-1 text-xs font-medium text-text-muted"
                  >
                    <Eye className="size-3.5" /> Lecture
                  </span>
                  {writeActions.length > 0 ? (
                    <Controller
                      control={control}
                      name={`${name}.${index}.writeActions` as Path<TValues>}
                      render={({ field }) => (
                        <MultiToggle
                          disabled={disabled}
                          aria-label="Permissions d'écriture"
                          value={field.value as TWrite[]}
                          onValueChange={field.onChange}
                          options={writeActions}
                        />
                      )}
                    />
                  ) : null}
                  <IconButton
                    variant="danger"
                    size="sm"
                    label="Retirer la ressource"
                    disabled={disabled}
                    onClick={() => remove(index)}
                    className="ml-1"
                  >
                    <Trash2 />
                  </IconButton>
                </span>
              </div>
              {extraForRow?.(row.publicId)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

`WriteToggleSpec` disparaît. `addControl` devient une fonction plutôt qu'un `ReactNode` : le contrôle d'ajout a besoin de l'`append` du `useFieldArray` et de la liste courante des `publicId` pour son exclusion, deux choses que seule la section connaît.

- [ ] **Step 3 : Extraire le comptage des modifications**

Créer `apps/kpilote-admin/src/components/permissions/modifications.ts`. Logique pure, isolée du rendu — `formState.dirtyFields` ne convient pas ici : react-hook-form marque tout un tableau comme sale dès que sa longueur change, ce qui donnerait un compteur faux.

```ts
import type { PermissionRow } from '@/components/permissions/PermissionSection'

const memesActions = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

// Compte les lignes retirées, ajoutées, et celles dont les actions d'écriture
// ont changé.
export const compterModifications = <TWrite extends string>(
  initiales: readonly PermissionRow<TWrite>[],
  courantes: readonly PermissionRow<TWrite>[],
): number => {
  const initialesParId = new Map(initiales.map((row) => [row.publicId, row.writeActions]))
  const idsCourants = new Set(courantes.map((row) => row.publicId))

  const retirees = initiales.filter((row) => !idsCourants.has(row.publicId)).length
  const ajouteesOuModifiees = courantes.filter((row) => {
    const precedentes = initialesParId.get(row.publicId)
    return precedentes === undefined || !memesActions(precedentes, row.writeActions)
  }).length

  return retirees + ajouteesOuModifiees
}
```

- [ ] **Step 4 : Définir la forme du formulaire dans `PrincipalPermissions`**

En tête de `apps/kpilote-admin/src/components/PrincipalPermissions.tsx`, sous les imports :

```tsx
type IndicateurRow = PermissionRow<IndicateurPermissionWriteActionValue>
type CollectionRow = PermissionRow<'WRITE_COMMENT'>

type PermissionsFormValues = {
  indicateurs: IndicateurRow[]
  collections: CollectionRow[]
}

const INDICATEUR_WRITE_OPTIONS = [
  { value: IndicateurPermissionAction.WRITE_DATA, label: 'Données' },
  { value: IndicateurPermissionAction.WRITE_COMMENT, label: 'Commentaires' },
] as const

const COLLECTION_WRITE_OPTIONS = [
  { value: CollectionPermissionAction.WRITE_COMMENT, label: 'Commentaires' },
] as const

const toFormValues = (data: PrincipalPermissionsApiModel): PermissionsFormValues => ({
  indicateurs: data.indicateurs.map((indicateur) => ({
    publicId: indicateur.publicId,
    nom: indicateur.nom,
    writeActions: indicateur.actions.filter(
      (action): action is IndicateurPermissionWriteActionValue =>
        action !== IndicateurPermissionAction.READ,
    ),
  })),
  collections: data.collections.map((collection) => ({
    publicId: collection.publicId,
    nom: collection.nom,
    writeActions: collection.actions.filter(
      (action): action is 'WRITE_COMMENT' => action !== CollectionPermissionAction.READ,
    ),
  })),
})

// READ est réinjecté ici, et seulement ici : c'est l'invariant de l'écran
// d'administration, l'API accepte une écriture sans lecture.
const toApiBody = (principalId: string, values: PermissionsFormValues) => ({
  principalId,
  indicateurs: values.indicateurs.map((row) => ({
    publicId: row.publicId,
    actions: [IndicateurPermissionAction.READ, ...row.writeActions],
  })),
  collections: values.collections.map((row) => ({
    publicId: row.publicId,
    actions: [CollectionPermissionAction.READ, ...row.writeActions],
  })),
})
```

- [ ] **Step 5 : Remplacer l'état par le formulaire**

Dans le corps du composant, supprimer les six handlers (`addIndicateur`, `toggleIndicateurWrite`, `removeIndicateur`, `addCollection`, `toggleCollectionWriteComment`, `removeCollection`), le helper `run` et la mutation actuelle. Les remplacer par :

```tsx
  const initialValues = toFormValues(data)
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<PermissionsFormValues>({ defaultValues: initialValues })

  const mutation = useMutation({
    mutationFn: (values: PermissionsFormValues) =>
      replacePrincipalPermissions(toApiBody(principalId, values)),
    onSuccess: (fresh) => {
      queryClient.setQueryData(options.queryKey, fresh)
      reset(toFormValues(fresh))
      toast({ title: 'Permissions mises à jour.' })
    },
    onError: (err: unknown) => toast({ title: extractApiError(err), variant: 'error' }),
  })

  const disabled = mutation.isPending

  const indicateursCourants = useWatch({ control, name: 'indicateurs' }) ?? []
  const collectionsCourantes = useWatch({ control, name: 'collections' }) ?? []

  const initialIndicateurIds = new Set(initialValues.indicateurs.map((row) => row.publicId))
  const initialCollectionIds = new Set(initialValues.collections.map((row) => row.publicId))

  const nouveauxIndicateurs = new Set(
    indicateursCourants
      .map((row) => row.publicId)
      .filter((publicId) => !initialIndicateurIds.has(publicId)),
  )
  const nouvellesCollections = new Set(
    collectionsCourantes
      .map((row) => row.publicId)
      .filter((publicId) => !initialCollectionIds.has(publicId)),
  )

  const nombreModifications =
    compterModifications(initialValues.indicateurs, indicateursCourants) +
    compterModifications(initialValues.collections, collectionsCourantes)
```

`disabled` ne dépend plus de `locked` : on compose son brouillon librement, c'est la validation qui est verrouillée.

- [ ] **Step 6 : Câbler les deux sections**

Remplacer les deux `<PermissionSection …>` existants :

```tsx
      <PermissionSection<PermissionsFormValues, IndicateurPermissionWriteActionValue>
        title="Indicateurs"
        control={control}
        name="indicateurs"
        writeActions={INDICATEUR_WRITE_OPTIONS}
        disabled={disabled}
        nouveauxPublicIds={nouveauxIndicateurs}
        addControl={(append, publicIds) => (
          <IndicateurPicker
            excludedIds={[
              ...publicIds,
              ...data.indicateursHerites.map((herite) => herite.publicId),
            ]}
            onSelect={(indicateur) =>
              append({ publicId: indicateur.id, nom: indicateur.nom, writeActions: [] })
            }
            disabled={disabled}
          />
        )}
      />

      <PermissionSection<PermissionsFormValues, 'WRITE_COMMENT'>
        title="Collections"
        control={control}
        name="collections"
        writeActions={COLLECTION_WRITE_OPTIONS}
        disabled={disabled}
        nouveauxPublicIds={nouvellesCollections}
        extraForRow={renderHeritesForCollection}
        addControl={(append) => (
          <>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={disabled}
              onClick={() => setModal('collection')}
            >
              + Ajouter une collection
            </Button>
            {modal === 'collection' ? (
              <CollectionSearchModal
                excludedPublicIds={collectionsCourantes.map((row) => row.publicId)}
                onSelect={(hit) => {
                  append({ publicId: hit.publicId, nom: hit.nom, writeActions: [] })
                  setModal(null)
                }}
                onClose={() => setModal(null)}
              />
            ) : null}
          </>
        )}
      />
```

La modale remonte dans l'`addControl` des collections parce qu'elle a besoin de l'`append` de la section. Supprimer le bloc `{modal === 'collection' ? … : null}` resté en bas du composant, ainsi que la constante `excludedCollections` devenue inutile ; `excludedIndicateurs` disparaît également, l'exclusion étant désormais calculée depuis les lignes courantes du formulaire.

- [ ] **Step 7 : Envelopper dans un `<form>` et ajouter la barre d'action**

Le contenu de la `<section>` passe dans un formulaire :

```tsx
      <form onSubmit={(event) => void handleSubmit((values) => mutation.mutate(values))(event)}>
```

et, après les deux sections, avant la fermeture :

```tsx
        {isDirty ? (
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
            <span className="text-sm text-text-muted">
              {nombreModifications} modification{nombreModifications > 1 ? 's' : ''} non
              enregistrée{nombreModifications > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={disabled}
                onClick={() => reset(initialValues)}
              >
                Annuler
              </Button>
              <Button size="sm" type="submit" disabled={disabled || locked}>
                {mutation.isPending
                  ? 'Enregistrement…'
                  : isProd
                    ? '🚨 Enregistrer en Prod'
                    : 'Enregistrer'}
              </Button>
            </span>
          </div>
        ) : null}
```

Le bandeau de déverrouillage PROD existant reste inchangé : il explique pourquoi `Enregistrer` est désactivé.

- [ ] **Step 8 : Vérifier la compilation**

```bash
pnpm --filter @pilote/kpilote-admin lint
```

Attendu : aucune erreur.

- [ ] **Step 9 : Vérification manuelle par l'utilisateur**

L'écran se teste à la main (`pnpm --filter @pilote/kpilote-admin dev`, page d'un principal) : basculer des toggles, ajouter et retirer des ressources, vérifier que rien ne part au serveur avant `Enregistrer`, qu'`Annuler` restaure l'état initial, que le badge « nouveau » apparaît sur les lignes ajoutées, que le compteur est juste, et qu'un changement de fenêtre ne réinitialise pas le brouillon.

- [ ] **Step 10 : Commit**

```bash
pnpm --filter @pilote/kpilote-admin lint
git add apps/kpilote-admin/src/components/permissions/IndicateurPicker.tsx apps/kpilote-admin/src/components/permissions/PermissionSection.tsx apps/kpilote-admin/src/components/permissions/modifications.ts apps/kpilote-admin/src/components/PrincipalPermissions.tsx
git commit -m "feat(permissions): brouillon éditable et enregistrement global des permissions"
```

---

## Vérification finale

```bash
pnpm --filter @pilote/kpilote-api test
pnpm --filter @pilote/kpilote-api lint
pnpm --filter @pilote/kpilote-admin lint
```
