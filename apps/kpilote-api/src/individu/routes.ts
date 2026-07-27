import { createRoute, z } from '@hono/zod-openapi'
import {
  individuApiModelSchema,
  individuPublicIdSchema,
  listIndividusQuerySchema,
} from '@pilote/kpilote-shared/individu'
import { createPaginatedApiListSchema } from '@pilote/kpilote-shared/pagination'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400 } from '@/framework/openapi/responses'
import { getIndividuByPublicId } from '@/individu/queries/getIndividuByPublicId'
import { listIndividus } from '@/individu/queries/listIndividus'

const IndividuApiModelSchema = individuApiModelSchema.openapi('IndividuApiModel')
const IndividuListApiModelSchema =
  createPaginatedApiListSchema(individuApiModelSchema).openapi('IndividuListApiModel')

const getIndividusRoute = createRoute({
  method: 'get',
  path: '/individus',
  tags: ['Individu'],
  summary: 'Lister les individus',
  description:
    "Retourne la liste paginée des individus, tous référentiels confondus, triée par nom. Filtre optionnel `recherche` sur le nom. Chaque item inclut `parents`, ce qui permet d'identifier les individus déjà rattachés à un parent. Pagination cursor-based.",
  middleware: [requireAuthentication],
  request: { query: listIndividusQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndividuListApiModelSchema } },
      description: 'Liste paginée des individus',
    },
    400: erreur400,
  },
})

const detailParamsSchema = z.object({
  id: individuPublicIdSchema,
})

const getIndividuByIdRoute = createRoute({
  method: 'get',
  path: '/individus/{id}',
  tags: ['Individu'],
  summary: 'Récupérer un individu par identifiant public',
  description:
    "Retourne un individu identifié par son identifiant public (ex. `DEPT-84`, `REG-93`, `FR`). Le payload inclut le référentiel auquel l'individu appartient.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndividuApiModelSchema } },
      description: 'Individu trouvé',
    },
  },
})

export const individuRoutes = createOpenApiHono()

individuRoutes.openapi(getIndividusRoute, async (context) => {
  const { recherche, cursor, pageSize } = context.req.valid('query')

  return listIndividus({ recherche, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndividuListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

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
