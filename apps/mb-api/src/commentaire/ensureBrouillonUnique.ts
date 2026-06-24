import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'

const filtreType = (type: string): Prisma.CommentaireWhereInput => ({
  OR: [
    { indicateurIndividu: { type: type as never } },
    { panierIndividu: { type: type as never } },
    { panier: { type: type as never } },
  ],
})

// Règle PIL-1585/1592 : au plus 1 brouillon par (scope, auteur, type).
export const ensureBrouillonUnique = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  params: P,
  statut: 'BROUILLON' | 'PUBLIE',
  principalId: string,
  type: string,
): ResultAsync<void, never> => {
  if (statut !== 'BROUILLON') return ResultAsync.fromSafePromise(Promise.resolve())
  return ResultAsync.fromSafePromise(
    db()
      .commentaire.count({
        where: {
          AND: [
            config.whereLecture(params, principalId),
            { statut: 'BROUILLON', createdBy: principalId },
            filtreType(type),
          ],
        },
      })
      .then((count) => {
        if (count > 0) {
          throw new ConflictError('Un brouillon existe déjà pour ce type ; reprenez-le.')
        }
      }),
  )
}
