import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'
import {
  type CollectionCommentaireType,
  type IndicateurIndividuCommentaireType,
} from '@/generated/prisma/enums'

// Union des types possibles sur les 2 satellites (DEFAUT, CONFIANCE, OBJECTIF).
export type CommentaireType = IndicateurIndividuCommentaireType | CollectionCommentaireType

const filtreType = (type: CommentaireType): Prisma.CommentaireWhereInput => {
  // OBJECTIF n'existe que sur le satellite collection global.
  if (type === 'OBJECTIF') return { collection: { type } }
  return {
    OR: [{ indicateurIndividu: { type } }, { collection: { type } }],
  }
}

// Règle PIL-1585/1592 : au plus 1 brouillon par (scope, auteur, type).
export const hasBrouillon = async <P extends Record<string, string>>({
  config,
  params,
  principalId,
  type,
}: {
  config: SujetCommentaireConfig<P>
  params: P
  principalId: string
  type: CommentaireType
}): Promise<boolean> => {
  const count = await db().commentaire.count({
    where: {
      AND: [
        config.whereLecture(params, principalId),
        { statut: 'BROUILLON', createdBy: principalId },
        filtreType(type),
      ],
    },
  })
  return count > 0
}
