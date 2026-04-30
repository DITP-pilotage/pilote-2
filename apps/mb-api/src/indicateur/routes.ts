import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  createPaginatedApiListSchema,
  errorApiModelSchema,
  indicateurApiModelSchema,
  indicateurStatutSchema,
} from '@pilote/mb-shared/api'

import { EntityNotFoundError } from '@/framework/errors/AppError'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { indicateursFixtures } from '@/indicateur/data/indicateursFixtures'

const IndicateurApiModelSchema = indicateurApiModelSchema.openapi('IndicateurApiModel')
const IndicateurListApiModelSchema = createPaginatedApiListSchema(
  indicateurApiModelSchema,
).openapi('IndicateurListApiModel')
export const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

/**
 * Pagination cursor (current implementation): the cursor is the last-seen
 * indicateur id, stringified. Items with `id > cursor` form the next page.
 * Demo-grade encoding while data is in-memory and sorted by id; should be
 * replaced by an opaque token (e.g. base64 of `{ id, version }`) when this
 * endpoint hits a real database.
 */
const PAGE_SIZE = 5

// --- GET /indicateurs --------------------------------------------------------

const listQuerySchema = z.object({
  recherche: z
    .string()
    .optional()
    .describe('Filtre case-insensitive sur le nom de l\'indicateur.'),
  statut: indicateurStatutSchema.optional().describe('Filtre exact par statut.'),
  cursor: z
    .string()
    .regex(/^\d+$/, 'Cursor doit être un identifiant numérique')
    .optional()
    .describe(
      'Cursor de pagination (renvoyé par la réponse précédente). Vide pour la première page.',
    ),
})

const getIndicateursRoute = createRoute({
  method: 'get',
  path: '/indicateurs',
  tags: ['Indicateur'],
  summary: 'Lister les indicateurs',
  description:
    'Retourne la liste paginée des indicateurs avec filtres combinables (recherche par nom, statut). La pagination est cursor-based : passez `cursor` (renvoyé dans la réponse précédente) pour obtenir la page suivante. `hasMore` indique s\'il reste des pages.',
  request: { query: listQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurListApiModelSchema } },
      description: 'Liste paginée des indicateurs',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
  },
})

// --- GET /indicateurs/:id ----------------------------------------------------

const detailParamsSchema = z.object({
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
    'Retourne un indicateur identifié par son id numérique. Renvoie 404 (`ENTITY_NOT_FOUND`) si aucun indicateur ne correspond.',
  request: { params: detailParamsSchema },
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

// --- App registration --------------------------------------------------------

export const indicateurRoutes = new OpenAPIHono()

indicateurRoutes.openapi(getIndicateursRoute, (context) => {
  const { recherche, statut, cursor } = context.req.valid('query')

  let filtered = indicateursFixtures
  if (recherche) {
    const searchTerm = recherche.toLowerCase()
    filtered = filtered.filter((indicateur) =>
      indicateur.nom.toLowerCase().includes(searchTerm),
    )
  }
  if (statut) {
    filtered = filtered.filter((indicateur) => indicateur.statut === statut)
  }

  const total = filtered.length
  const cursorId = cursor ? Number(cursor) : 0
  const remaining = filtered.filter((indicateur) => indicateur.id > cursorId)
  const paged = remaining.slice(0, PAGE_SIZE)
  const hasMore = remaining.length > paged.length
  const nextCursor =
    hasMore && paged.length > 0 ? String(paged[paged.length - 1]!.id) : null

  return jsonResponseOk({
    context,
    data: {
      items: paged,
      pagination: { cursor: nextCursor, hasMore },
      total,
    },
    schema: IndicateurListApiModelSchema,
    status: 200,
  })
})

indicateurRoutes.openapi(getIndicateurByIdRoute, (context) => {
  const { id } = context.req.valid('param')
  const found = indicateursFixtures.find((indicateur) => indicateur.id === id)

  if (!found) {
    throw new EntityNotFoundError('Indicateur introuvable', { id })
  }

  return jsonResponseOk({
    context,
    data: found,
    schema: IndicateurApiModelSchema,
    status: 200,
  })
})
