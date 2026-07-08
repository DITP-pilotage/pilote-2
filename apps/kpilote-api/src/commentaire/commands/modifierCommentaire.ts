import {
  type CommentaireApiModel,
  type ModifierCommentaireBody,
} from '@pilote/kpilote-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { resolveCommentairePourEcriture } from '@/commentaire/resolveCommentairePourEcriture'
import { commentaireInclude, htmlToPlainText, toCommentaireApiModel } from '@/commentaire/utils'
import { db } from '@/framework/persistence/dbStore'

export const modifierCommentaire = (
  commentaireId: string,
  body: ModifierCommentaireBody,
): ResultAsync<CommentaireApiModel, never> =>
  resolveCommentairePourEcriture(commentaireId).andThen(({ principalId }) =>
    ResultAsync.fromSafePromise(
      db().commentaire.update({
        where: { id: commentaireId },
        data: {
          ...(body.contenu !== undefined
            ? { contenu: body.contenu, contenuTexte: htmlToPlainText(body.contenu) }
            : {}),
          ...(body.statut !== undefined ? { statut: body.statut } : {}),
          updatedBy: principalId,
        },
        include: commentaireInclude,
      }),
    ).map(toCommentaireApiModel),
  )
