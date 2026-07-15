import { createRoute, z } from '@hono/zod-openapi'
import {
  modifierEtatFeatureFlippingBodySchema,
  remplacerUtilisateursAutorisesBodySchema,
} from '@pilote/kpilote-shared/featureFlipping'

import { modifierEtatFeatureFlipping } from '@/featureFlipping/commands/modifierEtatFeatureFlipping'
import { remplacerUtilisateursAutorises } from '@/featureFlipping/commands/remplacerUtilisateursAutorises'
import {
  FeatureFlippingDetailApiModelSchema,
  FeatureFlippingListApiModelSchema,
  reponseDetailFeatureFlipping,
  reponseListeFeatureFlipping,
} from '@/featureFlipping/openapi'
import { getFeatureFlippingById } from '@/featureFlipping/queries/getFeatureFlippingById'
import { listerFeatureFlippings } from '@/featureFlipping/queries/listerFeatureFlippings'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'

export const featureFlippingRoutes = createOpenApiHono()

const params = z.object({ id: z.string().uuid() })

const listerRoute = createRoute({
  method: 'get',
  path: '/feature-flipping',
  tags: ['FeatureFlipping'],
  summary: 'Lister les feature flippings',
  middleware: [requireAuthentication],
  responses: reponseListeFeatureFlipping,
})

featureFlippingRoutes.openapi(listerRoute, async (context) =>
  (await listerFeatureFlippings()).match(
    (data) =>
      jsonResponseOk({ context, data, schema: FeatureFlippingListApiModelSchema, status: 200 }),
    never,
  ),
)

const detailRoute = createRoute({
  method: 'get',
  path: '/feature-flipping/{id}',
  tags: ['FeatureFlipping'],
  summary: 'Détail d’un feature flipping',
  middleware: [requireAuthentication],
  request: { params },
  responses: reponseDetailFeatureFlipping,
})

featureFlippingRoutes.openapi(detailRoute, async (context) => {
  const { id } = context.req.valid('param')
  return (await getFeatureFlippingById(id)).match(
    (data) =>
      jsonResponseOk({ context, data, schema: FeatureFlippingDetailApiModelSchema, status: 200 }),
    never,
  )
})

const modifierEtatRoute = createRoute({
  method: 'patch',
  path: '/feature-flipping/{id}/etat',
  tags: ['FeatureFlipping'],
  summary: 'Modifier l’état d’un feature flipping',
  middleware: [requireAuthentication],
  request: {
    params,
    body: {
      content: { 'application/json': { schema: modifierEtatFeatureFlippingBodySchema } },
      required: true,
    },
  },
  responses: reponseDetailFeatureFlipping,
})

featureFlippingRoutes.openapi(modifierEtatRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => modifierEtatFeatureFlipping(id, body))
  return result.match(
    (data) =>
      jsonResponseOk({ context, data, schema: FeatureFlippingDetailApiModelSchema, status: 200 }),
    never,
  )
})

const remplacerUtilisateursRoute = createRoute({
  method: 'put',
  path: '/feature-flipping/{id}/utilisateurs',
  tags: ['FeatureFlipping'],
  summary: 'Remplacer les utilisateurs autorisés',
  middleware: [requireAuthentication],
  request: {
    params,
    body: {
      content: { 'application/json': { schema: remplacerUtilisateursAutorisesBodySchema } },
      required: true,
    },
  },
  responses: reponseDetailFeatureFlipping,
})

featureFlippingRoutes.openapi(remplacerUtilisateursRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => remplacerUtilisateursAutorises(id, body))
  return result.match(
    (data) =>
      jsonResponseOk({ context, data, schema: FeatureFlippingDetailApiModelSchema, status: 200 }),
    never,
  )
})
