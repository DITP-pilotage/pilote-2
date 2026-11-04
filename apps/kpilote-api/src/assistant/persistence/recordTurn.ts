import { type Model, type PageContext } from '@pilote/kpilote-shared/assistant/chat'
import { deriveTitle } from '@pilote/kpilote-shared/assistant/conversation'

import { NotFoundError } from '@/framework/errors/AppError'
import { type SubCallTrace } from '@/framework/llm/turnTrace'
import { db } from '@/framework/persistence/dbStore'

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
  // Mise à jour cloisonnée au principal : un identifiant deviné ne doit pas écraser la
  // conversation d'un autre. Zéro ligne touchée = premier tour, sauf si l'id est pris.
  const { count } = await db().assistantConversation.updateMany({
    where: { id: conversationId, principalId },
    data: { messages: blob },
  })
  if (count === 0) {
    // Supprimée pendant le tour : la suppression l'emporte, rien n'est recréé.
    if (startedOnSavedConversation) return
    const taken = await db().assistantConversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    })
    if (taken) throw new NotFoundError('Conversation introuvable', { id: conversationId })
    await db().assistantConversation.create({
      data: {
        id: conversationId,
        principalId,
        titre: deriveTitle(messages),
        messages: blob,
        ...(contexte ? { contexte } : {}),
      },
    })
  }

  await db().assistantAppel.create({
    data: {
      id: call.id,
      conversationId,
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
    },
  })
}
