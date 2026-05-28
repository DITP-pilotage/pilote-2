import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import {
  listPaniersQuerySchema,
  panierApiModelSchema,
  panierListApiModelSchema,
  panierPublicIdSchema,
} from '@pilote/mb-shared/panier'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { getPanierByPublicId } from '@/panier/queries/getPanierByPublicId'
import { listPaniers } from '@/panier/queries/listPaniers'

const PanierApiModelSchema = panierApiModelSchema.openapi('PanierApiModel')
const PanierListApiModelSchema = panierListApiModelSchema.openapi('PanierListApiModel')
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

// --- GET /paniers ------------------------------------------------------------

const getPaniersRoute = createRoute({
  method: 'get',
  path: '/paniers',
  tags: ['Panier'],
  summary: "Lister les paniers d'indicateurs",
  description:
    "Retourne la liste paginée des paniers d'indicateurs. La pagination est cursor-based : passez `cursor` (renvoyé dans la réponse précédente) pour obtenir la page suivante. Chaque item inclut `indicateurIds`, triés par ordre d'insertion dans le panier (createdAt ASC de la jonction).",
  middleware: [requireAuthentication],
  request: { query: listPaniersQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: PanierListApiModelSchema } },
      description: 'Liste paginée des paniers',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
  },
})

// --- GET /paniers/:id --------------------------------------------------------

const detailParamsSchema = z.object({
  id: panierPublicIdSchema,
})

const getPanierByIdRoute = createRoute({
  method: 'get',
  path: '/paniers/{id}',
  tags: ['Panier'],
  summary: 'Récupérer un panier par identifiant public',
  description:
    "Retourne un panier identifié par son identifiant public (format `PAN-XXX`). La réponse inclut `indicateurIds` triés par ordre d'insertion (createdAt ASC de la jonction). Renvoie 404 (`ENTITY_NOT_FOUND`) si aucun panier ne correspond.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: PanierApiModelSchema } },
      description: 'Panier trouvé',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Panier introuvable',
    },
  },
})

// --- App registration --------------------------------------------------------

export const panierRoutes = new OpenAPIHono()

panierRoutes.openapi(getPaniersRoute, async (context) => {
  const { cursor, pageSize } = context.req.valid('query')

  return listPaniers({ cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: PanierListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

panierRoutes.openapi(getPanierByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getPanierByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: PanierApiModelSchema,
        status: 200,
      }),
    never,
  )
})
