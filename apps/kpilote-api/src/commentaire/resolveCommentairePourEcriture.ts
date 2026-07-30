import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { ensureIndicateurWriteCommentPermission } from '@/indicateur/permissions'
import { ensureCollectionWriteCommentPermission } from '@/collection/permissions'

// Charge le commentaire + son satellite, vérifie que le principal courant en est l'auteur
// ET dispose de WRITE sur le sujet. Throw ForbiddenError / 404 (P2025) sinon.
export const resolveCommentairePourEcriture = (
  commentaireId: string,
): ResultAsync<{ principalId: string }, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    (async () => {
      const commentaire = await db().commentaire.findUniqueOrThrow({
        where: { id: commentaireId },
        select: {
          createdBy: true,
          indicateurIndividu: { select: { indicateurId: true } },
          collection: { select: { collectionId: true } },
        },
      })
      if (commentaire.createdBy !== principalId) {
        throw new ForbiddenError("Seul l'auteur peut modifier ce commentaire")
      }
      if (commentaire.indicateurIndividu) {
        await ensureIndicateurWriteCommentPermission({
          indicateurId: commentaire.indicateurIndividu.indicateurId,
          principalId,
        })
        return { principalId }
      }
      const collectionId = commentaire.collection?.collectionId
      if (collectionId) {
        await ensureCollectionWriteCommentPermission({ collectionId, principalId })
        return { principalId }
      }
      throw new ForbiddenError('Commentaire sans sujet rattaché')
    })(),
  )
}
