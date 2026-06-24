import {
  type CreerNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensureUnSeulBrouillon } from '@/commentaire/ensureUnSeulBrouillon'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import {
  htmlToPlainText,
  niveauConfianceInclude,
  toNiveauConfianceApiModel,
} from '@/commentaire/utils'
import { db } from '@/framework/persistence/dbStore'

type CreerNiveauConfianceParams<P extends Record<string, string>> = {
  params: P
  body: CreerNiveauConfianceBody
}

export const creerNiveauConfiance = <P extends Record<string, string>>(
  config: SujetCommentaireConfig<P>,
  { params, body }: CreerNiveauConfianceParams<P>,
): ResultAsync<NiveauConfianceApiModel, never> =>
  config.resoudreCibleEcriture(params).andThen((cible) =>
    ensureUnSeulBrouillon(config, params, body.statut, cible.principalId, 'CONFIANCE').andThen(() =>
      ResultAsync.fromSafePromise(
        db().commentaire.create({
          data: {
            id: uuidv7(),
            contenu: body.contenu,
            contenuTexte: htmlToPlainText(body.contenu),
            statut: body.statut,
            createdBy: cible.principalId,
            updatedBy: cible.principalId,
            ...cible.satelliteCreate('CONFIANCE'),
            niveauxConfiance: { create: { id: uuidv7(), indice: body.indice } },
          },
          include: niveauConfianceInclude,
        }),
      ).map(toNiveauConfianceApiModel),
    ),
  )
