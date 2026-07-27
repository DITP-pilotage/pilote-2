import { createRoute, z } from '@hono/zod-openapi'
import { createPaginatedApiListSchema } from '@pilote/kpilote-shared/pagination'
import { individuPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import {
  listRelationsQuerySchema,
  relationApiModelSchema,
  upsertRelationBodySchema,
} from '@pilote/kpilote-shared/relation'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema, erreur400, erreur403, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { supprimerRelation } from '@/relation/commands/supprimerRelation'
import { upsertRelationParent } from '@/relation/commands/upsertRelationParent'
import { getRelationByEnfant } from '@/relation/queries/getRelationByEnfant'
import { listRelations } from '@/relation/queries/listRelations'

const RelationApiModelSchema = relationApiModelSchema.openapi('RelationApiModel')
const RelationListApiModelSchema =
  createPaginatedApiListSchema(relationApiModelSchema).openapi('RelationListApiModel')
const UpsertRelationBodySchema = upsertRelationBodySchema.openapi('UpsertRelationBody')

const detailParamsSchema = z.object({
  id: individuPublicIdSchema,
})

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

// --- PUT /relations/:id ------------------------------------------------------

const upsertRelationRoute = createRoute({
  method: 'put',
  path: '/relations/{id}',
  tags: ['Relation', 'Admin'],
  summary: "Définir le parent d'un individu",
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). `id` est l'identifiant public de l'individu **enfant** : un individu a au plus un parent, l'enfant identifie donc la relation. Crée la relation si l'enfant n'en a pas, remplace son parent sinon. Opération idempotente, exécutée dans une transaction. Rejetée si le parent est l'individu lui-même (`AUTO_PARENT`) ou l'un de ses descendants (`CYCLE_DETECTE`).",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertRelationBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: RelationApiModelSchema } },
      description: 'Relation créée ou mise à jour',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

// --- DELETE /relations/:id ---------------------------------------------------

const supprimerRelationRoute = createRoute({
  method: 'delete',
  path: '/relations/{id}',
  tags: ['Relation', 'Admin'],
  summary: "Supprimer le parent d'un individu",
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). `id` est l'identifiant public de l'individu **enfant**. Idempotent : retourne `204` même si l'individu n'avait pas de parent.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    204: { description: 'Relation supprimée' },
    403: erreur403,
  },
})

const MESSAGES_ERREUR: Record<'AUTO_PARENT' | 'CYCLE_DETECTE', string> = {
  AUTO_PARENT: 'Un individu ne peut pas être son propre parent',
  CYCLE_DETECTE:
    "Le parent choisi est un descendant de l'individu : la hiérarchie formerait un cycle",
}

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

relationRoutes.openapi(upsertRelationRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  return (
    await withTransaction(async () =>
      upsertRelationParent(id, body).andThen(() => getRelationByEnfant(id)),
    )
  ).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: RelationApiModelSchema,
        status: 200,
      }),
    (error) =>
      jsonResponseError({
        context,
        error: { code: error.type, message: MESSAGES_ERREUR[error.type] },
        schema: ErrorApiModelSchema,
        status: 400,
      }),
  )
})

relationRoutes.openapi(supprimerRelationRoute, async (context) => {
  const { id } = context.req.valid('param')

  return (await supprimerRelation(id)).match(() => context.body(null, 204), never)
})
