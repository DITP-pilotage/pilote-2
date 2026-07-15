import { createRoute, z } from '@hono/zod-openapi'
import {
  modifierEtatFeatureBodySchema,
  remplacerUtilisateursAutorisesBodySchema,
} from '@pilote/kpilote-shared/feature'

import { modifierEtatFeature } from '@/feature/commands/modifierEtatFeature'
import { remplacerUtilisateursAutorises } from '@/feature/commands/remplacerUtilisateursAutorises'
import {
  FeatureDetailApiModelSchema,
  FeatureListApiModelSchema,
  reponseDetailFeature,
  reponseListeFeature,
} from '@/feature/openapi'
import { getFeatureById } from '@/feature/queries/getFeatureById'
import { listerFeatures } from '@/feature/queries/listerFeatures'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'

export const featureRoutes = createOpenApiHono()

const params = z.object({ id: z.string().uuid() })

const listerRoute = createRoute({
  method: 'get',
  path: '/features',
  tags: ['Feature'],
  summary: 'Lister les feature flippings',
  middleware: [requireAuthentication],
  responses: reponseListeFeature,
})

featureRoutes.openapi(listerRoute, async (context) =>
  (await listerFeatures()).match(
    (data) => jsonResponseOk({ context, data, schema: FeatureListApiModelSchema, status: 200 }),
    never,
  ),
)

const detailRoute = createRoute({
  method: 'get',
  path: '/features/{id}',
  tags: ['Feature'],
  summary: 'Détail d’un feature flipping',
  middleware: [requireAuthentication],
  request: { params },
  responses: reponseDetailFeature,
})

featureRoutes.openapi(detailRoute, async (context) => {
  const { id } = context.req.valid('param')
  return (await getFeatureById(id)).match(
    (data) => jsonResponseOk({ context, data, schema: FeatureDetailApiModelSchema, status: 200 }),
    never,
  )
})

const modifierEtatRoute = createRoute({
  method: 'patch',
  path: '/features/{id}/etat',
  tags: ['Feature'],
  summary: 'Modifier l’état d’un feature flipping',
  middleware: [requireAuthentication],
  request: {
    params,
    body: {
      content: { 'application/json': { schema: modifierEtatFeatureBodySchema } },
      required: true,
    },
  },
  responses: reponseDetailFeature,
})

featureRoutes.openapi(modifierEtatRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => modifierEtatFeature(id, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: FeatureDetailApiModelSchema, status: 200 }),
    never,
  )
})

const remplacerUtilisateursRoute = createRoute({
  method: 'put',
  path: '/features/{id}/utilisateurs',
  tags: ['Feature'],
  summary: 'Remplacer les utilisateurs autorisés',
  middleware: [requireAuthentication],
  request: {
    params,
    body: {
      content: { 'application/json': { schema: remplacerUtilisateursAutorisesBodySchema } },
      required: true,
    },
  },
  responses: reponseDetailFeature,
})

featureRoutes.openapi(remplacerUtilisateursRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => remplacerUtilisateursAutorises(id, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: FeatureDetailApiModelSchema, status: 200 }),
    never,
  )
})
