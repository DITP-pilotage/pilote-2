import { type CreerCommentaireBody } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { type CommentaireType } from '@/commentaire/ensureBrouillonUnique'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { ensurePanierWritePermission, withPanierReadPermission } from '@/panier/permissions'

type Params = { panierId: string }

export const panierConfig: SujetCommentaireConfig<Params> = {
  resoudreCibleEcriture: ({ panierId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().panier.findFirstOrThrow({
        where: withPanierReadPermission({ publicId: panierId }, principalId),
        select: { id: true },
      }),
    ).andThen((panier) =>
      ensurePanierWritePermission({ panierId: panier.id, principalId }).map(() => ({
        principalId,
        satelliteCreate: (type: string) => ({
          panier: { create: { panierId: panier.id, type: type as never } },
        }),
      })),
    )
  },
  whereLecture: ({ panierId }, principalId) => ({
    panier: { panier: withPanierReadPermission({ publicId: panierId }, principalId) },
  }),
}

type Input = {
  params: Params
  body: CreerCommentaireBody<CommentaireType>
}

export const creerPanierCommentaire = (input: Input) => creerCommentaire(panierConfig, input)
