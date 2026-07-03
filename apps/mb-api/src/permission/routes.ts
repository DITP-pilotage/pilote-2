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

export const permissionRoutes = new OpenAPIHono()

permissionRoutes.openapi(getPermissionsRoute, async (context) => {
  const { principalId } = context.req.valid('query')
  return getPrincipalPermissions(principalId).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})
