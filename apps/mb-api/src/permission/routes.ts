import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import {
  grantPermissionBodySchema,
  listPrincipalPermissionsQuerySchema,
  principalPermissionsApiModelSchema,
  revokePermissionQuerySchema,
} from '@pilote/mb-shared/permission'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur403, erreur404, erreur409 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { grantPermission } from '@/permission/commands/grantPermission'
import { revokePermission } from '@/permission/commands/revokePermission'
import { getPrincipalPermissions } from '@/permission/queries/getPrincipalPermissions'

const PrincipalPermissionsApiModelSchema = principalPermissionsApiModelSchema.openapi(
  'PrincipalPermissionsApiModel',
)
const GrantPermissionBodySchema = grantPermissionBodySchema.openapi('GrantPermissionBody')

// --- GET /permissions --------------------------------------------------------

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

// --- POST /permissions -------------------------------------------------------

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
    body: {
      content: { 'application/json': { schema: GrantPermissionBodySchema } },
      required: true,
    },
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

// --- DELETE /permissions -----------------------------------------------------

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

export const permissionRoutes = new OpenAPIHono()

permissionRoutes.openapi(getPermissionsRoute, async (context) => {
  const { principalId } = context.req.valid('query')
  return getPrincipalPermissions(principalId).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})

permissionRoutes.openapi(grantPermissionRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => grantPermission(body))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})

permissionRoutes.openapi(revokePermissionRoute, async (context) => {
  const query = context.req.valid('query')
  return (await withTransaction(async () => revokePermission(query))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})
