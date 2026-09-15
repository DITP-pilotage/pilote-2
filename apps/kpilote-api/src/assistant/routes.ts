import { createRoute, z } from '@hono/zod-openapi'
import { rateBodySchema } from '@pilote/kpilote-shared/assistant/feedback'
import { chatRequestSchema } from '@pilote/kpilote-shared/assistant/surfaces'
import { validateUIMessages } from 'ai'

import { rateResponse } from '@/assistant/commands/rateResponse'
import { getConversationMessages } from '@/assistant/queries/getConversationMessages'
import { streamTurn } from '@/assistant/runtime/AssistantRuntime'
import { DEFAULT_MODEL } from '@/assistant/runtime/model'
import { createFetcher, type Fetcher } from '@/assistant/tools/fetcher'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { requireCurrentPrincipalId, requirePrincipal } from '@/framework/auth/userContext'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { erreur400, erreur404 } from '@/framework/openapi/responses'

const ChatBodySchema = chatRequestSchema.openapi('AssistantChatBody')

const chatRoute = createRoute({
  method: 'post',
  path: '/assistant/chat',
  tags: ['Assistant'],
  summary: "Ouvrir un tour de conversation avec l'assistant",
  description:
    "Streame la réponse de l'assistant au format UIMessage du SDK `ai` (flux SSE). La `surface` est déclarée par l'appelant et détermine la couche de prompt et les outils autorisés : le moteur ne déduit jamais l'intention du texte. Le serveur possède l'historique : il recharge la conversation par son identifiant et le principal appelant, y ajoute `message`, et rend 404 (`ENTITY_NOT_FOUND`) si la conversation appartient à quelqu'un d'autre. Les sources consultées sont émises en fin de tour dans une part `data-sources`, dérivée des identifiants publics réellement renvoyés par les outils et refiltrée par les habilitations de l'appelant. Le paramètre `model` permet de rejouer un même échange sur un autre modèle Albert.",
  middleware: [requireAuthentication],
  request: {
    body: { content: { 'application/json': { schema: ChatBodySchema } }, required: true },
  },
  responses: {
    200: {
      content: { 'text/event-stream': { schema: z.string() } },
      description: 'Flux de la réponse',
    },
    400: erreur400,
    404: erreur404,
  },
})

/**
 * L'app complète, résolue à la requête et non à l'import.
 *
 * `app.ts` enregistre ces routes AU CHARGEMENT du module (`app.route('/', assistantRoutes)`).
 * Un import statique de `../app` créerait donc un cycle dans lequel `assistantRoutes` vaut
 * encore `undefined` au moment de l'enregistrement — ce qui casse dès que ce fichier est le
 * point d'entrée, en test comme ailleurs. L'import dynamique est résolu au premier appel,
 * quand l'app est entièrement construite ; les modules ESM étant mis en cache, il ne coûte
 * rien aux appels suivants.
 */
const fetcherFromApp = async (token: string): Promise<Fetcher> => {
  const { app } = await import('../app')
  return createFetcher(app, token)
}

export const assistantRoutes = createOpenApiHono()

assistantRoutes.openapi(chatRoute, async (context) => {
  const body = context.req.valid('json')
  const token = (context.req.header('authorization') ?? '').replace(/^Bearer\s+/iu, '')
  // Capturés MAINTENANT : les callbacks du flux tournent après le dénouement des middlewares.
  const principal = requirePrincipal()
  const principalId = requireCurrentPrincipalId()

  const history = await getConversationMessages({ id: body.conversationId, principalId })
  const messages = await validateUIMessages({ messages: [...history, body.message] })

  return streamTurn({
    surface: body.surface,
    conversationId: body.conversationId,
    principal,
    principalId,
    messages,
    model: body.model ?? DEFAULT_MODEL,
    fetcher: await fetcherFromApp(token),
    abortSignal: context.req.raw.signal,
  })
})

const rateRoute = createRoute({
  method: 'post',
  path: '/assistant/conversations/{id}/evaluation',
  tags: ['Assistant'],
  summary: "Évaluer la dernière réponse de l'assistant",
  description:
    "Enregistre un retour utilisateur sur le dernier tour de la conversation. Un retour négatif exige au moins une catégorie de problème ; la catégorie `AUTRE` exige en plus un commentaire non vide. Sans conversation ni tour correspondant, l'appel reste en 204 : le retour est une donnée d'amélioration, pas une opération métier dont l'échec doit remonter.",
  middleware: [requireAuthentication],
  request: {
    params: z.object({ id: z.uuid() }),
    body: {
      content: {
        'application/json': { schema: rateBodySchema.openapi('AssistantRateBody') },
      },
      required: true,
    },
  },
  responses: {
    204: { description: 'Retour enregistré' },
    400: erreur400,
  },
})

assistantRoutes.openapi(rateRoute, async (context) => {
  await rateResponse({
    conversationId: context.req.valid('param').id,
    body: context.req.valid('json'),
  })
  return context.body(null, 204)
})
