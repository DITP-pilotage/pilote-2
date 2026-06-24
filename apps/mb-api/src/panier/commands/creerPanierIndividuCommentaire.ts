import { type CreerCommentaireBody } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { ensurePanierWritePermission, withPanierReadPermission } from '@/panier/permissions'

type Params = { panierId: string; individuId: string }

export const panierIndividuConfig: SujetCommentaireConfig<Params> = {
  resoudreCibleEcriture: ({ panierId, individuId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().panier.findFirstOrThrow({
        where: withPanierReadPermission({ publicId: panierId }, principalId),
        select: { id: true },
      }),
    )
      .andThen((panier) =>
        ResultAsync.fromSafePromise(
          db().individu.findFirstOrThrow({ where: { publicId: individuId }, select: { id: true } }),
        ).map((individu) => ({ panId: panier.id, indivId: individu.id })),
      )
      .andThen(({ panId, indivId }) =>
        ensurePanierWritePermission({ panierId: panId, principalId }).map(() => ({
          principalId,
          satelliteCreate: (type: string) => ({
            panierIndividu: {
              create: { panierId: panId, individuId: indivId, type: type as never },
            },
          }),
        })),
      )
  },
  whereLecture: ({ panierId, individuId }, principalId) => ({
    panierIndividu: {
      panier: withPanierReadPermission({ publicId: panierId }, principalId),
      individu: { publicId: individuId },
    },
  }),
}

type Input = {
  params: Params
  body: CreerCommentaireBody
}

export const creerPanierIndividuCommentaire = (input: Input) =>
  creerCommentaire(panierIndividuConfig, input)
