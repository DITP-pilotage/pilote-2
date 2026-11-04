import { randomUUID } from 'node:crypto'

import { createRoute, z } from '@hono/zod-openapi'
import { chatRequestSchema } from '@pilote/kpilote-shared/assistant/chat'
import { rateBodySchema } from '@pilote/kpilote-shared/assistant/feedback'
import { convertToModelMessages, streamText, validateUIMessages } from 'ai'
import { bodyLimit } from 'hono/body-limit'

import { checkAssistantAccess } from '@/assistant/access'
import { buildAgent } from '@/assistant/agent'
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
  const messages = await validateUIMessages({ messages: [...history, body.message] })
  const llmCallId = randomUUID()

  const result = streamText({
    model: createAlbertModel(model),
    messages: await convertToModelMessages(messages, { tools: agent.tools }),
    ...agent,
    abortSignal: context.req.raw.signal,
  })

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
    onFinish: async ({ messages: finalMessages }) => {
      const [steps, usage, response, responseMessages] = await Promise.all([
        result.steps,
        result.totalUsage,
        result.response,
        result.responseMessages,
      ])
      const tools = steps.flatMap((step) => step.toolCalls.map((call) => call.toolName))
      const durationMs = elapsed()
      await runInContext(() =>
        recordTurn({
          conversationId: body.id,
          principalId,
          contexte: body.context ?? null,
          messages: finalMessages,
          call: {
            id: llmCallId,
            model,
            transcript: { ...response, messages: responseMessages },
            tools,
            inputTokens: usage.inputTokens ?? 0,
            outputTokens: usage.outputTokens ?? 0,
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
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          tools,
        },
        'Assistant — tour terminé',
      )
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
