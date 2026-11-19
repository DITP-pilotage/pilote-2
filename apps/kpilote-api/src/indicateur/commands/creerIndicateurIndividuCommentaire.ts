import { type CreerCommentaireBody } from '@pilote/kpilote-shared/commentaire'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { type CommentaireType } from '@/commentaire/hasBrouillon'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { type IndicateurIndividuCommentaireType } from '@/generated/prisma/enums'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import {
  ensureIndicateurWriteCommentPermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'

type Params = { indicateurId: string; individuId: string }

export const indicateurIndividuConfig: SujetCommentaireConfig<Params> = {
  resoudreCibleEcriture: async ({ indicateurId, individuId }) => {
    const principalId = requireCurrentPrincipalId()
    const indicateur = await db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurId }, principalId),
      select: { id: true },
    })
    const individu = await db().individu.findFirstOrThrow({
      where: { publicId: individuId },
      select: { id: true },
    })
    await ensureIndicateurWriteCommentPermission({ indicateurId: indicateur.id, principalId })
    return {
      principalId,
      satelliteCreate: (type: CommentaireType) => ({
        indicateurIndividu: {
          create: {
            indicateurId: indicateur.id,
            individuId: individu.id,
            type: type as IndicateurIndividuCommentaireType,
          },
        },
      }),
    }
  },
  whereLecture: ({ indicateurId, individuId }, principalId) => ({
    indicateurIndividu: {
      indicateur: withIndicateurReadPermission({ publicId: indicateurId }, principalId),
      individu: { publicId: individuId },
    },
  }),
}

type Input = {
  params: Params
  body: CreerCommentaireBody<CommentaireType>
}

export const creerIndicateurIndividuCommentaire = (input: Input) =>
  creerCommentaire(indicateurIndividuConfig, input)
