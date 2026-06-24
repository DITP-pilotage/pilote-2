import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  creerNiveauConfianceBodySchema,
  modifierNiveauConfianceBodySchema,
} from '@pilote/mb-shared/niveauConfiance'

import { creerNiveauConfiance } from '@/niveauConfiance/commands/creerNiveauConfiance'
import { modifierNiveauConfiance } from '@/niveauConfiance/commands/modifierNiveauConfiance'
import { NiveauConfianceApiModelSchema, reponseNiveauConfiance } from '@/niveauConfiance/openapi'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'

export const niveauConfianceRoutes = new OpenAPIHono()

// --- POST /niveau-confiance --------------------------------------------------

const creerRoute = createRoute({
  method: 'post',
  path: '/niveau-confiance',
  tags: ['NiveauConfiance'],
  summary: 'Créer un niveau de confiance sur un commentaire CONFIANCE',
  middleware: [requireAuthentication],
  request: {
    body: {
      content: { 'application/json': { schema: creerNiveauConfianceBodySchema } },
      required: true,
    },
  },
  responses: reponseNiveauConfiance,
})

niveauConfianceRoutes.openapi(creerRoute, async (context) => {
  const body = context.req.valid('json')
  const result = await withTransaction(async () => creerNiveauConfiance(body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
    never,
  )
})

// --- PUT /niveau-confiance/{niveauConfianceId} -------------------------------

const modifierRoute = createRoute({
  method: 'put',
  path: '/niveau-confiance/{niveauConfianceId}',
  tags: ['NiveauConfiance'],
  summary: 'Modifier l’indice d’un niveau de confiance (auteur uniquement)',
  middleware: [requireAuthentication],
  request: {
    params: z.object({ niveauConfianceId: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: modifierNiveauConfianceBodySchema } },
      required: true,
    },
  },
  responses: reponseNiveauConfiance,
})

niveauConfianceRoutes.openapi(modifierRoute, async (context) => {
  const { niveauConfianceId } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => modifierNiveauConfiance(niveauConfianceId, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
    never,
  )
})
