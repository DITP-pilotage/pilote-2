import { createRoute, z } from '@hono/zod-openapi'
import { indicateurPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { planImportBodySchema } from '@pilote/kpilote-shared/valeurImport'
import { streamSSE } from 'hono/streaming'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { erreur400, erreur403, erreur404 } from '@/framework/openapi/responses'
import { buildPlanTransformation } from '@/valeurImport/buildPlanTransformation'
import { getImportContext } from '@/valeurImport/queries/getImportContext'

const params = z.object({ id: indicateurPublicIdSchema })

const planImportRoute = createRoute({
  method: 'post',
  path: '/indicateurs/{id}/valeurs:plan-import',
  tags: ['Indicateur'],
  summary: 'Construire le plan de transformation d’un fichier de valeurs',
  description:
    'Reçoit un fichier lu en tableau (en-têtes et lignes) qui ne suit pas le format standard, et ' +
    'construit avec l’assistant IA le plan qui dit comment le lire : rôle de chaque colonne, puis ' +
    'rapprochement de chaque libellé avec un individu ou une modalité. N’écrit rien en base : ' +
    'l’écriture reste `PUT /indicateurs/{id}/valeurs:batch`. La réponse est un flux SSE : chaque ' +
    'message porte un événement JSON (`PlanImportEvent`), les étapes au fil de l’eau puis un ' +
    'dernier événement `PLAN` ou `ECHEC`.',
  middleware: [requireAuthentication],
  request: {
    params,
    body: {
      content: { 'application/json': { schema: planImportBodySchema.openapi('PlanImportBody') } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'text/event-stream': { schema: z.string() } },
      description: 'Flux des étapes, terminé par le plan ou par l’échec.',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

export const valeurImportRoutes = createOpenApiHono()

valeurImportRoutes.openapi(planImportRoute, async (context) => {
  const { tableau, nomFichier } = context.req.valid('json')
  // Chargé avant d'ouvrir le flux : un 403 ou un 404 part avec son vrai statut.
  const importContext = await getImportContext({
    indicateurPublicId: context.req.valid('param').id,
  }).match((value) => value, never)

  return streamSSE(context, async (output) => {
    const events = buildPlanTransformation({
      context: importContext,
      tableau,
      nomFichier,
      abortSignal: context.req.raw.signal,
    })
    for await (const event of events) {
      await output.writeSSE({ data: JSON.stringify(event) })
    }
  })
})
