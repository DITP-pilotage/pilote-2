import { type Model, type PageContext } from '@pilote/kpilote-shared/assistant/chat'
import { deriveTitle } from '@pilote/kpilote-shared/assistant/conversation'

import { NotFoundError } from '@/framework/errors/AppError'
import { type SubCallTrace } from '@/framework/llm/turnTrace'
import { db } from '@/framework/persistence/dbStore'
import { withinTransaction } from '@/framework/persistence/withTransaction'
import { type Prisma } from '@/generated/prisma/client'

// Aller-retour JSON : le sérialiseur de Prisma plante sur les schémas zod que le SDK
// attache aux parts d'outils.
const toPlainJson = (value: unknown): object => JSON.parse(JSON.stringify(value)) as object
const toPlainJsonArray = (values: ReadonlyArray<unknown>): Prisma.JsonArray =>
  JSON.parse(JSON.stringify(values)) as Prisma.JsonArray

const hasId = (message: unknown): message is { id: string; role?: unknown } =>
  typeof message === 'object' &&
  message !== null &&
  'id' in message &&
  typeof message.id === 'string'

/**
 * L'apport du tour (sa question et ce qui suit) reporté sur l'historique enregistré, qui a pu
 * avancer pendant le tour. Une relance reprend sa question et en remplace la suite ; une
 * nouvelle question s'ajoute à la fin.
 */
const mergeTurn = (stored: Prisma.JsonArray, messages: Prisma.JsonArray): Prisma.JsonArray => {
  const start = messages.findLastIndex((message) => hasId(message) && message.role === 'user')
  const turn = messages.slice(Math.max(start, 0))
  const question = turn[0]
  const replaced = hasId(question)
    ? stored.findIndex((message) => hasId(message) && message.id === question.id)
    : -1
  return [...(replaced === -1 ? stored : stored.slice(0, replaced)), ...turn]
}

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
  const blob = toPlainJsonArray(messages)
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
    // Verrouillée jusqu'à l'écriture : un tour concurrent attend et repart de cet état.
    await db()
      .$executeRaw`SELECT id FROM assistant_conversation WHERE id = ${conversationId}::uuid FOR UPDATE`
    // Cloisonnée au principal : un identifiant deviné ne doit pas écraser la conversation
    // d'un autre.
    const stored = await db().assistantConversation.findUnique({
      where: { id: conversationId, principalId },
      select: { messages: true },
    })
    if (!stored) {
      // Supprimée pendant le tour : la suppression l'emporte, rien n'est recréé.
      if (startedOnSavedConversation) return
      throw new NotFoundError('Conversation introuvable', { id: conversationId })
    }
    // Messages et appel en une écriture : un tour n'est jamais gardé sans son appel.
    await db().assistantConversation.update({
      where: { id: conversationId },
      data: {
        messages: mergeTurn(Array.isArray(stored.messages) ? stored.messages : [], blob),
        appels: { create: appel },
      },
      select: { id: true },
    })
  })
}
