import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  indicateurListApiModelSchema,
  indicateurStatutSchema,
} from '@pilote/mb-shared'

import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { indicateursFixtures } from '@/indicateur/data/indicateursFixtures'

const IndicateurListApiModelSchema = indicateurListApiModelSchema.openapi('IndicateurListApiModel')

const querySchema = z.object({
  recherche: z
    .string()
    .optional()
    .describe('Filtre case-insensitive sur le nom de l\'indicateur.'),
  statut: indicateurStatutSchema.optional().describe('Filtre exact par statut.'),
  cursor: z
    .string()
    .optional()
    .describe('Cursor de pagination (renvoyé par la réponse précédente). Vide pour la première page.'),
})

/**
 * Pagination cursor (current implementation): the cursor is simply the
 * last-seen indicateur id, stringified. Items with `id > cursor` form the
 * next page. This is intentional for the demo while data is in-memory and
 * sorted by id; it should be replaced by an opaque encoded token (e.g.
 * base64 of `{ id, version }`) when this endpoint hits a real database.
 */
const PAGE_SIZE = 5

const getIndicateursRoute = createRoute({
  method: 'get',
  path: '/indicateurs',
  tags: ['Indicateur'],
  summary: 'Lister les indicateurs',
  description:
    'Retourne la liste paginée des indicateurs avec filtres combinables (recherche par nom, statut). La pagination est cursor-based : passez `cursor` (renvoyé dans la réponse précédente) pour obtenir la page suivante. `hasMore` indique s\'il reste des pages.',
  request: { query: querySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurListApiModelSchema } },
      description: 'Liste paginée des indicateurs',
    },
  },
})

export const getIndicateurs = new OpenAPIHono()

getIndicateurs.openapi(getIndicateursRoute, (context) => {
  const { recherche, statut, cursor } = context.req.valid('query')

  let filtered = indicateursFixtures
  if (recherche) {
    const q = recherche.toLowerCase()
    filtered = filtered.filter((i) => i.nom.toLowerCase().includes(q))
  }
  if (statut) {
    filtered = filtered.filter((i) => i.statut === statut)
  }

  const total = filtered.length
  const cursorId = cursor ? Number(cursor) : 0
  const remaining = filtered.filter((i) => i.id > cursorId)
  const paged = remaining.slice(0, PAGE_SIZE)
  const hasMore = remaining.length > paged.length
  const nextCursor =
    hasMore && paged.length > 0 ? String(paged[paged.length - 1]!.id) : null

  const data = {
    items: paged,
    pagination: { cursor: nextCursor, hasMore },
    total,
  }

  return jsonResponseOk({
    context,
    data,
    schema: IndicateurListApiModelSchema,
    status: 200,
  })
})
