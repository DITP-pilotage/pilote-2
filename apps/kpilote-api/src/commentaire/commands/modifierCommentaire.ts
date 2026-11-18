import {
  type CommentaireApiModel,
  type ModifierCommentaireBody,
} from '@pilote/kpilote-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { resolveCommentairePourEcriture } from '@/commentaire/resolveCommentairePourEcriture'
import { commentaireInclude, htmlToPlainText, toCommentaireApiModel } from '@/commentaire/utils'
import { db } from '@/framework/persistence/dbStore'

const performModifier = async (
  commentaireId: string,
  body: ModifierCommentaireBody,
): Promise<CommentaireApiModel> => {
  const { principalId } = await resolveCommentairePourEcriture(commentaireId)
  const commentaire = await db().commentaire.update({
    where: { id: commentaireId },
    data: {
      ...(body.contenu !== undefined
        ? { contenu: body.contenu, contenuTexte: htmlToPlainText(body.contenu) }
        : {}),
      ...(body.statut !== undefined ? { statut: body.statut } : {}),
      updatedBy: principalId,
    },
    include: commentaireInclude,
  })
  return toCommentaireApiModel(commentaire)
}

export const modifierCommentaire = (
  commentaireId: string,
  body: ModifierCommentaireBody,
): ResultAsync<CommentaireApiModel, never> =>
  ResultAsync.fromSafePromise(performModifier(commentaireId, body))
