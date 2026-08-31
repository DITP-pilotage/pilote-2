import { createRoute, z } from '@hono/zod-openapi'
import { chatRequestSchema } from '@pilote/kpilote-shared/assistant/surfaces'
import { validateUIMessages } from 'ai'

import { MODELE_PAR_DEFAUT } from '@/assistant/runtime/modele'
import { streamerTour } from '@/assistant/runtime/AssistantRuntime'
import { creerRequeteur, type Requeteur } from '@/assistant/tools/requeteur'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { requireCurrentPrincipalId, requirePrincipal } from '@/framework/auth/userContext'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { erreur400 } from '@/framework/openapi/responses'

const ChatBodySchema = chatRequestSchema.openapi('AssistantChatBody')

const chatRoute = createRoute({
  method: 'post',
  path: '/assistant/chat',
  tags: ['Assistant'],
  summary: 'Ouvrir un tour de conversation avec l’assistant',
  description:
    "Streame la réponse de l'assistant au format UIMessage du SDK `ai` (flux SSE). La `surface` est déclarée par l'appelant et détermine la couche de prompt et les outils autorisés : le moteur ne déduit jamais l'intention du texte. Les sources consultées sont émises en fin de tour dans une part `data-sources`, dérivée des identifiants publics réellement renvoyés par les outils et refiltrée par les habilitations de l'appelant. Le paramètre `modele` permet de rejouer un même échange sur un autre modèle Albert.",
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
const requeteurDeLApp = async (jeton: string): Promise<Requeteur> => {
  const { app } = await import('../app')
  return creerRequeteur(app, jeton)
}

export const assistantRoutes = createOpenApiHono()

assistantRoutes.openapi(chatRoute, async (context) => {
  const corps = context.req.valid('json')
  const jeton = (context.req.header('authorization') ?? '').replace(/^Bearer\s+/iu, '')
  const messages = await validateUIMessages({ messages: corps.messages })

  return streamerTour({
    surface: corps.surface,
    conversationId: corps.conversationId,
    // Capturés MAINTENANT : les callbacks du flux tournent après le dénouement des middlewares.
    principal: requirePrincipal(),
    principalId: requireCurrentPrincipalId(),
    messages,
    modele: corps.modele ?? MODELE_PAR_DEFAUT,
    requeteur: await requeteurDeLApp(jeton),
    abortSignal: context.req.raw.signal,
  })
})
