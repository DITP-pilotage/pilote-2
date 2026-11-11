import { randomUUID } from 'node:crypto'

import { createRoute, z } from '@hono/zod-openapi'
import { chatRequestSchema } from '@pilote/kpilote-shared/assistant/chat'
import {
  conversationListSchema,
  conversationSchema,
} from '@pilote/kpilote-shared/assistant/conversation'
import { rateBodySchema } from '@pilote/kpilote-shared/assistant/feedback'
import { convertToModelMessages, streamText, validateUIMessages } from 'ai'
import { bodyLimit } from 'hono/body-limit'

import { checkAssistantAccess } from '@/assistant/access'
import { buildAgent } from '@/assistant/agent'
import {
  deleteConversation,
  getConversation,
  listConversations,
} from '@/assistant/persistence/conversations'
import { getConversationMessages } from '@/assistant/persistence/getConversationMessages'
import { rateCall } from '@/assistant/persistence/rateCall'
import { recordTurn } from '@/assistant/persistence/recordTurn'
import { toLoggableError } from '@/assistant/tools/registry'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { requireCurrentPrincipalId, requirePrincipal } from '@/framework/auth/userContext'
import { captureContext } from '@/framework/context/captureContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { createAlbertModel, DEFAULT_MODEL } from '@/framework/llm/albert'
import { TurnTrace } from '@/framework/llm/turnTrace'
import { logger } from '@/framework/logger/logger'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { erreur400, erreur403, erreur404, succes200 } from '@/framework/openapi/responses'
import { startTimer } from '@/framework/timer'

const MAX_BODY_BYTES = 32 * 1024
const MAX_RATE_BODY_BYTES = 8 * 1024

const STREAM_ERROR_MESSAGE = "L'assistant a rencontré une erreur. Réessayez dans un instant."

const hasId = (message: unknown): message is { id: string } =>
  typeof message === 'object' &&
  message !== null &&
  'id' in message &&
  typeof message.id === 'string'

/**
 * Un message déjà présent est une relance (« Réessayer ») : le tour repart de ce message,
 * sans le dupliquer ni garder la réponse qu'il avait reçue.
 */
const historyBefore = (history: unknown[], messageId: string): unknown[] => {
  const index = history.findIndex((message) => hasId(message) && message.id === messageId)
  return index === -1 ? history : history.slice(0, index)
}

// Un tour arrêté ou en échec rejette ces promesses : on persiste ce qu'on a.
const settled = <T, F>(promise: PromiseLike<T>, fallback: F): Promise<T | F> =>
  Promise.resolve(promise).catch(() => fallback)

const requireAssistantAccess = (): void => {
  if (!checkAssistantAccess(requirePrincipal())) {
    throw new ForbiddenError("L'assistant est réservé aux utilisateurs autorisés.")
  }
}

const chatRoute = createRoute({
  method: 'post',
  path: '/assistant/chat',
  tags: ['Assistant'],
  summary: "Ouvrir un tour de conversation avec l'assistant",
  description:
    "Streame la réponse de l'assistant au format UIMessage du SDK `ai` (flux SSE). Le serveur possède l'historique : il relit la conversation par son identifiant et le principal appelant, y ajoute `message` (une question de l'utilisateur, en texte), et rend 404 si la conversation appartient à quelqu'un d'autre. Le contexte de page ne porte que des identifiants, nommés et filtrés par le serveur. L'identifiant de l'appel (`llmCallId`) arrive dans les métadonnées du message ; il sert à l'évaluation.",
  middleware: [requireAuthentication, bodyLimit({ maxSize: MAX_BODY_BYTES })],
  request: {
    body: {
      content: { 'application/json': { schema: chatRequestSchema.openapi('AssistantChatBody') } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'text/event-stream': { schema: z.string() } },
      description: 'Flux de la réponse',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

const accessRoute = createRoute({
  method: 'get',
  path: '/assistant/acces',
  tags: ['Assistant'],
  summary: "Savoir si l'utilisateur a accès à l'assistant",
  description:
    "Indique si le principal appelant peut utiliser l'assistant. Les clés API n'y ont pas accès.",
  middleware: [requireAuthentication],
  responses: {
    200: succes200(
      "Accès à l'assistant",
      z.object({ allowed: z.boolean() }).openapi('AssistantAccess'),
    ),
  },
})

const rateRoute = createRoute({
  method: 'post',
  path: '/assistant/appels/{id}/evaluation',
  tags: ['Assistant'],
  summary: "Évaluer une réponse de l'assistant",
  description:
    "Enregistre un retour sur l'appel désigné par son `llmCallId`. Un retour négatif exige au moins une catégorie ; `AUTRE` exige un commentaire. Un appel inconnu ou appartenant à un autre principal est ignoré, sans erreur.",
  middleware: [requireAuthentication, bodyLimit({ maxSize: MAX_RATE_BODY_BYTES })],
  request: {
    params: z.object({ id: z.uuid() }),
    body: {
      content: { 'application/json': { schema: rateBodySchema.openapi('AssistantRateBody') } },
      required: true,
    },
  },
  responses: {
    204: { description: 'Retour enregistré' },
    400: erreur400,
    403: erreur403,
  },
})

const conversationParams = z.object({ id: z.uuid() })

const listConversationsRoute = createRoute({
  method: 'get',
  path: '/assistant/conversations',
  tags: ['Assistant'],
  summary: 'Lister ses conversations avec l’assistant',
  description:
    'Les conversations du principal appelant, des plus récentes aux plus anciennes, sans leurs messages.',
  middleware: [requireAuthentication],
  responses: {
    200: succes200('Conversations', conversationListSchema.openapi('AssistantConversationList')),
    403: erreur403,
  },
})

const getConversationRoute = createRoute({
  method: 'get',
  path: '/assistant/conversations/{id}',
  tags: ['Assistant'],
  summary: 'Lire une conversation avec l’assistant',
  description:
    'Une conversation du principal appelant avec ses messages. Celle d’un autre principal rend 404.',
  middleware: [requireAuthentication],
  request: { params: conversationParams },
  responses: {
    200: succes200('Conversation', conversationSchema.openapi('AssistantConversation')),
    403: erreur403,
    404: erreur404,
  },
})

const deleteConversationRoute = createRoute({
  method: 'delete',
  path: '/assistant/conversations/{id}',
  tags: ['Assistant'],
  summary: 'Supprimer une conversation avec l’assistant',
  description:
    'Supprime une conversation du principal appelant, avec ses appels et leurs évaluations. Celle d’un autre principal rend 404.',
  middleware: [requireAuthentication],
  request: { params: conversationParams },
  responses: {
    204: { description: 'Conversation supprimée' },
    403: erreur403,
    404: erreur404,
  },
})

export const assistantRoutes = createOpenApiHono()

assistantRoutes.openapi(chatRoute, async (context) => {
  requireAssistantAccess()
  const body = context.req.valid('json')
  const principalId = requireCurrentPrincipalId()
  const model = body.model ?? DEFAULT_MODEL
  const elapsed = startTimer()

  const history = await getConversationMessages({ id: body.id, principalId })
  // Capturés maintenant : outils et callbacks du flux s'exécutent après les middlewares.
  const runInContext = captureContext()
  const trace = new TurnTrace()
  const agent = await buildAgent({ pageContext: body.context, model, trace, runInContext })
  // L'historique vient de la base et le nouveau message est validé par le schéma de la
  // requête : seul un texte utilisateur peut entrer.
  const messages = await validateUIMessages({
    messages: [...historyBefore(history, body.message.id), body.message],
  })
  const llmCallId = randomUUID()

  const result = streamText({
    model: createAlbertModel(model),
    messages: await convertToModelMessages(messages, { tools: agent.tools }),
    ...agent,
    abortSignal: context.req.raw.signal,
    // L'erreur est journalisée assainie par `onError` de la réponse ; le défaut du SDK
    // l'écrirait entière, prompt compris, dans la console.
    onError: () => undefined,
  })

  // Rattachés dès maintenant : un tour en échec rejette ces promesses avant `onFinish`, et
  // un rejet sans gestionnaire ferait tomber le processus.
  const outcome = Promise.all([
    settled(result.steps, []),
    settled(result.totalUsage, null),
    settled(result.response, null),
    settled(result.responseMessages, []),
  ])

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    messageMetadata: ({ part }) => (part.type === 'start' ? { llmCallId } : undefined),
    onError: (error) => {
      logger.error(
        { event: 'assistant.tour.erreur', llmCallId, err: toLoggableError(error) },
        'Assistant — erreur pendant le tour',
      )
      return STREAM_ERROR_MESSAGE
    },
    onFinish: async ({ messages: finalMessages, isAborted }) => {
      try {
        const [steps, usage, response, responseMessages] = await outcome
        const tools = steps.flatMap((step) => step.toolCalls.map((call) => call.toolName))
        const durationMs = elapsed()
        const inputTokens = usage?.inputTokens ?? 0
        const outputTokens = usage?.outputTokens ?? 0
        await runInContext(() =>
          recordTurn({
            conversationId: body.id,
            principalId,
            startedOnSavedConversation: history.length > 0,
            contexte: body.context ?? null,
            messages: finalMessages,
            call: {
              id: llmCallId,
              model,
              transcript: { ...response, messages: responseMessages },
              tools,
              inputTokens,
              outputTokens,
              durationMs,
              subCalls: trace.entries(),
            },
          }),
        )
        logger.info(
          {
            event: 'assistant.tour.done',
            conversationId: body.id,
            llmCallId,
            model,
            durationMs,
            inputTokens,
            outputTokens,
            tools,
            isAborted,
          },
          'Assistant — tour terminé',
        )
      } catch (error) {
        logger.error(
          { event: 'assistant.tour.persistance', llmCallId, err: toLoggableError(error) },
          'Assistant — tour non persisté',
        )
      }
    },
  })
})

assistantRoutes.openapi(accessRoute, (context) =>
  context.json({ allowed: checkAssistantAccess(requirePrincipal()) }, 200),
)

assistantRoutes.openapi(rateRoute, async (context) => {
  requireAssistantAccess()
  await rateCall({ callId: context.req.valid('param').id, body: context.req.valid('json') })
  return context.body(null, 204)
})

assistantRoutes.openapi(listConversationsRoute, async (context) => {
  requireAssistantAccess()
  return context.json({ items: await listConversations(requireCurrentPrincipalId()) }, 200)
})

assistantRoutes.openapi(getConversationRoute, async (context) => {
  requireAssistantAccess()
  const conversation = await getConversation({
    id: context.req.valid('param').id,
    principalId: requireCurrentPrincipalId(),
  })
  return context.json(conversation, 200)
})

assistantRoutes.openapi(deleteConversationRoute, async (context) => {
  requireAssistantAccess()
  await deleteConversation({
    id: context.req.valid('param').id,
    principalId: requireCurrentPrincipalId(),
  })
  return context.body(null, 204)
})
