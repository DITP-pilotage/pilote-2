import {
  type CreerNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/kpilote-shared/niveauConfiance'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/niveauConfiance/utils'

// L'auteur du commentaire est implicitement habilité à y attacher son indice :
// s'il a pu poster le commentaire CONFIANCE, il a déjà la permission.
const ensureAuteurDuCommentaireConfiance = async (
  commentaireId: string,
  principalId: string,
): Promise<void> => {
  const commentaire = await db().commentaire.findUniqueOrThrow({
    where: { id: commentaireId },
    select: {
      createdBy: true,
      indicateurIndividu: { select: { type: true } },
      collection: { select: { type: true } },
    },
  })
  if (commentaire.createdBy !== principalId) {
    throw new ForbiddenError('Seul l’auteur du commentaire peut y attacher un niveau de confiance')
  }
  const typeSatellite = commentaire.indicateurIndividu?.type ?? commentaire.collection?.type
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
): ResultAsync<NiveauConfianceApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    ensureAuteurDuCommentaireConfiance(body.commentaireId, principalId).then(() =>
      insertNiveauConfiance({
        commentaireId: body.commentaireId,
        indice: body.indice,
        principalId,
      }),
    ),
  ).map(toNiveauConfianceApiModel)
}
