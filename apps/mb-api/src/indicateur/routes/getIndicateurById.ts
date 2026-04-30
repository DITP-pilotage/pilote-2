import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { indicateurAPISchema } from '@pilote/mb-shared'

import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { indicateursFixtures } from '@/indicateur/data/indicateursFixtures'

const IndicateurSchema = indicateurAPISchema.openapi('Indicateur')

const NotFoundSchema = z
  .object({ error: z.literal('Indicateur introuvable') })
  .openapi('IndicateurNotFound')

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const getIndicateurByIdRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}',
  tags: ['Indicateur'],
  summary: 'Récupérer un indicateur par id',
  request: { params: paramsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurSchema } },
      description: 'Indicateur trouvé',
    },
    404: {
      content: { 'application/json': { schema: NotFoundSchema } },
      description: 'Indicateur introuvable',
    },
  },
})

export const getIndicateurById = new OpenAPIHono()

getIndicateurById.openapi(getIndicateurByIdRoute, (context) => {
  const { id } = context.req.valid('param')
  const found = indicateursFixtures.find((i) => i.id === id)

  if (!found) {
    return jsonResponseError({
      context,
      error: { error: 'Indicateur introuvable' as const },
      schema: NotFoundSchema,
      status: 404,
    })
  }

  return jsonResponseOk({
    context,
    data: found,
    schema: IndicateurSchema,
    status: 200,
  })
})
