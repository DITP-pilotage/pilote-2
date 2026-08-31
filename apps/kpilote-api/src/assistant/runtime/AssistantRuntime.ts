import { extraireReferences } from '@pilote/kpilote-shared/assistant/sources'
import { type Modele, type Surface } from '@pilote/kpilote-shared/assistant/surfaces'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'

import {
  enregistrerAppel,
  enregistrerConversation,
} from '@/assistant/commands/enregistrerConversation'
import { construireSystemPrompt } from '@/assistant/prompts/construireSystemPrompt'
import {
  creerModeleAssistant,
  MAX_ETAPES,
  TEMPERATURE_CONVERSATION,
} from '@/assistant/runtime/modele'
import { resoudreSources } from '@/assistant/runtime/sources'
import { resoudreOutils } from '@/assistant/tools/registry'
import { type Requeteur } from '@/assistant/tools/requeteur'
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
const dansLeContexte = <T>(principal: Principal, fn: () => Promise<T>): Promise<T> =>
  runWithDb(prisma, () => runWithPrincipal(principal, fn)) as Promise<T>

export const streamerTour = async ({
  surface,
  conversationId,
  principal,
  principalId,
  messages,
  modele,
  requeteur,
  abortSignal,
}: {
  surface: Surface
  conversationId: string
  principal: Principal
  principalId: string
  messages: UIMessage[]
  modele: Modele
  requeteur: Requeteur
  abortSignal?: AbortSignal
}): Promise<Response> => {
  const elapsed = startTimer()

  const resultat = streamText({
    model: creerModeleAssistant(modele),
    system: construireSystemPrompt({ surface, maintenant: new Date() }),
    messages: await convertToModelMessages(messages),
    tools: resoudreOutils(surface, requeteur),
    stopWhen: stepCountIs(MAX_ETAPES),
    temperature: TEMPERATURE_CONVERSATION,
    // `exactOptionalPropertyTypes` interdit de passer explicitement `undefined`.
    ...(abortSignal ? { abortSignal } : {}),
  })

  const flux = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      writer.merge(resultat.toUIMessageStream())

      const etapes = await resultat.steps
      const sortiesOutils = etapes.flatMap((etape) =>
        etape.toolResults.map((appel) => appel.output as unknown),
      )

      // Les sources sont dérivées de ce que les outils ont RÉELLEMENT renvoyé, pas citées
      // par le modèle : ni oubli ni invention possibles.
      const sources = await dansLeContexte(principal, () =>
        resoudreSources(extraireReferences(sortiesOutils)),
      )
      if (sources.length > 0) writer.write({ type: 'data-sources', data: sources })

      const usage = await resultat.usage
      logger.info(
        {
          event: 'assistant.tour.done',
          conversationId,
          surface,
          modele,
          durationMs: elapsed(),
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          outils: etapes.flatMap((etape) => etape.toolCalls.map((appel) => appel.toolName)),
        },
        'Assistant — tour terminé',
      )
    },
    onFinish: async ({ messages: messagesFinaux }) => {
      const usage = await resultat.usage
      const transcript = await resultat.response
      await dansLeContexte(principal, async () => {
        // La conversation AVANT l'appel : assistant_appel.conversation_id la référence, la
        // contrainte de clé étrangère échouerait au premier tour dans l'autre ordre.
        await enregistrerConversation({
          id: conversationId,
          principalId,
          surface,
          messages: messagesFinaux,
        })
        await enregistrerAppel({
          conversationId,
          principalId,
          modele,
          surface,
          transcript,
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          dureeMs: elapsed(),
        })
      })
    },
  })

  return createUIMessageStreamResponse({ stream: flux })
}
