import { type CommentaireApiModel, type CreerCommentaireBody } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { commentaireInclude, htmlToPlainText, toCommentaireApiModel } from '@/commentaire/utils'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

type CreerCommentaireParams<P extends Record<string, string>> = {
  params: P
  body: CreerCommentaireBody
}

export const creerCommentaire = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, body }: CreerCommentaireParams<P>,
): ResultAsync<CommentaireApiModel, never> =>
  config.resoudreCibleEcriture(params).andThen((cible) =>
    ensureUnSeulBrouillon(config, params, body.statut, cible.principalId).andThen(() =>
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

// Règle PIL-1585/1592 : au plus 1 brouillon par (scope, auteur).
// `whereLecture` borne au scope exact (sujet + individu) ; on ajoute statut BROUILLON + auteur.
// Exécuté dans la transaction de la route (withTransaction) → cohérent.
const ensureUnSeulBrouillon = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  params: P,
  statut: CreerCommentaireBody['statut'],
  principalId: string,
): ResultAsync<void, never> => {
  if (statut !== 'BROUILLON') return ResultAsync.fromSafePromise(Promise.resolve())
  return ResultAsync.fromSafePromise(
    db()
      .commentaire.count({
        where: {
          AND: [
            config.whereLecture(params, principalId),
            { statut: 'BROUILLON', createdBy: principalId },
          ],
        },
      })
      .then((count) => {
        if (count > 0) {
          throw new ConflictError(
            'Un brouillon existe déjà pour ce scope ; reprenez-le plutôt que d’en créer un autre',
          )
        }
      }),
  )
}
