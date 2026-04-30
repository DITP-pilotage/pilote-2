import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { indicateurListAPISchema, indicateurStatutSchema } from '@pilote/mb-shared'

import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { indicateursFixtures } from '@/indicateur/data/indicateursFixtures'

const IndicateurListSchema = indicateurListAPISchema.openapi('IndicateurList')

const querySchema = z.object({
  recherche: z.string().optional(),
  statut: indicateurStatutSchema.optional(),
  cursor: z.string().optional(),
})

/**
 * Pagination cursor (current implementation): the cursor is simply the
 * last-seen indicateur id, stringified. Items with `id > cursor` form the
 * next page. This is intentional for the demo while data is in-memory and
 * sorted by id; it should be replaced by an opaque encoded token (e.g.
 * base64 of `{ id, version }`) when this endpoint hits a real database.
 *
 * `PAGE_SIZE` is intentionally small to force real pagination behaviour
 * with the 8 in-memory fixtures (yields 2 pages).
 */
const PAGE_SIZE = 5

const getIndicateursRoute = createRoute({
  method: 'get',
  path: '/indicateurs',
  tags: ['Indicateur'],
  summary: 'Lister les indicateurs',
  request: { query: querySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurListSchema } },
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
    schema: IndicateurListSchema,
    status: 200,
  })
})
