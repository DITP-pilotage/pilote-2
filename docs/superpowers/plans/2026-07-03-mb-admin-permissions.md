# Gestion des permissions mb-admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un admin (clé API ADMIN) d'attribuer/révoquer des permissions READ/WRITE sur des paniers et indicateurs à un principal (utilisateur OIDC ou clé API), via une IHM mb-admin par fiche de principal.

**Architecture :** Endpoints CRUD `/permissions` dans `mb-api` (Hono + Prisma, pattern CQRS-lite neverthrow), contrat partagé dans `@pilote/mb-shared`, IHM `mb-admin` (React + TanStack Router/Query) montée en section sur les fiches détail utilisateur et clé API, via un composant panel réutilisable. Le BFF Hono de mb-admin relaie les appels vers mb-api en injectant le Bearer.

**Tech Stack :** TypeScript, Hono + `@hono/zod-openapi`, Prisma (client généré `@/generated/prisma`), neverthrow, Vitest ; React, TanStack Router/Query, ky, react-hook-form, Tailwind, lucide-react.

## Global Constraints

- Nommage : verbes/tech en **anglais**, entités métier en **français** (`grantPermission`, `getPrincipalPermissions`, `resourceType`).
- Package manager : **pnpm** (jamais npm). Lint avant commit : `pnpm lint`.
- Pas de `Co-Authored-By` dans les commits.
- mb-api raisonne en **API pure** (pas de logique BFF/UI).
- Tous les endpoints `/permissions` sont réservés aux clés **ADMIN** : `ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')` en 1ʳᵉ instruction de chaque command/query.
- Middleware `requireAuthentication` obligatoire sur chaque route permissionnée.
- Ressources adressées côté API par `publicId` (`PAN-…` / `IND-…`) ; la FK stocke l'UUID `id`.
- Classes d'erreur disponibles : `ForbiddenError` (403), `ValidationError` (400), `ConflictError` (409). Le « not found » passe par `findUniqueOrThrow` → Prisma `P2025` → 404 (mappé par `errorHandler`).
- Enum Prisma : `PermissionAction ∈ { READ, WRITE }` importé de `@/generated/prisma/enums`.
- Front : pas de plan de tests dédié (convention projet). Helper `clsxm` (pas `cn`). Tailwind + composants `shared`/`ui`, pas de classes `fr-*`.

---

## File Structure

**Backend (`apps/mb-api`, `packages/mb-shared`)**
- Create `packages/mb-shared/src/permission.ts` — contrat partagé (schemas + types).
- Modify `packages/mb-shared/package.json` — entrée `exports` `./permission`.
- Modify `packages/mb-shared/src/mePermissions.ts` — importe `permissionActionSchema` depuis `./permission` (source unique).
- Create `apps/mb-api/src/permission/utils.ts` — `resolveResourceId`.
- Create `apps/mb-api/src/permission/queries/loadPrincipalPermissions.ts` — loader pur (réutilisé par GET + commands).
- Create `apps/mb-api/src/permission/queries/getPrincipalPermissions.ts` — GET gaté ADMIN.
- Create `apps/mb-api/src/permission/commands/grantPermission.ts` — grant idempotent.
- Create `apps/mb-api/src/permission/commands/revokePermission.ts` — revoke.
- Create `apps/mb-api/src/permission/routes.ts` — 3 routes OpenAPI.
- Create `apps/mb-api/src/permission/routes.test.ts` — tests d'intégration.
- Modify `apps/mb-api/src/app.ts` — `app.route('/', permissionRoutes)`.
- Modify `apps/mb-api/src/indicateur/queries/listIndicateurs.ts` — bypass admin.
- Modify `apps/mb-api/src/panier/queries/listPaniers.ts` — bypass admin + filtre `recherche`.
- Modify `packages/mb-shared/src/panier.ts` — `recherche` dans `listPaniersQuerySchema`.
- Create `apps/mb-api/src/apiKey/queries/getApiKeyById.ts` — GET clé par id.
- Modify `apps/mb-api/src/apiKey/routes.ts` — route `GET /api-keys/{id}`.

**Frontend (`apps/mb-admin`)**
- Modify `apps/mb-admin/src/server/api/router.ts` — `SAFE_PATH` : ajout `paniers`, `permissions`.
- Create `apps/mb-admin/src/api/permissions.ts` — fetch/grant/revoke.
- Create `apps/mb-admin/src/api/paniers.ts` — recherche paginée.
- Create `apps/mb-admin/src/queries/permissions.ts` — query options (détail + recherche modale).
- Create `apps/mb-admin/src/lib/useProdEditUnlock.ts` — déverrouillage prod par session.
- Modify `apps/mb-admin/src/session.ts` — purge du flag de déverrouillage au logout.
- Create `apps/mb-admin/src/components/ResourceSearchModal.tsx` — modale de recherche de ressource.
- Create `apps/mb-admin/src/components/PrincipalPermissions.tsx` — panel réutilisable.
- Modify `apps/mb-admin/src/routes/_authed/utilisateurs/$id.tsx` — section Permissions.
- Create `apps/mb-admin/src/api/apiKeys.ts` (modify) — `fetchApiKeyById`.
- Create `apps/mb-admin/src/queries/apiKeys.ts` (modify) — `apiKeyQueryOptions`.
- Create `apps/mb-admin/src/routes/_authed/api-keys/$id.tsx` — fiche détail clé API + section Permissions.

---

## Task 1 : Contrat partagé `permission.ts`

**Files:**
- Create: `packages/mb-shared/src/permission.ts`
- Modify: `packages/mb-shared/package.json`
- Modify: `packages/mb-shared/src/mePermissions.ts:3`

**Interfaces:**
- Produces : `permissionActionSchema`, `permissionResourceTypeSchema`, `principalPermissionsApiModelSchema` + type `PrincipalPermissionsApiModel`, `listPrincipalPermissionsQuerySchema`, `grantPermissionBodySchema` + type `GrantPermissionBody`, `revokePermissionQuerySchema` + type `RevokePermissionQuery`.

- [ ] **Step 1 : Écrire `packages/mb-shared/src/permission.ts`**

```ts
import { z } from 'zod'

export const permissionActionSchema = z.enum(['READ', 'WRITE'])
export type PermissionActionValue = z.infer<typeof permissionActionSchema>

export const permissionResourceTypeSchema = z.enum(['PANIER', 'INDICATEUR'])
export type PermissionResourceType = z.infer<typeof permissionResourceTypeSchema>

const directPermissionSchema = z.object({
  publicId: z.string().describe('Identifiant public de la ressource (`PAN-…` / `IND-…`).'),
  nom: z.string().describe('Nom lisible de la ressource.'),
  actions: z
    .array(permissionActionSchema)
    .min(1)
    .describe('Actions directes accordées, triées `READ` avant `WRITE`.'),
})

const indicateurHeriteSchema = z.object({
  publicId: z.string().describe("Identifiant public de l'indicateur hérité."),
  nom: z.string().describe("Nom lisible de l'indicateur."),
  viaPanierPublicId: z.string().describe('Panier source de la propagation READ.'),
  viaPanierNom: z.string().describe('Nom du panier source.'),
})

export const principalPermissionsApiModelSchema = z.object({
  paniers: z
    .array(directPermissionSchema)
    .describe('Permissions directes sur les paniers, triées par `publicId` ASC.'),
  indicateurs: z
    .array(directPermissionSchema)
    .describe('Permissions directes sur les indicateurs, triées par `publicId` ASC.'),
  indicateursHerites: z
    .array(indicateurHeriteSchema)
    .describe(
      'Indicateurs en READ hérité via un panier (propagation), lecture seule. Exclut ceux ' +
        'déjà présents en direct dans `indicateurs`. Triés par `publicId` ASC.',
    ),
})
export type PrincipalPermissionsApiModel = z.infer<typeof principalPermissionsApiModelSchema>

export const listPrincipalPermissionsQuerySchema = z.object({
  principalId: z.string().uuid().describe('Identifiant (UUID) du principal.'),
})
export type ListPrincipalPermissionsQuery = z.infer<typeof listPrincipalPermissionsQuerySchema>

export const grantPermissionBodySchema = z.object({
  principalId: z.string().uuid().describe('Principal (UUID) à qui accorder le droit.'),
  resourceType: permissionResourceTypeSchema,
  resourcePublicId: z.string().describe('Identifiant public de la ressource (`PAN-…` / `IND-…`).'),
  action: permissionActionSchema,
})
export type GrantPermissionBody = z.infer<typeof grantPermissionBodySchema>

export const revokePermissionQuerySchema = z.object({
  principalId: z.string().uuid(),
  resourceType: permissionResourceTypeSchema,
  resourcePublicId: z.string(),
  action: permissionActionSchema
    .optional()
    .describe('Action à retirer. Si absent, retire toutes les actions de la ressource.'),
})
export type RevokePermissionQuery = z.infer<typeof revokePermissionQuerySchema>
```

- [ ] **Step 2 : Ajouter l'entrée `exports` dans `packages/mb-shared/package.json`**

Ajouter, avant l'accolade fermante de `"exports"` (après le bloc `"./utilisateur"`), en veillant à la virgule de séparation :

```json
    "./permission": {
      "types": "./src/permission.ts",
      "default": "./src/permission.ts"
    }
```

- [ ] **Step 3 : Réutiliser le schema d'action dans `mePermissions.ts`**

Dans `packages/mb-shared/src/mePermissions.ts`, remplacer la déclaration locale (ligne 3 `const permissionActionSchema = z.enum(['READ', 'WRITE'])`) par un import :

```ts
import { permissionActionSchema } from './permission'
```

(supprimer la ligne `const permissionActionSchema = ...` ; le reste du fichier est inchangé.)

- [ ] **Step 4 : Vérifier le typecheck du package partagé**

Run: `pnpm --filter @pilote/mb-shared typecheck`
Expected: succès (aucune erreur). Si le script `typecheck` n'existe pas, `pnpm --filter @pilote/mb-shared exec tsc --noEmit`.

- [ ] **Step 5 : Commit**

```bash
git add packages/mb-shared/src/permission.ts packages/mb-shared/package.json packages/mb-shared/src/mePermissions.ts
git commit -m "feat(mb-shared): contrat partagé permissions (principal ↔ ressource ↔ action)"
```

---

## Task 2 : Loader `loadPrincipalPermissions` + `GET /permissions`

**Files:**
- Create: `apps/mb-api/src/permission/queries/loadPrincipalPermissions.ts`
- Create: `apps/mb-api/src/permission/queries/getPrincipalPermissions.ts`
- Create: `apps/mb-api/src/permission/routes.ts`
- Modify: `apps/mb-api/src/app.ts`
- Test: `apps/mb-api/src/permission/routes.test.ts`

**Interfaces:**
- Consumes : `principalPermissionsApiModelSchema`, `listPrincipalPermissionsQuerySchema` (Task 1).
- Produces : `loadPrincipalPermissions(principalId: string): Promise<PrincipalPermissionsApiModel>` (pur, sans garde), `getPrincipalPermissions(principalId: string): ResultAsync<PrincipalPermissionsApiModel, never>`, `permissionRoutes: OpenAPIHono`.

- [ ] **Step 1 : Écrire le loader `loadPrincipalPermissions.ts`**

```ts
import { type PrincipalPermissionsApiModel } from '@pilote/mb-shared/permission'

import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

const ACTION_ORDER: PermissionAction[] = [PermissionAction.READ, PermissionAction.WRITE]

type DirectEntry = { publicId: string; nom: string; actions: Set<PermissionAction> }

const serializeDirect = (map: Map<string, DirectEntry>) =>
  Array.from(map.values())
    .map((e) => ({
      publicId: e.publicId,
      nom: e.nom,
      actions: ACTION_ORDER.filter((a) => e.actions.has(a)),
    }))
    .sort((a, b) => a.publicId.localeCompare(b.publicId))

// Charge les permissions directes (groupées par ressource) + les indicateurs
// hérités en READ via propagation panier → indicateur (cf. permissions-design.md).
// Pur : aucune garde d'autorisation ici (assurée par l'appelant).
export const loadPrincipalPermissions = async (
  principalId: string,
): Promise<PrincipalPermissionsApiModel> => {
  const [panierPerms, indicateurPerms] = await Promise.all([
    db().panierPermission.findMany({
      where: { principalId },
      include: {
        panier: {
          select: {
            publicId: true,
            nom: true,
            indicateurs: { select: { indicateur: { select: { publicId: true, nom: true } } } },
          },
        },
      },
    }),
    db().indicateurPermission.findMany({
      where: { principalId },
      include: { indicateur: { select: { publicId: true, nom: true } } },
    }),
  ])

  const paniersMap = new Map<string, DirectEntry>()
  for (const p of panierPerms) {
    const entry = paniersMap.get(p.panier.publicId) ?? {
      publicId: p.panier.publicId,
      nom: p.panier.nom,
      actions: new Set<PermissionAction>(),
    }
    entry.actions.add(p.action)
    paniersMap.set(p.panier.publicId, entry)
  }

  const indicateursMap = new Map<string, DirectEntry>()
  for (const i of indicateurPerms) {
    const entry = indicateursMap.get(i.indicateur.publicId) ?? {
      publicId: i.indicateur.publicId,
      nom: i.indicateur.nom,
      actions: new Set<PermissionAction>(),
    }
    entry.actions.add(i.action)
    indicateursMap.set(i.indicateur.publicId, entry)
  }

  const heritesMap = new Map<
    string,
    { publicId: string; nom: string; viaPanierPublicId: string; viaPanierNom: string }
  >()
  for (const p of panierPerms) {
    for (const lien of p.panier.indicateurs) {
      const pubId = lien.indicateur.publicId
      if (indicateursMap.has(pubId) || heritesMap.has(pubId)) continue
      heritesMap.set(pubId, {
        publicId: pubId,
        nom: lien.indicateur.nom,
        viaPanierPublicId: p.panier.publicId,
        viaPanierNom: p.panier.nom,
      })
    }
  }

  return {
    paniers: serializeDirect(paniersMap),
    indicateurs: serializeDirect(indicateursMap),
    indicateursHerites: Array.from(heritesMap.values()).sort((a, b) =>
      a.publicId.localeCompare(b.publicId),
    ),
  }
}
```

- [ ] **Step 2 : Écrire `getPrincipalPermissions.ts`**

```ts
import { type PrincipalPermissionsApiModel } from '@pilote/mb-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performGet = async (principalId: string): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: principalId } }) // 404 si inconnu
  return loadPrincipalPermissions(principalId)
}

export const getPrincipalPermissions = (
  principalId: string,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performGet(principalId))
```

- [ ] **Step 3 : Écrire `routes.ts` (route GET seule pour l'instant)**

```ts
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import {
  listPrincipalPermissionsQuerySchema,
  principalPermissionsApiModelSchema,
} from '@pilote/mb-shared/permission'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur403, erreur404 } from '@/framework/openapi/responses'
import { getPrincipalPermissions } from '@/permission/queries/getPrincipalPermissions'

const PrincipalPermissionsApiModelSchema =
  principalPermissionsApiModelSchema.openapi('PrincipalPermissionsApiModel')

const getPermissionsRoute = createRoute({
  method: 'get',
  path: '/permissions',
  tags: ['Permission', 'Admin'],
  summary: "Lister les permissions d'un principal",
  description:
    'Réservé aux clés API de rôle `ADMIN`. Retourne les permissions directes (paniers + ' +
    'indicateurs) du principal, plus les indicateurs en READ hérités via propagation panier → indicateur.',
  middleware: [requireAuthentication],
  request: { query: listPrincipalPermissionsQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: PrincipalPermissionsApiModelSchema } },
      description: 'Permissions du principal',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

export const permissionRoutes = new OpenAPIHono()

permissionRoutes.openapi(getPermissionsRoute, async (context) => {
  const { principalId } = context.req.valid('query')
  return getPrincipalPermissions(principalId).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})
```

- [ ] **Step 4 : Enregistrer les routes dans `app.ts`**

Dans `apps/mb-api/src/app.ts`, à côté des autres `app.route('/', xxxRoutes)` : ajouter l'import `import { permissionRoutes } from '@/permission/routes'` et la ligne `app.route('/', permissionRoutes)`.

- [ ] **Step 5 : Écrire le test d'intégration (GET) dans `routes.test.ts`**

Suivre la structure de `apps/mb-api/src/utilisateur/routes.test.ts` (helpers `fixtures`, client de test, en-tête Bearer ADMIN vs non-admin). Test minimal :

```ts
import { describe, expect, it } from 'vitest'
// importer le harness de test existant (cf. utilisateur/routes.test.ts pour les imports exacts :
// app de test, seeding fixtures, clé ADMIN et clé CONTRIBUTOR)

describe('GET /permissions', () => {
  it('retourne 403 pour une clé non-ADMIN', async () => {
    // seed un principal + une clé CONTRIBUTOR
    // appel GET /permissions?principalId=<uuid> avec Bearer contributor
    // expect status 403
  })

  it('retourne les permissions directes groupées et les indicateurs hérités', async () => {
    // seed : principal P, panier PAN-1 (contient IND-2), grant READ panier PAN-1 à P,
    //        indicateur IND-1 grant WRITE à P
    // appel GET /permissions?principalId=P avec Bearer ADMIN
    // expect 200, body.paniers = [{ publicId:'PAN-1', actions:['READ'] }]
    //        body.indicateurs = [{ publicId:'IND-1', actions:['WRITE'] }]
    //        body.indicateursHerites = [{ publicId:'IND-2', viaPanierPublicId:'PAN-1' }]
  })

  it('retourne 404 si le principal est inconnu', async () => {
    // GET /permissions?principalId=<uuid random> avec Bearer ADMIN → 404
  })
})
```

Remplir les commentaires avec les helpers exacts observés dans `utilisateur/routes.test.ts` et les `fixtures` de seed (`fixtures.panier`, `fixtures.indicateur`, `fixtures.apiKey`, permissions via `prisma/seed` ou insertion directe `db().panierPermission.create`).

- [ ] **Step 6 : Lancer les tests**

Run: `pnpm --filter @pilote/mb-api test -- permission/routes`
Expected: 3 tests PASS.

- [ ] **Step 7 : Lint + commit**

```bash
pnpm --filter @pilote/mb-api lint
git add apps/mb-api/src/permission apps/mb-api/src/app.ts
git commit -m "feat(mb-api): GET /permissions (permissions d'un principal + hérités)"
```

---

## Task 3 : `POST /permissions` (grant idempotent)

**Files:**
- Create: `apps/mb-api/src/permission/utils.ts`
- Create: `apps/mb-api/src/permission/commands/grantPermission.ts`
- Modify: `apps/mb-api/src/permission/routes.ts`
- Modify: `apps/mb-api/src/permission/routes.test.ts`

**Interfaces:**
- Consumes : `grantPermissionBodySchema`, `GrantPermissionBody`, `principalPermissionsApiModelSchema`, `loadPrincipalPermissions`.
- Produces : `resolveResourceId(resourceType, resourcePublicId): Promise<string>`, `grantPermission(body): ResultAsync<PrincipalPermissionsApiModel, never>`.

- [ ] **Step 1 : Écrire `utils.ts` (`resolveResourceId`)**

```ts
import { type PermissionResourceType } from '@pilote/mb-shared/permission'

import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

// Valide la cohérence type ↔ préfixe (`PAN-` / `IND-`) puis résout l'UUID interne.
// findUniqueOrThrow → P2025 → 404 si la ressource est introuvable.
export const resolveResourceId = async (
  resourceType: PermissionResourceType,
  resourcePublicId: string,
): Promise<string> => {
  if (resourceType === 'PANIER') {
    if (!resourcePublicId.startsWith('PAN-')) {
      throw new ValidationError('`resourcePublicId` doit commencer par `PAN-` pour un panier.')
    }
    const panier = await db().panier.findUniqueOrThrow({
      where: { publicId: resourcePublicId },
      select: { id: true },
    })
    return panier.id
  }
  if (!resourcePublicId.startsWith('IND-')) {
    throw new ValidationError('`resourcePublicId` doit commencer par `IND-` pour un indicateur.')
  }
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: resourcePublicId },
    select: { id: true },
  })
  return indicateur.id
}
```

- [ ] **Step 2 : Écrire `grantPermission.ts`**

```ts
import { type GrantPermissionBody, type PrincipalPermissionsApiModel } from '@pilote/mb-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'
import { resolveResourceId } from '@/permission/utils'

const performGrant = async (body: GrantPermissionBody): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })

  const resourceId = await resolveResourceId(body.resourceType, body.resourcePublicId)

  if (body.resourceType === 'PANIER') {
    await db().panierPermission.upsert({
      where: {
        principalId_panierId_action: {
          principalId: body.principalId,
          panierId: resourceId,
          action: body.action,
        },
      },
      create: { principalId: body.principalId, panierId: resourceId, action: body.action },
      update: {},
    })
  } else {
    await db().indicateurPermission.upsert({
      where: {
        principalId_indicateurId_action: {
          principalId: body.principalId,
          indicateurId: resourceId,
          action: body.action,
        },
      },
      create: { principalId: body.principalId, indicateurId: resourceId, action: body.action },
      update: {},
    })
  }

  return loadPrincipalPermissions(body.principalId)
}

export const grantPermission = (
  body: GrantPermissionBody,
): ResultAsync<PrincipalPermissionsApiModel, never> => ResultAsync.fromSafePromise(performGrant(body))
```

- [ ] **Step 3 : Ajouter la route POST dans `routes.ts`**

Ajouter les imports :

```ts
import { grantPermissionBodySchema } from '@pilote/mb-shared/permission'
import { erreur409 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { grantPermission } from '@/permission/commands/grantPermission'
```

(compléter la ligne d'import existante de `@pilote/mb-shared/permission` avec `grantPermissionBodySchema`, et celle de `@/framework/openapi/responses` avec `erreur409`.)

Déclarer le schema + la route :

```ts
const GrantPermissionBodySchema = grantPermissionBodySchema.openapi('GrantPermissionBody')

const grantPermissionRoute = createRoute({
  method: 'post',
  path: '/permissions',
  tags: ['Permission', 'Admin'],
  summary: 'Accorder une permission à un principal',
  description:
    'Réservé aux clés API de rôle `ADMIN`. Accorde une action (`READ`/`WRITE`) sur une ressource ' +
    '(`PANIER`/`INDICATEUR`) à un principal. **Idempotent** : ré-accorder un droit existant renvoie 200 ' +
    'sans doublon. Retourne les permissions à jour du principal.',
  middleware: [requireAuthentication],
  request: {
    body: { content: { 'application/json': { schema: GrantPermissionBodySchema } }, required: true },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: PrincipalPermissionsApiModelSchema } },
      description: 'Permission accordée, état à jour',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
    409: erreur409,
  },
})
```

Enregistrer le handler (après le handler GET) :

```ts
permissionRoutes.openapi(grantPermissionRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => grantPermission(body))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})
```

- [ ] **Step 4 : Ajouter les tests POST dans `routes.test.ts`**

```ts
describe('POST /permissions', () => {
  it('accorde une action et retourne l’état à jour', async () => {
    // seed principal P + indicateur IND-1 (Bearer ADMIN)
    // POST { principalId:P, resourceType:'INDICATEUR', resourcePublicId:'IND-1', action:'READ' }
    // expect 200, body.indicateurs contient { publicId:'IND-1', actions:['READ'] }
  })

  it('est idempotent (deux grants identiques → une seule ligne)', async () => {
    // POST identique ×2 → 200 les deux fois, actions:['READ'] (pas de doublon)
  })

  it('retourne 400 si le préfixe ne correspond pas au resourceType', async () => {
    // POST { resourceType:'PANIER', resourcePublicId:'IND-1', ... } → 400
  })

  it('retourne 404 si la ressource est inconnue', async () => {
    // POST resourcePublicId:'PAN-999' inexistant → 404
  })

  it('retourne 403 pour une clé non-ADMIN', async () => {
    // Bearer contributor → 403
  })
})
```

Remplir avec les helpers de seed exacts.

- [ ] **Step 5 : Lancer les tests**

Run: `pnpm --filter @pilote/mb-api test -- permission/routes`
Expected: tous les tests (GET + POST) PASS.

- [ ] **Step 6 : Lint + commit**

```bash
pnpm --filter @pilote/mb-api lint
git add apps/mb-api/src/permission
git commit -m "feat(mb-api): POST /permissions (grant idempotent)"
```

---

## Task 4 : `DELETE /permissions` (revoke)

**Files:**
- Create: `apps/mb-api/src/permission/commands/revokePermission.ts`
- Modify: `apps/mb-api/src/permission/routes.ts`
- Modify: `apps/mb-api/src/permission/routes.test.ts`

**Interfaces:**
- Consumes : `revokePermissionQuerySchema`, `RevokePermissionQuery`, `resolveResourceId`, `loadPrincipalPermissions`.
- Produces : `revokePermission(query): ResultAsync<PrincipalPermissionsApiModel, never>`.

- [ ] **Step 1 : Écrire `revokePermission.ts`**

```ts
import {
  type PrincipalPermissionsApiModel,
  type RevokePermissionQuery,
} from '@pilote/mb-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'
import { resolveResourceId } from '@/permission/utils'

const performRevoke = async (
  query: RevokePermissionQuery,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: query.principalId } })

  const resourceId = await resolveResourceId(query.resourceType, query.resourcePublicId)

  if (query.resourceType === 'PANIER') {
    await db().panierPermission.deleteMany({
      where: {
        principalId: query.principalId,
        panierId: resourceId,
        ...(query.action ? { action: query.action } : {}),
      },
    })
  } else {
    await db().indicateurPermission.deleteMany({
      where: {
        principalId: query.principalId,
        indicateurId: resourceId,
        ...(query.action ? { action: query.action } : {}),
      },
    })
  }

  return loadPrincipalPermissions(query.principalId)
}

export const revokePermission = (
  query: RevokePermissionQuery,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performRevoke(query))
```

- [ ] **Step 2 : Ajouter la route DELETE dans `routes.ts`**

Compléter l'import de `@pilote/mb-shared/permission` avec `revokePermissionQuerySchema`, ajouter `import { revokePermission } from '@/permission/commands/revokePermission'`, puis :

```ts
const revokePermissionRoute = createRoute({
  method: 'delete',
  path: '/permissions',
  tags: ['Permission', 'Admin'],
  summary: 'Retirer une permission à un principal',
  description:
    'Réservé aux clés API de rôle `ADMIN`. Retire une action précise si `action` est fournie, sinon ' +
    'toutes les actions de la ressource pour ce principal. **Idempotent**. Retourne l’état à jour.',
  middleware: [requireAuthentication],
  request: { query: revokePermissionQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: PrincipalPermissionsApiModelSchema } },
      description: 'Permission retirée, état à jour',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})
```

Handler :

```ts
permissionRoutes.openapi(revokePermissionRoute, async (context) => {
  const query = context.req.valid('query')
  return (await withTransaction(async () => revokePermission(query))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})
```

- [ ] **Step 3 : Ajouter les tests DELETE dans `routes.test.ts`**

```ts
describe('DELETE /permissions', () => {
  it('retire une action précise et garde les autres', async () => {
    // seed P avec IND-1 READ+WRITE
    // DELETE ?principalId=P&resourceType=INDICATEUR&resourcePublicId=IND-1&action=WRITE
    // expect 200, body.indicateurs = [{ publicId:'IND-1', actions:['READ'] }]
  })

  it('retire toutes les actions quand action est omise', async () => {
    // seed P avec IND-1 READ+WRITE
    // DELETE ?principalId=P&resourceType=INDICATEUR&resourcePublicId=IND-1
    // expect 200, body.indicateurs = []
  })

  it('est idempotent (rien à retirer → 200)', async () => {
    // DELETE sur une ressource sans permission → 200, état inchangé
  })

  it('retourne 403 pour une clé non-ADMIN', async () => {
    // Bearer contributor → 403
  })
})
```

- [ ] **Step 4 : Lancer les tests**

Run: `pnpm --filter @pilote/mb-api test -- permission/routes`
Expected: tous PASS (GET + POST + DELETE).

- [ ] **Step 5 : Lint + commit**

```bash
pnpm --filter @pilote/mb-api lint
git add apps/mb-api/src/permission
git commit -m "feat(mb-api): DELETE /permissions (revoke action/ressource)"
```

---

## Task 5 : Bypass admin pour la recherche (indicateurs + paniers)

**Files:**
- Modify: `apps/mb-api/src/indicateur/queries/listIndicateurs.ts`
- Modify: `apps/mb-api/src/panier/queries/listPaniers.ts`
- Modify: `packages/mb-shared/src/panier.ts`
- Modify: `apps/mb-api/src/panier/routes.test.ts` (ou `indicateur/routes.test.ts` selon l'existant)

**Interfaces:**
- Consumes : `isAdminPrincipal` de `@/framework/auth/userContext`.
- Produces : listes non filtrées par visibilité pour un principal ADMIN ; `listPaniersQuerySchema` avec `recherche`.

- [ ] **Step 1 : Ajouter `recherche` à `listPaniersQuerySchema`**

Dans `packages/mb-shared/src/panier.ts`, remplacer :

```ts
export const listPaniersQuerySchema = z.object({
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
```

par :

```ts
export const listPaniersQuerySchema = z.object({
  recherche: z.string().optional().describe('Filtre case-insensitive sur le nom du panier.'),
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
```

- [ ] **Step 2 : Bypass admin dans `listIndicateurs.ts`**

Ajouter l'import `import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'` (fusionner avec l'import existant de `requireCurrentPrincipalId`), puis remplacer la ligne `const where = withIndicateurReadPermission(filters, principalId)` par :

```ts
  const where = isAdminPrincipal() ? filters : withIndicateurReadPermission(filters, principalId)
```

(un principal ADMIN voit toutes les ressources, PUBLIC + PRIVÉ, cohérent avec `isAdminPrincipal` qui court-circuite déjà `/me/permissions`.)

- [ ] **Step 3 : Bypass admin + filtre `recherche` dans `listPaniers.ts`**

Remplacer le corps de `listPaniers` par :

```ts
import { type ListPaniersQuery, type PanierListApiModel } from '@pilote/mb-shared/panier'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { buildPaginationArgs, toPaginatedResponse } from '@/framework/persistence/paginate'
import { type Prisma } from '@/generated/prisma/client'
import { withPanierReadPermission } from '@/panier/permissions'
import { toPanierApiModel } from '@/panier/utils'

export const listPaniers = (params: ListPaniersQuery): ResultAsync<PanierListApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  const filters: Prisma.PanierWhereInput = {}
  if (params.recherche) {
    filters.nom = { contains: params.recherche, mode: 'insensitive' }
  }
  const where = isAdminPrincipal() ? filters : withPanierReadPermission(filters, principalId)

  const fetchPage = db().panier.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      indicateurs: {
        orderBy: { createdAt: 'asc' },
        include: { indicateur: { select: { publicId: true } } },
      },
    },
    ...buildPaginationArgs(params.cursor, params.pageSize),
  })
  const fetchTotal = db().panier.count({ where })

  return ResultAsync.fromSafePromise(Promise.all([fetchPage, fetchTotal])).map(([rows, total]) =>
    toPaginatedResponse(rows, total, toPanierApiModel, params.pageSize),
  )
}
```

- [ ] **Step 4 : Câbler `recherche` dans le handler `GET /paniers`**

Dans `apps/mb-api/src/panier/routes.ts`, vérifier que le handler de `getPaniersRoute` lit `recherche`. Localiser le handler `permissionRoutes`… en fait dans `panier/routes.ts` le handler `getPaniersRoute`. S'il fait `const { cursor, pageSize } = context.req.valid('query')`, le remplacer par `const { recherche, cursor, pageSize } = context.req.valid('query')` et passer `recherche` à `listPaniers({ recherche, cursor, pageSize })`. (Le schema Task 5.1 rend `recherche` disponible.)

- [ ] **Step 5 : Test du bypass admin (panier PRIVÉ visible pour ADMIN)**

Ajouter au fichier de test des routes panier (`apps/mb-api/src/panier/routes.test.ts`) :

```ts
it('un principal ADMIN voit les paniers PRIVÉ sans permission explicite', async () => {
  // seed panier PAN-PRIVE en visibilite PRIVE, aucune permission
  // GET /paniers avec Bearer ADMIN
  // expect body.items contient PAN-PRIVE
})

it('un principal non-ADMIN ne voit pas un panier PRIVÉ sans permission', async () => {
  // même seed, GET /paniers avec Bearer contributor sans permission
  // expect body.items ne contient PAS PAN-PRIVE
})
```

- [ ] **Step 6 : Lancer les tests + typecheck**

Run: `pnpm --filter @pilote/mb-api test -- panier/routes`
Expected: PASS. Puis `pnpm --filter @pilote/mb-shared exec tsc --noEmit`.

- [ ] **Step 7 : Lint + commit**

```bash
pnpm --filter @pilote/mb-api lint
git add apps/mb-api/src/indicateur/queries/listIndicateurs.ts apps/mb-api/src/panier packages/mb-shared/src/panier.ts
git commit -m "feat(mb-api): bypass visibilité admin + recherche paniers (recherche de ressource)"
```

---

## Task 6 : `GET /api-keys/{id}`

**Files:**
- Create: `apps/mb-api/src/apiKey/queries/getApiKeyById.ts`
- Modify: `apps/mb-api/src/apiKey/routes.ts`
- Modify: `apps/mb-api/src/apiKey/routes.test.ts`

**Interfaces:**
- Produces : `getApiKeyById(id): ResultAsync<ApiKeyApiModel, never>`, route `GET /api-keys/{id}`.

- [ ] **Step 1 : Écrire `getApiKeyById.ts`**

```ts
import { type ApiKeyApiModel } from '@pilote/mb-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performGet = async (id: string): Promise<ApiKeyApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const row = await db().apiKey.findUniqueOrThrow({ where: { id } })
  return toApiKeyApiModel(row)
}

export const getApiKeyById = (id: string): ResultAsync<ApiKeyApiModel, never> =>
  ResultAsync.fromSafePromise(performGet(id))
```

- [ ] **Step 2 : Ajouter la route dans `apiKey/routes.ts`**

Ajouter `import { getApiKeyById } from '@/apiKey/queries/getApiKeyById'`, un schema de params, la route et le handler :

```ts
const detailParamsSchema = z.object({
  id: z.string().openapi({ description: 'Identifiant (UUID) de la clé API.' }),
})

const getApiKeyByIdRoute = createRoute({
  method: 'get',
  path: '/api-keys/{id}',
  tags: ['ApiKey', 'Admin'],
  summary: 'Récupérer une clé API',
  description:
    'Réservé aux clés API de rôle `ADMIN`. Retourne les métadonnées d’une clé (aucune valeur secrète).',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: ApiKeyApiModelSchema } },
      description: 'Clé API trouvée',
    },
    403: erreur403,
    404: erreur404,
  },
})
```

Handler (à ajouter avec les autres `apiKeyRoutes.openapi(...)`) :

```ts
apiKeyRoutes.openapi(getApiKeyByIdRoute, async (context) => {
  const { id } = context.req.valid('param')
  return getApiKeyById(id).match(
    (data) => jsonResponseOk({ context, data, schema: ApiKeyApiModelSchema, status: 200 }),
    never,
  )
})
```

- [ ] **Step 3 : Tests**

```ts
describe('GET /api-keys/{id}', () => {
  it('retourne une clé par id pour une clé ADMIN', async () => {
    // seed clé K, GET /api-keys/<K.id> Bearer ADMIN → 200 body.id === K.id, pas de champ secret
  })
  it('retourne 404 si inconnue', async () => {
    // GET /api-keys/<uuid random> Bearer ADMIN → 404
  })
  it('retourne 403 pour une clé non-ADMIN', async () => {
    // Bearer contributor → 403
  })
})
```

- [ ] **Step 4 : Lancer les tests**

Run: `pnpm --filter @pilote/mb-api test -- apiKey/routes`
Expected: PASS.

- [ ] **Step 5 : Lint + commit**

```bash
pnpm --filter @pilote/mb-api lint
git add apps/mb-api/src/apiKey
git commit -m "feat(mb-api): GET /api-keys/{id}"
```

---

## Task 7 : BFF + couches data front (permissions, paniers)

**Files:**
- Modify: `apps/mb-admin/src/server/api/router.ts:9`
- Create: `apps/mb-admin/src/api/permissions.ts`
- Create: `apps/mb-admin/src/api/paniers.ts`
- Create: `apps/mb-admin/src/queries/permissions.ts`

**Interfaces:**
- Produces : `fetchPrincipalPermissions`, `grantPermission`, `revokePermission` (api) ; `fetchPaniers` (api) ; `principalPermissionsQueryOptions`, `paniersSearchInfiniteQueryOptions`, `indicateursSearchInfiniteQueryOptions` (queries). Réutilise `fetchIndicateurs` de `@/api/indicateurs` (signature `{ recherche?, cursor? }`).

- [ ] **Step 1 : Élargir `SAFE_PATH` dans le BFF**

Dans `apps/mb-admin/src/server/api/router.ts`, remplacer la ligne 9 :

```ts
const SAFE_PATH = /^(indicateurs|referentiels|individus|api-keys|utilisateurs)(\/[A-Za-z0-9_-]+)*$/
```

par :

```ts
const SAFE_PATH =
  /^(indicateurs|referentiels|individus|api-keys|utilisateurs|paniers|permissions)(\/[A-Za-z0-9_-]+)*$/
```

- [ ] **Step 2 : Écrire `api/permissions.ts`**

```ts
import type {
  GrantPermissionBody,
  PermissionResourceType,
  PermissionActionValue,
  PrincipalPermissionsApiModel,
} from '@pilote/mb-shared/permission'
import { principalPermissionsApiModelSchema } from '@pilote/mb-shared/permission'

import { bffClient } from '@/api/client'

export const fetchPrincipalPermissions = async (
  principalId: string,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.get('permissions', { searchParams: { principalId } }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

export const grantPermission = async (
  body: GrantPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  const json = await bffClient.post('permissions', { json: body }).json()
  return principalPermissionsApiModelSchema.parse(json)
}

export const revokePermission = async (params: {
  principalId: string
  resourceType: PermissionResourceType
  resourcePublicId: string
  action?: PermissionActionValue
}): Promise<PrincipalPermissionsApiModel> => {
  const searchParams: Record<string, string> = {
    principalId: params.principalId,
    resourceType: params.resourceType,
    resourcePublicId: params.resourcePublicId,
  }
  if (params.action) searchParams.action = params.action
  const json = await bffClient.delete('permissions', { searchParams }).json()
  return principalPermissionsApiModelSchema.parse(json)
}
```

- [ ] **Step 3 : Écrire `api/paniers.ts`**

```ts
import type { PanierListApiModel } from '@pilote/mb-shared/panier'
import { panierListApiModelSchema } from '@pilote/mb-shared/panier'

import { bffClient } from '@/api/client'

export type ListPaniersParams = { recherche?: string | undefined; cursor?: string | undefined }

export const fetchPaniers = async (params: ListPaniersParams): Promise<PanierListApiModel> => {
  const searchParams: Record<string, string> = {}
  if (params.recherche) searchParams.recherche = params.recherche
  if (params.cursor) searchParams.cursor = params.cursor
  const json = await bffClient.get('paniers', { searchParams }).json()
  return panierListApiModelSchema.parse(json)
}
```

- [ ] **Step 4 : Écrire `queries/permissions.ts`**

```ts
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { fetchIndicateurs } from '@/api/indicateurs'
import { fetchPaniers } from '@/api/paniers'
import { fetchPrincipalPermissions } from '@/api/permissions'

export const principalPermissionsQueryOptions = (principalId: string) =>
  queryOptions({
    queryKey: ['permissions', principalId],
    queryFn: () => fetchPrincipalPermissions(principalId),
  })

export const paniersSearchInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['paniers-search', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchPaniers({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const indicateursSearchInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['indicateurs-search', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchIndicateurs({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })
```

> Note : vérifier que `@/api/indicateurs` exporte bien `fetchIndicateurs({ recherche, cursor })` (confirmé) et que `IndicateurListApiModel` a `pagination.hasMore`/`pagination.cursor` et des items `{ id, nom }`.

- [ ] **Step 5 : Typecheck + commit**

```bash
pnpm --filter mb-admin exec tsc --noEmit
git add apps/mb-admin/src/server/api/router.ts apps/mb-admin/src/api/permissions.ts apps/mb-admin/src/api/paniers.ts apps/mb-admin/src/queries/permissions.ts
git commit -m "feat(mb-admin): couches data permissions + paniers (api, queries, BFF allowlist)"
```

---

## Task 8 : Hook `useProdEditUnlock`

**Files:**
- Create: `apps/mb-admin/src/lib/useProdEditUnlock.ts`
- Modify: `apps/mb-admin/src/session.ts:92-98`

**Interfaces:**
- Produces : `useProdEditUnlock(): { isProd: boolean; locked: boolean; unlock: () => void }`.

- [ ] **Step 1 : Écrire le hook**

```ts
import { useState } from 'react'

import { session } from '@/session'

const STORAGE_KEY = 'mbadmin_prod_edit_unlocked'

// Déverrouillage de l'édition en prod, persistant pour la session navigateur.
// Hors prod : toujours déverrouillé.
export function useProdEditUnlock(): { isProd: boolean; locked: boolean; unlock: () => void } {
  const isProd = session.current?.environment === 'prod'
  const [unlocked, setUnlocked] = useState<boolean>(
    () => !isProd || sessionStorage.getItem(STORAGE_KEY) === '1',
  )

  const unlock = () => {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setUnlocked(true)
  }

  return { isProd, locked: isProd && !unlocked, unlock }
}
```

- [ ] **Step 2 : Purger le flag au logout dans `session.ts`**

Dans `session.ts`, méthode `logout()`, ajouter dans le bloc `finally` (avant/après `state.current = null`) :

```ts
      sessionStorage.removeItem('mbadmin_prod_edit_unlocked')
```

- [ ] **Step 3 : Typecheck + commit**

```bash
pnpm --filter mb-admin exec tsc --noEmit
git add apps/mb-admin/src/lib/useProdEditUnlock.ts apps/mb-admin/src/session.ts
git commit -m "feat(mb-admin): déverrouillage édition prod par session"
```

---

## Task 9 : Modale de recherche de ressource

**Files:**
- Create: `apps/mb-admin/src/components/ResourceSearchModal.tsx`

**Interfaces:**
- Consumes : `paniersSearchInfiniteQueryOptions`, `indicateursSearchInfiniteQueryOptions`.
- Produces : `ResourceSearchModal` (props ci-dessous) ; type `ResourceHit = { publicId: string; nom: string }`.

- [ ] **Step 1 : Écrire le composant**

```tsx
import type { PermissionResourceType } from '@pilote/mb-shared/permission'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  indicateursSearchInfiniteQueryOptions,
  paniersSearchInfiniteQueryOptions,
} from '@/queries/permissions'

export type ResourceHit = { publicId: string; nom: string }

export function ResourceSearchModal({
  resourceType,
  excludedPublicIds,
  onSelect,
  onClose,
}: {
  resourceType: PermissionResourceType
  excludedPublicIds: string[]
  onSelect: (hit: ResourceHit) => void
  onClose: () => void
}) {
  const [recherche, setRecherche] = useState('')
  const excluded = new Set(excludedPublicIds)

  const query = useInfiniteQuery(
    resourceType === 'PANIER'
      ? paniersSearchInfiniteQueryOptions(recherche)
      : indicateursSearchInfiniteQueryOptions(recherche),
  )

  const hits: ResourceHit[] = (query.data?.pages ?? [])
    .flatMap((page) => page.items)
    .map((item) => ({ publicId: item.id, nom: item.nom }))
    .filter((hit) => !excluded.has(hit.publicId))

  const label = resourceType === 'PANIER' ? 'panier' : 'indicateur'

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
          <h2 className="text-lg font-semibold text-text">Ajouter un {label}</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text">
            <X className="size-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-subtle" />
          <Input
            autoFocus
            placeholder={`Rechercher un ${label} par nom ou identifiant…`}
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.isLoading ? (
            <p className="py-6 text-center text-sm text-text-muted">Chargement…</p>
          ) : hits.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">Aucun résultat.</p>
          ) : (
            <ul className="divide-y divide-border">
              {hits.map((hit) => (
                <li key={hit.publicId}>
                  <button
                    type="button"
                    onClick={() => onSelect(hit)}
                    className="flex w-full items-center justify-between gap-3 px-2 py-3 text-left hover:bg-border/30"
                  >
                    <span className="truncate text-sm text-text">{hit.nom}</span>
                    <span className="shrink-0 font-mono text-xs text-text-muted">
                      {hit.publicId}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {query.hasNextPage ? (
          <div className="mt-3 text-center">
            <Button
              variant="tertiary"
              size="sm"
              type="button"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? 'Chargement…' : 'Charger plus'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
```

> Note : si `Input` ne forwarde pas `className`/`value`/`onChange` proprement (vérifier `components/ui/Input.tsx`), adapter en input natif stylé `w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm`.

- [ ] **Step 2 : Typecheck + commit**

```bash
pnpm --filter mb-admin exec tsc --noEmit
git add apps/mb-admin/src/components/ResourceSearchModal.tsx
git commit -m "feat(mb-admin): modale de recherche de ressource (panier/indicateur)"
```

---

## Task 10 : Panel `PrincipalPermissions`

**Files:**
- Create: `apps/mb-admin/src/components/PrincipalPermissions.tsx`

**Interfaces:**
- Consumes : `principalPermissionsQueryOptions`, `grantPermission`, `revokePermission`, `ResourceSearchModal` + `ResourceHit`, `useProdEditUnlock`, `extractApiError`.
- Produces : `PrincipalPermissions` (prop `{ principalId: string }`).

- [ ] **Step 1 : Écrire le composant**

```tsx
import type { PermissionActionValue, PermissionResourceType } from '@pilote/mb-shared/permission'
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Lock, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { grantPermission, revokePermission } from '@/api/permissions'
import { ResourceSearchModal, type ResourceHit } from '@/components/ResourceSearchModal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { clsxm } from '@/lib/clsxm'
import { extractApiError } from '@/lib/apiError'
import { useProdEditUnlock } from '@/lib/useProdEditUnlock'
import { principalPermissionsQueryOptions } from '@/queries/permissions'

const ACTIONS: PermissionActionValue[] = ['READ', 'WRITE']

export function PrincipalPermissions({ principalId }: { principalId: string }) {
  const queryClient = useQueryClient()
  const { isProd, locked, unlock } = useProdEditUnlock()
  const [error, setError] = useState<string | null>(null)
  const [modalType, setModalType] = useState<PermissionResourceType | null>(null)

  const { data } = useSuspenseQuery(principalPermissionsQueryOptions(principalId))

  const setData = (next: typeof data) =>
    queryClient.setQueryData(principalPermissionsQueryOptions(principalId).queryKey, next)

  const grantMutation = useMutation({
    mutationFn: grantPermission,
    onSuccess: (fresh) => setData(fresh),
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  const revokeMutation = useMutation({
    mutationFn: revokePermission,
    onSuccess: (fresh) => setData(fresh),
    onError: (err: unknown) => void extractApiError(err).then(setError),
  })

  const pending = grantMutation.isPending || revokeMutation.isPending

  const toggle = (
    resourceType: PermissionResourceType,
    resourcePublicId: string,
    action: PermissionActionValue,
    active: boolean,
  ) => {
    setError(null)
    if (active) {
      revokeMutation.mutate({ principalId, resourceType, resourcePublicId, action })
    } else {
      grantMutation.mutate({ principalId, resourceType, resourcePublicId, action })
    }
  }

  const removeResource = (resourceType: PermissionResourceType, resourcePublicId: string) => {
    setError(null)
    revokeMutation.mutate({ principalId, resourceType, resourcePublicId })
  }

  const addResource = (resourceType: PermissionResourceType, hit: ResourceHit) => {
    setError(null)
    setModalType(null)
    grantMutation.mutate({ principalId, resourceType, resourcePublicId: hit.publicId, action: 'READ' })
  }

  const disabled = locked || pending

  const renderSection = (
    title: string,
    resourceType: PermissionResourceType,
    rows: { publicId: string; nom: string; actions: PermissionActionValue[] }[],
  ) => (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
        <Button
          variant="tertiary"
          size="sm"
          type="button"
          disabled={disabled}
          onClick={() => setModalType(resourceType)}
        >
          <Plus className="size-4" /> Ajouter
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-text-subtle">
          Aucune permission directe.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((row) => {
            const hasWrite = row.actions.includes('WRITE')
            return (
              <li key={row.publicId} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">{row.nom}</span>
                  <span className="font-mono text-xs text-text-muted">{row.publicId}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  {ACTIONS.map((action) => {
                    const active = row.actions.includes(action)
                    const impliedRead = action === 'READ' && hasWrite
                    return (
                      <button
                        key={action}
                        type="button"
                        disabled={disabled}
                        title={impliedRead ? 'Lecture implicite (WRITE ⇒ READ)' : undefined}
                        onClick={() => toggle(resourceType, row.publicId, action, active)}
                        className={clsxm(
                          'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-surface text-text-muted hover:border-primary/50',
                          impliedRead && !active && 'border-dashed opacity-70',
                          disabled && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        {action}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removeResource(resourceType, row.publicId)}
                    className="ml-1 text-text-subtle hover:text-accent disabled:opacity-50"
                    aria-label="Retirer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const excludedPaniers = data.paniers.map((p) => p.publicId)
  const excludedIndicateurs = [
    ...data.indicateurs.map((i) => i.publicId),
    ...data.indicateursHerites.map((i) => i.publicId),
  ]

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Permissions</h2>
        {isProd ? (
          <span className={clsxm('text-xs font-medium', locked ? 'text-accent' : 'text-text-muted')}>
            {locked ? 'Édition verrouillée (PROD)' : 'Édition déverrouillée (PROD)'}
          </span>
        ) : null}
      </div>

      {locked ? (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-text">
            <Lock className="size-4 text-accent" /> Modifications désactivées en production.
          </span>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              if (window.confirm('Déverrouiller l’édition des permissions en PRODUCTION ?')) unlock()
            }}
            className="border-accent bg-accent text-primary-foreground hover:bg-accent"
          >
            Déverrouiller l’édition en PROD
          </Button>
        </div>
      ) : null}

      {error ? <p className="mb-4 text-sm font-medium text-accent">{error}</p> : null}

      {data.paniers.length === 0 &&
      data.indicateurs.length === 0 &&
      data.indicateursHerites.length === 0 ? (
        <EmptyState
          title="Aucune permission"
          description="Ce principal n’a aucune permission directe. Ajoutez un panier ou un indicateur."
        />
      ) : null}

      {renderSection('Paniers', 'PANIER', data.paniers)}
      {renderSection('Indicateurs', 'INDICATEUR', data.indicateurs)}

      {data.indicateursHerites.length > 0 ? (
        <div className="mb-2">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-subtle">
            Indicateurs hérités
          </h3>
          <ul className="divide-y divide-border rounded-lg border border-dashed border-border">
            {data.indicateursHerites.map((row) => (
              <li
                key={row.publicId}
                className="flex items-center gap-3 px-3 py-2.5 text-text-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{row.nom}</span>
                  <span className="font-mono text-xs">{row.publicId}</span>
                </span>
                <span className="text-xs italic">hérité · via {row.viaPanierPublicId}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {modalType ? (
        <ResourceSearchModal
          resourceType={modalType}
          excludedPublicIds={modalType === 'PANIER' ? excludedPaniers : excludedIndicateurs}
          onSelect={(hit) => addResource(modalType, hit)}
          onClose={() => setModalType(null)}
        />
      ) : null}
    </section>
  )
}
```

> Design intent (frontend-design) : chips d'action compacts, section « hérités » en pointillés/atténuée pour signaler le lecture-seule, contexte prod porté par la couleur `accent`. Vérifier les tokens `primary-foreground`, `accent`, `text-subtle` dans `tailwind.config` (utilisés ailleurs dans l'app).

- [ ] **Step 2 : Typecheck + commit**

```bash
pnpm --filter mb-admin exec tsc --noEmit
git add apps/mb-admin/src/components/PrincipalPermissions.tsx
git commit -m "feat(mb-admin): panel de gestion des permissions d'un principal"
```

---

## Task 11 : Section Permissions sur la fiche utilisateur

**Files:**
- Modify: `apps/mb-admin/src/routes/_authed/utilisateurs/$id.tsx`

**Interfaces:**
- Consumes : `PrincipalPermissions` (prop `principalId`), `principalPermissionsQueryOptions`. `utilisateur.id === principalId`.

- [ ] **Step 1 : Précharger + monter le panel**

Dans `utilisateurs/$id.tsx` :
1. Ajouter les imports :

```ts
import { PrincipalPermissions } from '@/components/PrincipalPermissions'
import { principalPermissionsQueryOptions } from '@/queries/permissions'
```

2. Dans le `loader`, précharger les permissions en parallèle :

```ts
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(utilisateurQueryOptions(params.id)),
      context.queryClient.ensureQueryData(principalPermissionsQueryOptions(params.id)),
    ])
  },
```

3. Sous le bloc `<UtilisateurForm .../>` (dans le `return`, après la balise fermante du conteneur du formulaire, toujours dans le `<div>` racine), ajouter une section espacée :

```tsx
      <div className="mx-auto mt-8 max-w-2xl">
        <PrincipalPermissions principalId={id} />
      </div>
```

- [ ] **Step 2 : Vérification manuelle (voir Task 13) + commit**

```bash
pnpm --filter mb-admin exec tsc --noEmit
git add apps/mb-admin/src/routes/_authed/utilisateurs/$id.tsx
git commit -m "feat(mb-admin): section permissions sur la fiche utilisateur"
```

---

## Task 12 : Fiche détail clé API + section Permissions

**Files:**
- Modify: `apps/mb-admin/src/api/apiKeys.ts`
- Modify: `apps/mb-admin/src/queries/apiKeys.ts`
- Create: `apps/mb-admin/src/routes/_authed/api-keys/$id.tsx`
- Modify: `apps/mb-admin/src/routes/_authed/api-keys/index.tsx` (rendre les lignes cliquables vers le détail)

**Interfaces:**
- Consumes : `fetchApiKeyById`, `apiKeyQueryOptions`, `PrincipalPermissions`. `apiKey.id === principalId`.
- Produces : `fetchApiKeyById(id)`, `apiKeyQueryOptions(id)`.

- [ ] **Step 1 : Ajouter `fetchApiKeyById` dans `api/apiKeys.ts`**

```ts
export const fetchApiKeyById = async (id: string): Promise<ApiKeyApiModel> => {
  const json = await bffClient.get(`api-keys/${id}`).json()
  return apiKeyApiModelSchema.parse(json)
}
```

(`ApiKeyApiModel` et `apiKeyApiModelSchema` sont déjà importés dans ce fichier.)

- [ ] **Step 2 : Ajouter `apiKeyQueryOptions` dans `queries/apiKeys.ts`**

```ts
import { queryOptions } from '@tanstack/react-query'

import { fetchApiKeyById } from '@/api/apiKeys'

export const apiKeyQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['api-key', id], queryFn: () => fetchApiKeyById(id) })
```

(fusionner avec les imports/exports existants du fichier ; `apiKeysQueryOptions` — la liste — reste inchangé.)

- [ ] **Step 3 : Créer la fiche `api-keys/$id.tsx`**

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { PrincipalPermissions } from '@/components/PrincipalPermissions'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeading } from '@/components/PageHeading'
import { apiKeyQueryOptions } from '@/queries/apiKeys'
import { principalPermissionsQueryOptions } from '@/queries/permissions'

export const Route = createFileRoute('/_authed/api-keys/$id')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(apiKeyQueryOptions(params.id)),
      context.queryClient.ensureQueryData(principalPermissionsQueryOptions(params.id)),
    ])
  },
  component: ApiKeyDetailComponent,
})

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  expired: 'Expirée',
  revoked: 'Révoquée',
}

function ApiKeyDetailComponent() {
  const { id } = Route.useParams()
  const { data: apiKey } = useSuspenseQuery(apiKeyQueryOptions(id))

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <Link to="/api-keys" className="hover:text-primary">
          Clés API
        </Link>
        <span className="font-medium text-text">{apiKey.label}</span>
      </Breadcrumb>
      <PageHeading title={apiKey.label} subtitle={<span className="font-mono">{apiKey.prefix}…</span>} />

      <div className="mx-auto max-w-2xl">
        <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-6 text-sm">
          <div>
            <span className="block text-text-muted">Rôle</span>
            <span className="text-text">{apiKey.role}</span>
          </div>
          <div>
            <span className="block text-text-muted">Statut</span>
            <span className="text-text">{STATUS_LABEL[apiKey.status] ?? apiKey.status}</span>
          </div>
          <div>
            <span className="block text-text-muted">Créée le</span>
            <span className="text-text">
              {new Date(apiKey.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div>
            <span className="block text-text-muted">Expire le</span>
            <span className="text-text">
              {apiKey.expiresAt
                ? new Date(apiKey.expiresAt).toLocaleDateString('fr-FR')
                : '—'}
            </span>
          </div>
        </div>

        <PrincipalPermissions principalId={id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Rendre les lignes de la liste clés API cliquables vers le détail**

Dans `api-keys/index.tsx`, envelopper le contenu identifiant de chaque ligne (colonne Label) dans un `<Link to="/api-keys/$id" params={{ id: apiKey.id }}>` ou rendre la `Table.Row` cliquable en suivant le pattern `lib/clickableRow.ts` s'il est utilisé ailleurs (cf. `utilisateurs/index.tsx`). Exemple minimal sur la cellule Label :

```tsx
                <Table.Cell>
                  <Link
                    to="/api-keys/$id"
                    params={{ id: apiKey.id }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {apiKey.label}
                  </Link>
                </Table.Cell>
```

(ajouter l'import `Link` de `@tanstack/react-router` s'il n'est pas déjà présent — il l'est.)

- [ ] **Step 5 : Typecheck + commit**

```bash
pnpm --filter mb-admin exec tsc --noEmit
git add apps/mb-admin/src/api/apiKeys.ts apps/mb-admin/src/queries/apiKeys.ts apps/mb-admin/src/routes/_authed/api-keys
git commit -m "feat(mb-admin): fiche détail clé API + section permissions"
```

---

## Task 13 : Vérification manuelle end-to-end

**Files:** aucun (validation).

- [ ] **Step 1 : Build + lint global**

Run:
```bash
pnpm --filter @pilote/mb-shared exec tsc --noEmit
pnpm --filter @pilote/mb-api test -- permission
pnpm --filter mb-admin exec tsc --noEmit
pnpm lint
```
Expected: tout vert.

- [ ] **Step 2 : Scénario fonctionnel (env dev)**

Démarrer mb-api + mb-admin en local (cf. scripts du repo), se connecter avec une clé **ADMIN** sur l'environnement `dev`, puis vérifier :
1. Fiche utilisateur → section Permissions visible, `EmptyState` si vide.
2. « Ajouter » (Paniers) → modale, recherche, sélection → panier ajouté avec `READ`.
3. Toggle `WRITE` sur ce panier → indicateurs du panier apparaissent en section « hérités · via PAN-… ».
4. Toggle `READ`/`WRITE` sur un indicateur direct ; ✕ retire la ressource.
5. Fiche clé API (via la liste → clic sur le label) → métadonnées + même panel fonctionnel.
6. Une clé **CONTRIBUTOR** (non-admin) → le panel affiche l'erreur ADMIN (403 surfacé).

- [ ] **Step 3 : Scénario prod (déverrouillage)**

Se connecter sur `prod` : le panel est en lecture seule, bandeau « Édition verrouillée (PROD) ». Cliquer « Déverrouiller l'édition en PROD » → confirmation → édition possible. Recharger un autre principal dans la même session → reste déverrouillé. Logout → au re-login prod, re-verrouillé.

- [ ] **Step 4 : Finalisation**

Suivre la skill `superpowers:finishing-a-development-branch` pour ouvrir la PR (avec gifs par scénario, permalinks SHA — cf. conventions projet).

---

## Self-Review

**Spec coverage :**
- Modèle par principal + section sur les 2 fiches → Tasks 11, 12. ✅
- Panel partagé → Task 10. ✅
- Deux toggles READ/WRITE indépendants + indice WRITE⇒READ → Task 10. ✅
- Mutations immédiates → Task 10 (grant/revoke renvoient l'état à jour, `setQueryData`). ✅ (Note : le serveur renvoyant l'état complet, on applique la réponse autoritaire plutôt qu'un optimistic pur ; ressenti immédiat conservé, sans divergence d'état.)
- Modale de recherche → Task 9. ✅
- Accès hérités lecture seule → Tasks 2 (calcul), 10 (affichage). ✅
- Sécurité prod déverrouillage session → Tasks 8, 10. ✅
- Pas de carte hub → aucun changement à `fonctionnalites.tsx`. ✅
- Backend GET/POST/DELETE /permissions → Tasks 2, 3, 4. ✅
- Bypass admin visibilité + recherche paniers → Task 5. ✅
- GET /api-keys/{id} → Task 6. ✅
- Contrat partagé → Task 1. ✅
- Tests backend, pas de tests front → Tasks 2-6 (tests), front sans tests. ✅

**Placeholder scan :** Les commentaires « remplir avec les helpers de seed exacts » dans les tests renvoient au fichier-template `utilisateur/routes.test.ts` (imports de harness non devinables sans le lire) — c'est une consigne de lecture, pas un placeholder de logique ; l'intention de chaque test (arrange/act/assert) est explicite.

**Type consistency :** `principalPermissionsApiModelSchema` (paniers/indicateurs/indicateursHerites) cohérent entre loader (Task 2), commands (Tasks 3-4) et front (Tasks 7, 10). `resolveResourceId` (Task 3) réutilisé Task 4. `grantPermission`/`revokePermission` signatures identiques api (Task 7) ↔ mutations (Task 10). `resourceType ∈ {PANIER, INDICATEUR}`, `action ∈ {READ, WRITE}` partout.
