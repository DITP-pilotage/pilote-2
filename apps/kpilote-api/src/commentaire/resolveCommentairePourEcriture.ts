import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { ensureIndicateurWritePermission } from '@/indicateur/permissions'
import { ensureDossierWritePermission } from '@/dossier/permissions'

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
          dossier: { select: { dossierId: true } },
        },
      })
      if (commentaire.createdBy !== principalId) {
        throw new ForbiddenError("Seul l'auteur peut modifier ce commentaire")
      }
      if (commentaire.indicateurIndividu) {
        await ensureIndicateurWritePermission({
          indicateurId: commentaire.indicateurIndividu.indicateurId,
          principalId,
        })
        return { principalId }
      }
      const dossierId = commentaire.dossier?.dossierId
      if (dossierId) {
        await ensureDossierWritePermission({ dossierId, principalId })
        return { principalId }
      }
      throw new ForbiddenError('Commentaire sans sujet rattaché')
    })(),
  )
}
