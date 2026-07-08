import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import {
  grantIndicateurPermissionBodySchema,
  grantPanierPermissionBodySchema,
  listPrincipalPermissionsQuerySchema,
  principalPermissionsApiModelSchema,
  revokeIndicateurPermissionQuerySchema,
  revokePanierPermissionQuerySchema,
} from '@pilote/kpilot-shared/permission'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur403, erreur404, succes200 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { grantIndicateurPermission } from '@/permission/commands/grantIndicateurPermission'
import { grantPanierPermission } from '@/permission/commands/grantPanierPermission'
import { revokeIndicateurPermission } from '@/permission/commands/revokeIndicateurPermission'
import { revokePanierPermission } from '@/permission/commands/revokePanierPermission'
import { getPrincipalPermissions } from '@/permission/queries/getPrincipalPermissions'

const PrincipalPermissionsApiModelSchema = principalPermissionsApiModelSchema.openapi(
  'PrincipalPermissionsApiModel',
)
const GrantIndicateurPermissionBodySchema = grantIndicateurPermissionBodySchema.openapi(
  'GrantIndicateurPermissionBody',
)
const GrantPanierPermissionBodySchema = grantPanierPermissionBodySchema.openapi(
  'GrantPanierPermissionBody',
)

// --- GET /permissions --------------------------------------------------------

const getPermissionsRoute = createRoute({
  method: 'get',
  path: '/permissions',
  tags: ['Permission', 'Admin'],
  summary: "Lister les permissions d'un principal",
  description:
    `Réservé aux clés API de rôle \`ADMIN\`. Retourne les permissions directes (paniers + indicateurs) du principal, plus ` +
    'les indicateurs en READ hérités via propagation panier → indicateur.',
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

// --- POST /permissions/panier ------------------------------------------------

const grantPanierPermissionRoute = createRoute({
  method: 'post',
  path: '/permissions/panier',
  tags: ['Permission', 'Admin'],
  summary: 'Accorder une permission sur un panier',
  description: `Réservé aux clés API de rôle \`ADMIN\`. Accorde une action (\`READ\`/\`WRITE\`) sur un panier à un principal. **Idempotent**. Retourne l'état à jour.`,
  middleware: [requireAuthentication],
  request: {
    body: {
      content: { 'application/json': { schema: GrantPanierPermissionBodySchema } },
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

// --- DELETE /permissions/panier ----------------------------------------------

const revokePanierPermissionRoute = createRoute({
  method: 'delete',
  path: '/permissions/panier',
  tags: ['Permission', 'Admin'],
  summary: 'Retirer une permission sur un panier',
  description: `Réservé aux clés API de rôle \`ADMIN\`. Retire une action précise si \`action\` est fournie, sinon toutes les actions du panier. **Idempotent**. Retourne l'état à jour.`,
  middleware: [requireAuthentication],
  request: { query: revokePanierPermissionQuerySchema },
  responses: {
    200: succes200('Permission retirée, état à jour', PrincipalPermissionsApiModelSchema),
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

permissionRoutes.openapi(grantPanierPermissionRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => grantPanierPermission(body))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})

permissionRoutes.openapi(revokePanierPermissionRoute, async (context) => {
  const query = context.req.valid('query')
  return (await withTransaction(async () => revokePanierPermission(query))).match(
    (data) =>
      jsonResponseOk({ context, data, schema: PrincipalPermissionsApiModelSchema, status: 200 }),
    never,
  )
})
