import { createRoute } from '@hono/zod-openapi'
import {
  grantCollectionPermissionBodySchema,
  grantIndicateurPermissionBodySchema,
  listPrincipalPermissionsQuerySchema,
  principalPermissionsApiModelSchema,
  revokeCollectionPermissionQuerySchema,
  revokeIndicateurPermissionQuerySchema,
} from '@pilote/kpilote-shared/permission'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur403, erreur404, succes200 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { grantIndicateurPermission } from '@/permission/commands/grantIndicateurPermission'
import { grantCollectionPermission } from '@/permission/commands/grantCollectionPermission'
import { revokeIndicateurPermission } from '@/permission/commands/revokeIndicateurPermission'
import { revokeCollectionPermission } from '@/permission/commands/revokeCollectionPermission'
import { getPrincipalPermissions } from '@/permission/queries/getPrincipalPermissions'

const PrincipalPermissionsApiModelSchema = principalPermissionsApiModelSchema.openapi(
  'PrincipalPermissionsApiModel',
)
const GrantIndicateurPermissionBodySchema = grantIndicateurPermissionBodySchema.openapi(
  'GrantIndicateurPermissionBody',
)
const GrantCollectionPermissionBodySchema = grantCollectionPermissionBodySchema.openapi(
  'GrantCollectionPermissionBody',
)

// --- GET /permissions --------------------------------------------------------

const getPermissionsRoute = createRoute({
  method: 'get',
  path: '/permissions',
  tags: ['Permission', 'Admin'],
  summary: "Lister les permissions d'un principal",
  description:
    `Réservé aux clés API de rôle \`ADMIN\`. Retourne les permissions directes (collections + indicateurs) du principal, plus ` +
    'les indicateurs en READ hérités via propagation collection → indicateur.',
  middleware: [requireAuthentication],
  request: { query: listPrincipalPermissionsQuerySchema },
  responses: {
    200: succes200('Permissions du principal', PrincipalPermissionsApiModelSchema),
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

// --- POST /permissions/indicateur --------------------------------------------

const grantIndicateurPermissionRoute = createRoute({
  method: 'post',
  path: '/permissions/indicateur',
  tags: ['Permission', 'Admin'],
  summary: 'Accorder une permission sur un indicateur',
  description: `Réservé aux clés API de rôle \`ADMIN\`. Accorde une action (\`READ\`/\`WRITE\`) sur un indicateur à un principal. **Idempotent**. Retourne l'état à jour.`,
  middleware: [requireAuthentication],
  request: {
    body: {
      content: { 'application/json': { schema: GrantIndicateurPermissionBodySchema } },
      required: true,
    },
  },
  responses: {
    200: succes200('Permission accordée, état à jour', PrincipalPermissionsApiModelSchema),
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

// --- DELETE /permissions/indicateur ------------------------------------------

const revokeIndicateurPermissionRoute = createRoute({
  method: 'delete',
  path: '/permissions/indicateur',
  tags: ['Permission', 'Admin'],
  summary: 'Retirer une permission sur un indicateur',
  description: `Réservé aux clés API de rôle \`ADMIN\`. Retire une action précise si \`action\` est fournie, sinon toutes les actions de l'indicateur. **Idempotent**. Retourne l'état à jour.`,
  middleware: [requireAuthentication],
  request: { query: revokeIndicateurPermissionQuerySchema },
  responses: {
    200: succes200('Permission retirée, état à jour', PrincipalPermissionsApiModelSchema),
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

// --- POST /permissions/collection -----------------------------------------------

const grantCollectionPermissionRoute = createRoute({
  method: 'post',
  path: '/permissions/collection',
  tags: ['Permission', 'Admin'],
  summary: 'Accorder une permission sur une collection',
  description: `Réservé aux clés API de rôle \`ADMIN\`. Accorde une action (\`READ\`/\`WRITE\`) sur une collection à un principal. **Idempotent**. Retourne l'état à jour.`,
  middleware: [requireAuthentication],
  request: {
    body: {
      content: { 'application/json': { schema: GrantCollectionPermissionBodySchema } },
      required: true,
    },
  },
  responses: {
    200: succes200('Permission accordée, état à jour', PrincipalPermissionsApiModelSchema),
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

// --- DELETE /permissions/collection ---------------------------------------------

const revokeCollectionPermissionRoute = createRoute({
  method: 'delete',
  path: '/permissions/collection',
  tags: ['Permission', 'Admin'],
  summary: 'Retirer une permission sur une collection',
  description: `Réservé aux clés API de rôle \`ADMIN\`. Retire une action précise si \`action\` est fournie, sinon toutes les actions de la collection. **Idempotent**. Retourne l'état à jour.`,
  middleware: [requireAuthentication],
  request: { query: revokeCollectionPermissionQuerySchema },
  responses: {
    200: succes200('Permission retirée, état à jour', PrincipalPermissionsApiModelSchema),
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

export const permissionRoutes = createOpenApiHono()

permissionRoutes.openapi(getPermissionsRoute, async (context) => {
  const { principalId } = context.req.valid('query')
  return getPrincipalPermissions(principalId).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})

permissionRoutes.openapi(grantIndicateurPermissionRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => grantIndicateurPermission(body))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})

permissionRoutes.openapi(revokeIndicateurPermissionRoute, async (context) => {
  const query = context.req.valid('query')
  return (await withTransaction(async () => revokeIndicateurPermission(query))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})

permissionRoutes.openapi(grantCollectionPermissionRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => grantCollectionPermission(body))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})

permissionRoutes.openapi(revokeCollectionPermissionRoute, async (context) => {
  const query = context.req.valid('query')
  return (await withTransaction(async () => revokeCollectionPermission(query))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})
