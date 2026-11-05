import { type RateBody } from '@pilote/kpilote-shared/assistant/feedback'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

/**
 * Note l'appel que l'utilisateur a sous les yeux. Un appel d'un autre principal est traité
 * comme inexistant : rien n'est écrit, et l'appelant n'apprend pas qu'il existe.
 */
export const rateCall = async ({
  callId,
  body,
}: {
  callId: string
  body: RateBody
}): Promise<void> => {
  await db().assistantAppel.updateMany({
    where: { id: callId, principalId: requireCurrentPrincipalId() },
    data: {
      evaluation: body.evaluation,
      commentaire: body.commentaire ?? null,
      categoriesProbleme: body.evaluation === 'NEGATIVE' ? body.categories : [],
    },
  })
}
