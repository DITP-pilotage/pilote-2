import {
  type ModifierNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { resolveCommentairePourEcriture } from '@/commentaire/resolveCommentairePourEcriture'
import {
  htmlToPlainText,
  niveauConfianceInclude,
  toNiveauConfianceApiModel,
} from '@/commentaire/utils'
import { db } from '@/framework/persistence/dbStore'

export const modifierNiveauConfiance = (
  commentaireId: string,
  body: ModifierNiveauConfianceBody,
): ResultAsync<NiveauConfianceApiModel, never> =>
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
          // append d'un nouvel indice (historique) si fourni
          ...(body.indice !== undefined
            ? { niveauxConfiance: { create: { id: uuidv7(), indice: body.indice } } }
            : {}),
        },
        include: niveauConfianceInclude,
      }),
    ).map(toNiveauConfianceApiModel),
  )
