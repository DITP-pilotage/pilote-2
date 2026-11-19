import {
  type CreerNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/kpilote-shared/niveauConfiance'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/niveauConfiance/utils'

export type CreerNiveauConfianceError = { type: 'COMMENTAIRE_PAS_CONFIANCE' }

// L'auteur du commentaire est implicitement habilité à y attacher son indice :
// s'il a pu poster le commentaire CONFIANCE, il a déjà la permission. Renvoie
// si le commentaire est bien de type CONFIANCE.
const isCommentaireConfianceDeLAuteur = async (
  commentaireId: string,
  principalId: string,
): Promise<boolean> => {
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
  return typeSatellite === 'CONFIANCE'
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

const performCreer = async (
  body: CreerNiveauConfianceBody,
): Promise<Result<NiveauConfianceApiModel, CreerNiveauConfianceError>> => {
  const principalId = requireCurrentPrincipalId()
  const estConfiance = await isCommentaireConfianceDeLAuteur(body.commentaireId, principalId)
  if (!estConfiance) return err({ type: 'COMMENTAIRE_PAS_CONFIANCE' })
  const niveau = await insertNiveauConfiance({
    commentaireId: body.commentaireId,
    indice: body.indice,
    principalId,
  })
  return ok(toNiveauConfianceApiModel(niveau))
}

export const creerNiveauConfiance = (
  body: CreerNiveauConfianceBody,
): ResultAsync<NiveauConfianceApiModel, CreerNiveauConfianceError> =>
  new ResultAsync(performCreer(body))
