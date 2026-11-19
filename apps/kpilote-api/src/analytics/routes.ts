import { createRoute, z } from '@hono/zod-openapi'
import {
  analyticsDimensionKeySchema,
  analyticsDimensionListSchema,
  analyticsDimensionSchema,
  upsertAnalyticsDimensionBodySchema,
} from '@pilote/kpilote-shared/analytics/dimensions'

import {
  deleteDimension,
  listDimensions,
  upsertDimension,
  type UpsertDimensionError,
} from '@/analytics/dimensions'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import {
  ErrorApiModelSchema,
  erreur400,
  erreur403,
  erreur404,
  erreur409,
  succes200,
} from '@/framework/openapi/responses'

export const analyticsRoutes = createOpenApiHono()

const AnalyticsDimensionSchema = analyticsDimensionSchema.openapi('AnalyticsDimension')

const describeUpsertDimensionError = (
  error: UpsertDimensionError,
): { status: 409; message: string; details?: Record<string, unknown> } => {
  switch (error.type) {
    case 'DIMENSION_DEJA_ASSOCIEE':
      return {
        status: 409,
        message:
          error.cle === null
            ? `La dimension ${error.slot} est déjà associée à une autre clé.`
            : `La dimension ${error.slot} est déjà associée à « ${error.cle} ».`,
      }
  }
}

const requireAdmin = () =>
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

const params = z.object({ cle: analyticsDimensionKeySchema })

const listRoute = createRoute({
  method: 'get',
  path: '/analytics/dimensions',
  tags: ['Analytics'],
  summary: 'Lister les dimensions Matomo',
  description:
    'Correspondance entre les clés de contexte analytics et les dimensions personnalisées de Matomo. Publique : la webapp la lit avant la connexion.',
  responses: {
    200: succes200('Dimensions', analyticsDimensionListSchema.openapi('AnalyticsDimensionList')),
  },
})

const upsertRoute = createRoute({
  method: 'put',
  path: '/analytics/dimensions/{cle}',
  tags: ['Analytics'],
  summary: 'Créer ou modifier une dimension Matomo',
  description: 'Un numéro déjà associé à une autre clé rend 409. Clé API ADMIN.',
  middleware: [requireAuthentication],
  request: {
    params,
    body: {
      content: { 'application/json': { schema: upsertAnalyticsDimensionBodySchema } },
      required: true,
    },
  },
  responses: {
    200: succes200('Dimension', AnalyticsDimensionSchema),
    400: erreur400,
    403: erreur403,
    409: erreur409,
  },
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/analytics/dimensions/{cle}',
  tags: ['Analytics'],
  summary: 'Supprimer une dimension Matomo',
  description: 'Le contexte de cette clé repart dans le nom des événements. Clé API ADMIN.',
  middleware: [requireAuthentication],
  request: { params },
  responses: {
    204: { description: 'Dimension supprimée' },
    403: erreur403,
    404: erreur404,
  },
})

analyticsRoutes.openapi(listRoute, async (context) => context.json(await listDimensions(), 200))

analyticsRoutes.openapi(upsertRoute, async (context) => {
  requireAdmin()
  const { cle } = context.req.valid('param')
  return upsertDimension(cle, context.req.valid('json')).match(
    (data) => jsonResponseOk({ context, data, schema: AnalyticsDimensionSchema, status: 200 }),
    (error) => {
      const { status, message, details } = describeUpsertDimensionError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

analyticsRoutes.openapi(deleteRoute, async (context) => {
  requireAdmin()
  await deleteDimension(context.req.valid('param').cle)
  return context.body(null, 204)
})
