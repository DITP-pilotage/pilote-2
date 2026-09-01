import { type EvaluerBody } from '@pilote/kpilote-shared/assistant/feedback'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

/**
 * L'évaluation porte sur le dernier tour de la conversation : c'est celui que l'utilisateur
 * a sous les yeux quand il clique.
 *
 * La recherche est cloisonnée au principal appelant. Sans ce filtre, l'identifiant de
 * conversation venant de l'URL suffirait à noter — et à commenter — la conversation de
 * quelqu'un d'autre. Un tour appartenant à un autre principal est donc traité exactement
 * comme un tour inexistant : on ne fait rien et on rend 204, ce qui ne renseigne pas
 * l'appelant sur l'existence de la conversation.
 */
export const evaluerReponse = async ({
  conversationId,
  corps,
}: {
  conversationId: string
  corps: EvaluerBody
}): Promise<void> => {
  const dernierTour = await db().assistantAppel.findFirst({
    where: { conversationId, principalId: requireCurrentPrincipalId() },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })
  if (!dernierTour) return

  await db().assistantAppel.update({
    where: { id: dernierTour.id },
    data: {
      evaluation: corps.evaluation,
      ...(corps.commentaire === undefined ? {} : { commentaire: corps.commentaire }),
      categoriesProbleme: corps.evaluation === 'NEGATIVE' ? corps.categories : [],
    },
  })
}
