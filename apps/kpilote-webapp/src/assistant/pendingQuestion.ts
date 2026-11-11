import type { ChatStatus } from 'ai'

/** Une question saisie dans la palette, à envoyer dans la conversation ouverte. */
export type PendingQuestion = { id: string; text: string }

/**
 * La question à envoyer maintenant : une seule fois, et jamais pendant une réponse en cours,
 * où deux tours sur la même conversation s'écraseraient côté serveur.
 */
export const questionToSend = ({
  pending,
  lastSentId,
  status,
}: {
  pending: PendingQuestion | null
  lastSentId: string | null
  status: ChatStatus
}): PendingQuestion | null => {
  if (!pending || pending.id === lastSentId) return null
  if (status === 'submitted' || status === 'streaming') return null
  return pending
}
