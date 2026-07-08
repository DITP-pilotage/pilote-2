import { ResultAsync } from 'neverthrow'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'
import {
  type DossierCommentaireType,
  type IndicateurIndividuCommentaireType,
} from '@/generated/prisma/enums'

// Union des types possibles sur les 2 satellites (DEFAUT, CONFIANCE, OBJECTIF).
export type CommentaireType = IndicateurIndividuCommentaireType | DossierCommentaireType

const filtreType = (type: CommentaireType): Prisma.CommentaireWhereInput => {
  // OBJECTIF n'existe que sur le satellite dossier global.
  if (type === 'OBJECTIF') return { dossier: { type } }
  return {
    OR: [{ indicateurIndividu: { type } }, { dossier: { type } }],
  }
}

// Règle PIL-1585/1592 : au plus 1 brouillon par (scope, auteur, type).
export const ensureBrouillonUnique = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  params: P,
  statut: 'BROUILLON' | 'PUBLIE',
  principalId: string,
  type: CommentaireType,
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
