import { NotFoundError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

/**
 * L'historique d'une conversation, tel que le serveur l'a enregistré au tour précédent.
 *
 * Une conversation inconnue rend `[]` : c'est un premier tour, l'identifiant vient du
 * client. Une conversation appartenant à un autre principal est introuvable, au sens
 * strict : on ne la lit pas, et on ne la laissera pas écraser non plus.
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
  return conversation.messages as unknown[]
}
