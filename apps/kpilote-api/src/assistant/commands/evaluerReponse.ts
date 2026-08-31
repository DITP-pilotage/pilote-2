import { type EvaluerBody } from '@pilote/kpilote-shared/assistant/feedback'

import { db } from '@/framework/persistence/dbStore'

/**
 * L'évaluation porte sur le dernier tour de la conversation : c'est celui que l'utilisateur
 * a sous les yeux quand il clique. Sans tour correspondant on ne fait rien — un retour est
 * une donnée d'amélioration, pas une opération métier dont l'échec doit remonter.
 */
export const evaluerReponse = async ({
  conversationId,
  corps,
}: {
  conversationId: string
  corps: EvaluerBody
}): Promise<void> => {
  const dernierTour = await db().assistantAppel.findFirst({
    where: { conversationId },
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
