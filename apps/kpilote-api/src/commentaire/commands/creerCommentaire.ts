import {
  type CommentaireApiModel,
  type CreerCommentaireBody,
} from '@pilote/kpilote-shared/commentaire'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { type CommentaireType, hasBrouillon } from '@/commentaire/hasBrouillon'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { commentaireInclude, htmlToPlainText, toCommentaireApiModel } from '@/commentaire/utils'
import { db } from '@/framework/persistence/dbStore'

export type CreerCommentaireError = { type: 'BROUILLON_EXISTANT' }

type CreerCommentaireParams<P extends Record<string, string>> = {
  params: P
  body: CreerCommentaireBody<CommentaireType>
}

const performCreer = async <P extends Record<string, string>>({
  config,
  params,
  body,
}: CreerCommentaireParams<P> & { config: SujetCommentaireConfig<P> }): Promise<
  Result<CommentaireApiModel, CreerCommentaireError>
> => {
  const cible = await config.resoudreCibleEcriture(params)

  if (body.statut === 'BROUILLON') {
    const existe = await hasBrouillon({
      config,
      params,
      principalId: cible.principalId,
      type: body.type,
    })
    if (existe) return err({ type: 'BROUILLON_EXISTANT' })
  }

  const commentaire = await db().commentaire.create({
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
  })
  return ok(toCommentaireApiModel(commentaire))
}

export const creerCommentaire = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, body }: CreerCommentaireParams<P>,
): ResultAsync<CommentaireApiModel, CreerCommentaireError> =>
  ResultAsync.fromSafePromise(performCreer({ config, params, body })).andThen((result) => result)
