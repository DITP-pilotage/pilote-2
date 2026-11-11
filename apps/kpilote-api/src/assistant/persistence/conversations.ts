import {
  MAX_CONVERSATIONS,
  type Conversation,
  type ConversationSummary,
} from '@pilote/kpilote-shared/assistant/conversation'

import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

const SUMMARY = { id: true, titre: true, createdAt: true, updatedAt: true } as const

const toSummary = (row: {
  id: string
  titre: string
  createdAt: Date
  updatedAt: Date
}): ConversationSummary => ({
  id: row.id,
  titre: row.titre,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export const listConversations = async (principalId: string): Promise<ConversationSummary[]> =>
  (
    await db().assistantConversation.findMany({
      where: { principalId },
      select: SUMMARY,
      orderBy: { updatedAt: 'desc' },
      take: MAX_CONVERSATIONS,
    })
  ).map(toSummary)

/** Une conversation du principal ; celle d'un autre est introuvable, comme une absente. */
export const getConversation = async ({
  id,
  principalId,
}: {
  id: string
  principalId: string
}): Promise<Conversation> => {
  const row = await db().assistantConversation.findFirst({
    where: { id, principalId },
    select: { ...SUMMARY, messages: true },
  })
  if (!row) throw new NotFoundError('Conversation introuvable', { id })
  return {
    ...toSummary(row),
    messages: Array.isArray(row.messages) ? row.messages : [],
  }
}

/** Supprime la conversation et, en cascade, ses appels et leurs évaluations. */
export const deleteConversation = async ({
  id,
  principalId,
}: {
  id: string
  principalId: string
}): Promise<void> => {
  const { count } = await db().assistantConversation.deleteMany({ where: { id, principalId } })
  if (count === 0) throw new NotFoundError('Conversation introuvable', { id })
}
