import { ResultAsync } from 'neverthrow'

import { resolveCommentairePourEcriture } from '@/commentaire/resolveCommentairePourEcriture'
import { db } from '@/framework/persistence/dbStore'

const performSupprimer = async (commentaireId: string): Promise<void> => {
  await resolveCommentairePourEcriture(commentaireId)
  await db().commentaire.delete({ where: { id: commentaireId } })
}

export const supprimerCommentaire = (commentaireId: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performSupprimer(commentaireId))
