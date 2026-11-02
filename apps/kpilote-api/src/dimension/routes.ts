import { createRoute, z } from '@hono/zod-openapi'
import {
  dimensionApiModelSchema,
  dimensionListApiModelSchema,
  dimensionPublicIdSchema,
  listDimensionsQuerySchema,
  upsertDimensionBodySchema,
} from '@pilote/kpilote-shared/dimension'

import { upsertDimension } from '@/dimension/commands/upsertDimension'
import { getDimensionByPublicId } from '@/dimension/queries/getDimensionByPublicId'
import { listDimensions } from '@/dimension/queries/listDimensions'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur403, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'

const DimensionApiModelSchema = dimensionApiModelSchema.openapi('DimensionApiModel')
const DimensionListApiModelSchema = dimensionListApiModelSchema.openapi('DimensionListApiModel')
const UpsertDimensionBodySchema = upsertDimensionBodySchema.openapi('UpsertDimensionBody')

const paramsSchema = z.object({ id: dimensionPublicIdSchema })

// --- GET /dimensions ---------------------------------------------------------

const getDimensionsRoute = createRoute({
  method: 'get',
  path: '/dimensions',
  tags: ['Dimension'],
  summary: 'Lister les dimensions',
  description:
    "Retourne la liste paginée des dimensions d'observation (Territoire, Opérateur, Type de fraude…), " +
    'avec leurs niveaux (référentiels). Filtre `recherche` sur le nom, pagination cursor-based.',
  middleware: [requireAuthentication],
  request: { query: listDimensionsQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: DimensionListApiModelSchema } },
      description: 'Liste paginée des dimensions',
    },
    400: erreur400,
  },
})

// --- GET /dimensions/:id -----------------------------------------------------

const getDimensionByIdRoute = createRoute({
  method: 'get',
  path: '/dimensions/{id}',
  tags: ['Dimension'],
  summary: 'Récupérer une dimension par identifiant public',
  description: 'Retourne une dimension (format `DIM-<SLUG>`) et ses niveaux.',
  middleware: [requireAuthentication],
  request: { params: paramsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: DimensionApiModelSchema } },
      description: 'Dimension trouvée',
    },
    404: erreur404,
  },
})

// --- PUT /dimensions/:id -----------------------------------------------------

const upsertDimensionRoute = createRoute({
  method: 'put',
  path: '/dimensions/{id}',
  tags: ['Dimension', 'Admin'],
  summary: 'Créer ou mettre à jour une dimension',
  description:
    'Réservé aux clés API de rôle `ADMIN` et aux utilisateurs OIDC. Crée la dimension ou met à jour ' +
    'son nom et sa description. Les niveaux se rattachent via `PUT /referentiels/{id}` (champ ' +
    '`dimension`) ; les dimensions d’un indicateur se déclarent via `PUT /indicateurs/{id}`.',
  middleware: [requireAuthentication],
  request: {
    params: paramsSchema,
    body: {
      content: { 'application/json': { schema: UpsertDimensionBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DimensionApiModelSchema } },
      description: 'Dimension créée ou mise à jour',
    },
    400: erreur400,
    403: erreur403,
  },
})

// --- App registration --------------------------------------------------------

export const dimensionRoutes = createOpenApiHono()

dimensionRoutes.openapi(getDimensionsRoute, async (context) => {
  const query = context.req.valid('query')
  return listDimensions(query).match(
    (data) => jsonResponseOk({ context, data, schema: DimensionListApiModelSchema, status: 200 }),
    never,
  )
})

dimensionRoutes.openapi(getDimensionByIdRoute, async (context) => {
  const { id } = context.req.valid('param')
  return getDimensionByPublicId(id).match(
    (data) => jsonResponseOk({ context, data, schema: DimensionApiModelSchema, status: 200 }),
    never,
  )
})

dimensionRoutes.openapi(upsertDimensionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  return (
    await withTransaction(async () =>
      upsertDimension(id, body).andThen(() => getDimensionByPublicId(id)),
    )
  ).match(
    (data) => jsonResponseOk({ context, data, schema: DimensionApiModelSchema, status: 200 }),
    never,
  )
})
