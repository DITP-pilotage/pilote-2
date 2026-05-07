import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { individuApiModelSchema, individuPublicIdSchema } from '@pilote/mb-shared/individu'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { getIndividuByPublicId } from '@/individu/queries/getIndividuByPublicId'

const IndividuApiModelSchema = individuApiModelSchema.openapi('IndividuApiModel')

const detailParamsSchema = z.object({
  id: individuPublicIdSchema,
})

const getIndividuByIdRoute = createRoute({
  method: 'get',
  path: '/individus/{id}',
  tags: ['Individu'],
  summary: 'Récupérer un individu par identifiant public',
  description:
    "Retourne un individu identifié par son identifiant public (ex. `DEPT-84`, `REG-93`, `FR`). Le payload inclut les référentiels auxquels l'individu appartient.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndividuApiModelSchema } },
      description: 'Individu trouvé',
    },
  },
})

export const individuRoutes = new OpenAPIHono()

individuRoutes.openapi(getIndividuByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getIndividuByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndividuApiModelSchema,
        status: 200,
      }),
    never,
  )
})
