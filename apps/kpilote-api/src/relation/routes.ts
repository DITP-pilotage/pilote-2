import { createRoute } from '@hono/zod-openapi'
import { createPaginatedApiListSchema } from '@pilote/kpilote-shared/pagination'
import { listRelationsQuerySchema, relationApiModelSchema } from '@pilote/kpilote-shared/relation'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400 } from '@/framework/openapi/responses'
import { listRelations } from '@/relation/queries/listRelations'

const RelationListApiModelSchema =
  createPaginatedApiListSchema(relationApiModelSchema).openapi('RelationListApiModel')

// --- GET /relations ----------------------------------------------------------

const getRelationsRoute = createRoute({
  method: 'get',
  path: '/relations',
  tags: ['Relation'],
  summary: 'Lister les relations parent/enfant entre individus',
  description:
    "Retourne la liste paginée des relations hiérarchiques entre individus, triée par nom de l'individu enfant. Un individu a au plus un parent : l'enfant identifie donc la relation. Filtre optionnel `recherche` sur le nom de l'enfant. Pagination cursor-based.",
  middleware: [requireAuthentication],
  request: { query: listRelationsQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: RelationListApiModelSchema } },
      description: 'Liste paginée des relations',
    },
    400: erreur400,
  },
})

// --- App registration --------------------------------------------------------

export const relationRoutes = createOpenApiHono()

relationRoutes.openapi(getRelationsRoute, async (context) => {
  const { recherche, cursor, pageSize } = context.req.valid('query')

  return listRelations({ recherche, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: RelationListApiModelSchema,
        status: 200,
      }),
    never,
  )
})
