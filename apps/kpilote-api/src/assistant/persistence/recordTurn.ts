import { type Model, type PageContext } from '@pilote/kpilote-shared/assistant/chat'
import { deriveTitle } from '@pilote/kpilote-shared/assistant/conversation'

import { NotFoundError } from '@/framework/errors/AppError'
import { type SubCallTrace } from '@/framework/llm/turnTrace'
import { db } from '@/framework/persistence/dbStore'
import { withinTransaction } from '@/framework/persistence/withTransaction'
import { Prisma } from '@/generated/prisma/client'

// Aller-retour JSON : le sérialiseur de Prisma plante sur les schémas zod que le SDK
// attache aux parts d'outils.
const toPlainJson = (value: unknown): object => JSON.parse(JSON.stringify(value)) as object

export type RecordedCall = {
  id: string
  model: Model
  transcript: unknown
  tools: string[]
  inputTokens: number
  outputTokens: number
  durationMs: number
  subCalls: ReadonlyArray<SubCallTrace>
}

export const recordTurn = async ({
  conversationId,
  principalId,
  startedOnSavedConversation,
  contexte,
  messages,
  call,
}: {
  conversationId: string
  principalId: string
  /** Le tour reprenait une conversation enregistrée : absente à la fin, elle a été supprimée. */
  startedOnSavedConversation: boolean
  contexte: PageContext | null
  messages: ReadonlyArray<unknown>
  call: RecordedCall
}): Promise<void> => {
  const blob = toPlainJson(messages)
  const appel = {
    id: call.id,
    principalId,
    modele: call.model,
    transcript: toPlainJson(call.transcript),
    outils: call.tools,
    inputTokens: call.inputTokens,
    outputTokens: call.outputTokens,
    dureeMs: call.durationMs,
    sousAppels: {
      create: call.subCalls.map((subCall) => ({
        nom: subCall.name,
        modele: subCall.model,
        inputTokens: subCall.inputTokens,
        outputTokens: subCall.outputTokens,
        dureeMs: subCall.durationMs,
      })),
    },
  }

  await withinTransaction(async () => {
    if (!startedOnSavedConversation) {
      // Premier tour : deux envois simultanés (double clic) ne se gênent pas, le second
      // trouve la conversation déjà créée.
      await db().assistantConversation.createMany({
        data: [
          {
            id: conversationId,
            principalId,
            titre: deriveTitle(messages),
            messages: blob,
            ...(contexte ? { contexte } : {}),
          },
        ],
        skipDuplicates: true,
      })
    }
    try {
      // Messages et appel en une écriture : un tour n'est jamais gardé sans son appel.
      // Cloisonnée au principal : un identifiant deviné ne doit pas écraser la conversation
      // d'un autre.
      await db().assistantConversation.update({
        where: { id: conversationId, principalId },
        data: { messages: blob, appels: { create: appel } },
        select: { id: true },
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')) {
        throw error
      }
      // Supprimée pendant le tour : la suppression l'emporte, rien n'est recréé.
      if (startedOnSavedConversation) return
      throw new NotFoundError('Conversation introuvable', { id: conversationId })
    }
  })
}
