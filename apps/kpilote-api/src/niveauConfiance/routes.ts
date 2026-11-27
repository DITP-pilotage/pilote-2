import { createRoute, z } from '@hono/zod-openapi'
import {
  creerNiveauConfianceBodySchema,
  derniersNiveauxConfianceListApiModelSchema,
  listDerniersNiveauxConfianceQuerySchema,
  modifierNiveauConfianceBodySchema,
} from '@pilote/kpilote-shared/niveauConfiance'

import {
  creerNiveauConfiance,
  type CreerNiveauConfianceError,
} from '@/niveauConfiance/commands/creerNiveauConfiance'
import { modifierNiveauConfiance } from '@/niveauConfiance/commands/modifierNiveauConfiance'
import { NiveauConfianceApiModelSchema, reponseNiveauConfiance } from '@/niveauConfiance/openapi'
import { listDerniersNiveauxConfiance } from '@/niveauConfiance/queries/listDerniersNiveauxConfiance'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema, erreur400, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'

export const niveauConfianceRoutes = createOpenApiHono()

const DerniersNiveauxConfianceListApiModelSchema =
  derniersNiveauxConfianceListApiModelSchema.openapi('DerniersNiveauxConfianceListApiModel')

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

// --- GET /derniers-niveaux-confiance -------------------------------------------

const listDerniersNiveauxConfianceRoute = createRoute({
  method: 'get',
  path: '/derniers-niveaux-confiance',
  tags: ['NiveauConfiance'],
  summary: "Lister le dernier niveau de confiance publié d'un lot d'indicateurs",
  description:
    'Retourne, pour chaque indicateur demandé accessible en lecture, l’indice du dernier ' +
    'commentaire CONFIANCE publié sur son individu lu. L’individu lu se résout comme pour ' +
    '`/dernieres-valeurs` : avec `individus`, le premier individu sélectionné dont le référentiel ' +
    'est lié à l’indicateur ; sans, l’individu racine de l’indicateur. Un individu sélectionné ' +
    'inconnu renvoie une 404. Les indicateurs sans individu lu, non accessibles, ou dont le ' +
    'dernier commentaire CONFIANCE publié ne porte pas de niveau, sont omis.',
  middleware: [requireAuthentication],
  request: {
    query: listDerniersNiveauxConfianceQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DerniersNiveauxConfianceListApiModelSchema } },
      description: 'Dernier niveau de confiance publié pour les indicateurs demandés',
    },
    400: erreur400,
    404: erreur404,
  },
})

niveauConfianceRoutes.openapi(listDerniersNiveauxConfianceRoute, async (context) =>
  listDerniersNiveauxConfiance({ query: context.req.valid('query') }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: DerniersNiveauxConfianceListApiModelSchema,
        status: 200,
      }),
    never,
  ),
)
