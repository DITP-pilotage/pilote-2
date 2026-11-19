import { createRoute, z } from '@hono/zod-openapi'
import {
  creerNiveauConfianceBodySchema,
  modifierNiveauConfianceBodySchema,
} from '@pilote/kpilote-shared/niveauConfiance'

import {
  creerNiveauConfiance,
  type CreerNiveauConfianceError,
} from '@/niveauConfiance/commands/creerNiveauConfiance'
import { modifierNiveauConfiance } from '@/niveauConfiance/commands/modifierNiveauConfiance'
import { NiveauConfianceApiModelSchema, reponseNiveauConfiance } from '@/niveauConfiance/openapi'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'

export const niveauConfianceRoutes = createOpenApiHono()

// --- POST /niveau-confiance --------------------------------------------------

const creerRoute = createRoute({
  method: 'post',
  path: '/niveaux-confiance',
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

const describeCreerNiveauConfianceError = (
  error: CreerNiveauConfianceError,
): { status: 400; message: string; details?: Record<string, unknown> } => {
  switch (error.type) {
    case 'COMMENTAIRE_PAS_CONFIANCE':
      return { status: 400, message: 'Le commentaire ciblé n’est pas de type CONFIANCE' }
  }
}

niveauConfianceRoutes.openapi(creerRoute, async (context) => {
  const body = context.req.valid('json')
  return withTransaction(() => creerNiveauConfiance(body)).match(
    (data) => jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
    (error) => {
      const { status, message, details } = describeCreerNiveauConfianceError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

// --- PUT /niveau-confiance/{niveauConfianceId} -------------------------------

const modifierRoute = createRoute({
  method: 'put',
  path: '/niveaux-confiance/{niveauConfianceId}',
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
  return withTransaction(() => modifierNiveauConfiance(niveauConfianceId, body)).match(
    (data) => jsonResponseOk({ context, data, schema: NiveauConfianceApiModelSchema, status: 200 }),
    never,
  )
})
