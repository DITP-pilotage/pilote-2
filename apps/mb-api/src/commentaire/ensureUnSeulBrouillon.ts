import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'

// Section fonctionnelle : les commentaires libres et les niveaux de confiance (type CONFIANCE)
// sont deux sections distinctes, chacune limitée à 1 brouillon par (scope, auteur).
export type SectionCommentaire = 'LIBRE' | 'CONFIANCE'

const estConfiance: Prisma.CommentaireWhereInput = {
  OR: [
    { indicateurIndividu: { type: 'CONFIANCE' } },
    { panierIndividu: { type: 'CONFIANCE' } },
    { panier: { type: 'CONFIANCE' } },
  ],
}

const filtreSection = (section: SectionCommentaire): Prisma.CommentaireWhereInput =>
  section === 'CONFIANCE' ? estConfiance : { NOT: estConfiance }

// Règle PIL-1585/1592 : au plus 1 brouillon par (scope, auteur, section).
export const ensureUnSeulBrouillon = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  params: P,
  statut: 'BROUILLON' | 'PUBLIE',
  principalId: string,
  section: SectionCommentaire,
): ResultAsync<void, never> => {
  if (statut !== 'BROUILLON') return ResultAsync.fromSafePromise(Promise.resolve())
  return ResultAsync.fromSafePromise(
    db()
      .commentaire.count({
        where: {
          AND: [
            config.whereLecture(params, principalId),
            { statut: 'BROUILLON', createdBy: principalId },
            filtreSection(section),
          ],
        },
      })
      .then((count) => {
        if (count > 0) {
          throw new ConflictError('Un brouillon existe déjà pour cette section ; reprenez-le.')
        }
      }),
  )
}
