import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema, indicateurApiModelSchema } from '@pilote/mb-shared'

import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { indicateursFixtures } from '@/indicateur/data/indicateursFixtures'

const IndicateurApiModelSchema = indicateurApiModelSchema.openapi('IndicateurApiModel')

export const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

export const INDICATEUR_NOT_FOUND_CODE = 'INDICATEUR_NOT_FOUND' as const

const paramsSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .describe('Identifiant numérique unique de l\'indicateur.'),
})

const getIndicateurByIdRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}',
  tags: ['Indicateur'],
  summary: 'Récupérer un indicateur par id',
  description:
    'Retourne un indicateur identifié par son id numérique. Renvoie 404 (`INDICATEUR_NOT_FOUND`) si aucun indicateur ne correspond.',
  request: { params: paramsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur trouvé',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
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
      error: {
        code: INDICATEUR_NOT_FOUND_CODE,
        message: 'Indicateur introuvable',
      },
      schema: ErrorApiModelSchema,
      status: 404,
    })
  }

  return jsonResponseOk({
    context,
    data: found,
    schema: IndicateurApiModelSchema,
    status: 200,
  })
})
