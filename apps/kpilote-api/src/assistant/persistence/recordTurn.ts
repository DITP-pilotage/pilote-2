import { type Model, type PageContext } from '@pilote/kpilote-shared/assistant/chat'

import { NotFoundError } from '@/framework/errors/AppError'
import { type SubCallTrace } from '@/framework/llm/turnTrace'
import { db } from '@/framework/persistence/dbStore'

const MAX_TITLE_LENGTH = 80

const isTextPart = (part: unknown): part is { type: 'text'; text: string } =>
  typeof part === 'object' &&
  part !== null &&
  'type' in part &&
  part.type === 'text' &&
  'text' in part &&
  typeof part.text === 'string'

/** Premier message utilisateur, tronqué : de quoi retrouver une conversation dans une liste. */
export const deriveTitle = (messages: ReadonlyArray<unknown>): string => {
  for (const message of messages) {
    if (typeof message !== 'object' || message === null) continue
    if (!('role' in message) || message.role !== 'user') continue
    const parts = 'parts' in message && Array.isArray(message.parts) ? message.parts : []
    const text = parts
      .filter(isTextPart)
      .map((part) => part.text)
      .join(' ')
      .trim()
    if (text.length === 0) continue
    return text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1)}…` : text
  }
  return 'Nouvelle conversation'
}

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
  contexte,
  messages,
  call,
}: {
  conversationId: string
  principalId: string
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
