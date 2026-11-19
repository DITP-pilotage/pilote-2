import {
  type CreerNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/kpilote-shared/niveauConfiance'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensureAuteur } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import {
  checkCommentaireConfiance,
  type CommentairePasConfianceError,
} from '@/niveauConfiance/rules'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/niveauConfiance/utils'

export type CreerNiveauConfianceError = CommentairePasConfianceError

const loadCommentaire = async (commentaireId: string) => {
  const commentaire = await db().commentaire.findUniqueOrThrow({
    where: { id: commentaireId },
    select: {
      createdBy: true,
      indicateurIndividu: { select: { type: true } },
      collection: { select: { type: true } },
    },
  })
  return {
    createdBy: commentaire.createdBy,
    type: commentaire.indicateurIndividu?.type ?? commentaire.collection?.type ?? null,
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

const performCreer = async (
  body: CreerNiveauConfianceBody,
): Promise<Result<NiveauConfianceApiModel, CreerNiveauConfianceError>> => {
  const principalId = requireCurrentPrincipalId()
  const commentaire = await loadCommentaire(body.commentaireId)
  // L'auteur du commentaire est implicitement habilité à y attacher son indice :
  // s'il a pu poster le commentaire CONFIANCE, il a déjà la permission.
  ensureAuteur({
    createdBy: commentaire.createdBy,
    message: 'Seul l’auteur du commentaire peut y attacher un niveau de confiance',
  })

  const confiance = checkCommentaireConfiance({ typeCommentaire: commentaire.type })
  if (confiance.isErr()) return err(confiance.error)

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
