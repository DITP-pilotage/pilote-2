import { createRoute, z } from '@hono/zod-openapi'
import { indicateurPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { normaliserValeursImportResponseApiModelSchema } from '@pilote/kpilote-shared/valeurImport'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema } from '@/framework/openapi/responses'
import { normaliserValeursImport } from '@/valeurImport/commands/normaliserValeursImport'

const MAX_ROWS = 1000

const normaliserBodySchema = z.object({
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .min(1)
    .max(MAX_ROWS)
    .describe('Lignes brutes parsées côté client (clé = en-tête, valeur = cellule).'),
  nomFichier: z.string().max(255).describe('Nom du fichier source — contexte pour Albert.'),
})

const NormaliserBodySchema = normaliserBodySchema.openapi('NormaliserValeursImportBody')
const NormaliserResponseSchema = normaliserValeursImportResponseApiModelSchema.openapi(
  'NormaliserValeursImportResponse',
)

const normaliserRoute = createRoute({
  method: 'post',
  path: '/indicateurs/{id}/valeurs:normaliser',
  tags: ['Indicateur'],
  summary: 'Normaliser un fichier hétérogène vers le format batch (extraction assistée Albert)',
  description:
    "Reçoit les lignes brutes (CSV/Excel parsé côté client) d'un fichier qui ne respecte pas le " +
    'format standard `individu/date/valeur`, et utilise Albert en 2 passes (découverte de structure ' +
    "puis résolution des individus) pour produire des triplets normalisés. N'écrit rien en base : " +
    "l'écriture reste via `PUT /indicateurs/{id}/valeurs:batch`.",
  middleware: [requireAuthentication],
  request: {
    params: z.object({ id: indicateurPublicIdSchema }),
    body: {
      content: { 'application/json': { schema: NormaliserBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: NormaliserResponseSchema } },
      description: 'Triplets normalisés + résolution + warnings + rapport.',
    },
    422: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description:
        "Albert n'a pas su structurer le fichier (`PLAN_ECHEC`) ou résoudre les individus " +
        '(`RESOLUTION_ECHEC`).',
    },
    503: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Albert injoignable ou réponse non conforme (`ALBERT_UNAVAILABLE`).',
    },
  },
})

export const valeurImportRoutes = createOpenApiHono()

valeurImportRoutes.openapi(normaliserRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await normaliserValeursImport(id, {
    rows: body.rows,
    nomFichier: body.nomFichier,
  })

  return result.match(
    (data) => jsonResponseOk({ context, data, schema: NormaliserResponseSchema, status: 200 }),
    (error) => {
      if (error.type === 'PLAN_ECHEC') {
        return jsonResponseError({
          context,
          error: {
            code: 'PLAN_ECHEC',
            message: error.explication,
            details: { raison: error.raison, explication: error.explication },
          },
          schema: ErrorApiModelSchema,
          status: 422,
        })
      }
      if (error.type === 'RESOLUTION_ECHEC') {
        return jsonResponseError({
          context,
          error: {
            code: 'RESOLUTION_ECHEC',
            message: "Albert n'a pas fourni de mapping valide après plusieurs tentatives.",
          },
          schema: ErrorApiModelSchema,
          status: 422,
        })
      }
      return jsonResponseError({
        context,
        error: {
          code: error.type,
          message: 'Albert injoignable ou réponse non conforme.',
        },
        schema: ErrorApiModelSchema,
        status: 503,
      })
    },
  )
})
