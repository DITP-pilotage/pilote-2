import { type CommentaireApiModel, type CreerCommentaireBody } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { type CommentaireType, ensureBrouillonUnique } from '@/commentaire/ensureBrouillonUnique'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { commentaireInclude, htmlToPlainText, toCommentaireApiModel } from '@/commentaire/utils'
import { db } from '@/framework/persistence/dbStore'

type CreerCommentaireParams<P extends Record<string, string>> = {
  params: P
  body: CreerCommentaireBody<CommentaireType>
}

export const creerCommentaire = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, body }: CreerCommentaireParams<P>,
): ResultAsync<CommentaireApiModel, never> =>
  config.resoudreCibleEcriture(params).andThen((cible) =>
    ensureBrouillonUnique(config, params, body.statut, cible.principalId, body.type).andThen(() =>
      ResultAsync.fromSafePromise(
        db().commentaire.create({
          data: {
            id: uuidv7(),
            contenu: body.contenu,
            contenuTexte: htmlToPlainText(body.contenu),
            statut: body.statut,
            createdBy: cible.principalId,
            updatedBy: cible.principalId,
            ...cible.satelliteCreate(body.type),
          },
          include: commentaireInclude,
        }),
      ).map(toCommentaireApiModel),
    ),
  )
