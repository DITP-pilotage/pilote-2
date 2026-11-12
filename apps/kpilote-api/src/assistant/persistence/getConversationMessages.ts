import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

/**
 * L'historique d'une conversation tel que le serveur l'a enregistré. Une conversation
 * inconnue est un premier tour ; celle d'un autre principal est introuvable.
 */
export const getConversationMessages = async ({
  id,
  principalId,
}: {
  id: string
  principalId: string
}): Promise<unknown[]> => {
  const conversation = await db().assistantConversation.findUnique({
    where: { id },
    select: { principalId: true, messages: true },
  })
  if (!conversation) return []
  if (conversation.principalId !== principalId) {
    throw new NotFoundError('Conversation introuvable', { id })
  }
  return Array.isArray(conversation.messages) ? conversation.messages : []
}
