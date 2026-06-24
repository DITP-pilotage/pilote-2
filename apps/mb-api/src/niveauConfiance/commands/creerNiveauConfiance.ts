import {
  type CreerNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/mb-shared/niveauConfiance'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { resolveCommentairePourEcriture } from '@/commentaire/resolveCommentairePourEcriture'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/niveauConfiance/utils'

const ensureCommentaireConfiance = async (commentaireId: string): Promise<void> => {
  const commentaire = await db().commentaire.findUniqueOrThrow({
    where: { id: commentaireId },
    select: {
      indicateurIndividu: { select: { type: true } },
      panierIndividu: { select: { type: true } },
      panier: { select: { type: true } },
    },
  })
  const typeSatellite =
    commentaire.indicateurIndividu?.type ??
    commentaire.panierIndividu?.type ??
    commentaire.panier?.type
  if (typeSatellite !== 'CONFIANCE') {
    throw new ValidationError('Le commentaire ciblé n’est pas de type CONFIANCE')
  }
}

const insertNiveauConfiance = ({
  commentaireId,
  indice,
  principalId,
}: {
  commentaireId: string
  indice: CreerNiveauConfianceBody['indice']
  principalId: string
}) =>
  db().niveauConfiance.create({
    data: {
      id: uuidv7(),
      commentaireId,
      indice,
      createdBy: principalId,
      updatedBy: principalId,
    },
    include: niveauConfianceInclude,
  })

export const creerNiveauConfiance = (
  body: CreerNiveauConfianceBody,
): ResultAsync<NiveauConfianceApiModel, never> =>
  resolveCommentairePourEcriture(body.commentaireId).andThen(({ principalId }) =>
    ResultAsync.fromSafePromise(
      ensureCommentaireConfiance(body.commentaireId).then(() =>
        insertNiveauConfiance({
          commentaireId: body.commentaireId,
          indice: body.indice,
          principalId,
        }),
      ),
    ).map(toNiveauConfianceApiModel),
  )
