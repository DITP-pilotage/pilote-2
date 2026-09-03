import { extractReferences } from '@pilote/kpilote-shared/assistant/sources'
import { type Model, type Surface } from '@pilote/kpilote-shared/assistant/surfaces'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'

import { recordCall, recordConversation } from '@/assistant/commands/recordConversation'
import { buildSystemPrompt } from '@/assistant/prompts/buildSystemPrompt'
import {
  CONVERSATION_TEMPERATURE,
  createAssistantModel,
  MAX_STEPS,
} from '@/assistant/runtime/model'
import { resolveSources } from '@/assistant/runtime/resolveSources'
import { type Fetcher } from '@/assistant/tools/fetcher'
import { resolveTools } from '@/assistant/tools/registry'
import { runWithPrincipal, type Principal } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'
import { runWithDb } from '@/framework/persistence/dbStore'
import { prisma } from '@/framework/persistence/prisma'
import { startTimer } from '@/framework/timer'

/**
 * Rétablit explicitement les contextes ambiants.
 *
 * Les callbacks du flux s'exécutent APRÈS que le handler a rendu la `Response` et que la
 * chaîne de middlewares s'est dénouée. S'en remettre à la propagation de
 * l'AsyncLocalStorage jusque-là n'est pas garanti : on obtiendrait un `dbStore is empty`
 * ou un `UnauthorizedError` levés dans le flux, par intermittence.
 */
const inContext = <T>(principal: Principal, fn: () => Promise<T>): Promise<T> =>
  runWithDb(prisma, () => runWithPrincipal(principal, fn)) as Promise<T>

export const streamTurn = async ({
  surface,
  conversationId,
  principal,
  principalId,
  messages,
  model,
  fetcher,
  abortSignal,
}: {
  surface: Surface
  conversationId: string
  principal: Principal
  principalId: string
  messages: UIMessage[]
  model: Model
  fetcher: Fetcher
  abortSignal?: AbortSignal
}): Promise<Response> => {
  const elapsed = startTimer()

  const result = streamText({
    model: createAssistantModel(model),
    system: buildSystemPrompt({ surface, now: new Date() }),
    messages: await convertToModelMessages(messages),
    tools: resolveTools(surface, fetcher),
    stopWhen: stepCountIs(MAX_STEPS),
    temperature: CONVERSATION_TEMPERATURE,
    // `exactOptionalPropertyTypes` interdit de passer explicitement `undefined`.
    ...(abortSignal ? { abortSignal } : {}),
  })

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      writer.merge(result.toUIMessageStream())

      const steps = await result.steps
      const toolOutputs = steps.flatMap((step) =>
        step.toolResults.map((call) => call.output as unknown),
      )

      // Les sources sont dérivées de ce que les outils ont RÉELLEMENT renvoyé, pas citées
      // par le modèle : ni oubli ni invention possibles.
      const sources = await inContext(principal, () =>
        resolveSources(extractReferences(toolOutputs)),
      )
      if (sources.length > 0) writer.write({ type: 'data-sources', data: sources })

      const usage = await result.usage
      logger.info(
        {
          event: 'assistant.tour.done',
          conversationId,
          surface,
          model,
          durationMs: elapsed(),
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          tools: steps.flatMap((step) => step.toolCalls.map((call) => call.toolName)),
        },
        'Assistant — tour terminé',
      )
    },
    onFinish: async ({ messages: finalMessages }) => {
      const usage = await result.usage
      const transcript = await result.response
      await inContext(principal, async () => {
        // La conversation AVANT l'appel : assistant_appel.conversation_id la référence, la
        // contrainte de clé étrangère échouerait au premier tour dans l'autre ordre.
        await recordConversation({
          id: conversationId,
          principalId,
          surface,
          messages: finalMessages,
        })
        await recordCall({
          conversationId,
          principalId,
          model,
          surface,
          transcript,
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          dureeMs: elapsed(),
        })
      })
    },
  })

  return createUIMessageStreamResponse({ stream })
}
