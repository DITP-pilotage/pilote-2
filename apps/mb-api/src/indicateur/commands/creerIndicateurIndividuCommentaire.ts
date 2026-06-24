import { type CreerCommentaireBody } from '@pilote/mb-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { type CommentaireType } from '@/commentaire/ensureBrouillonUnique'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import {
  ensureIndicateurWritePermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'

type Params = { indicateurId: string; individuId: string }

export const indicateurIndividuConfig: SujetCommentaireConfig<Params> = {
  resoudreCibleEcriture: ({ indicateurId, individuId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().indicateur.findFirstOrThrow({
        where: withIndicateurReadPermission({ publicId: indicateurId }, principalId),
        select: { id: true },
      }),
    )
      .andThen((indicateur) =>
        ResultAsync.fromSafePromise(
          db().individu.findFirstOrThrow({ where: { publicId: individuId }, select: { id: true } }),
        ).map((individu) => ({ indId: indicateur.id, indivId: individu.id })),
      )
      .andThen(({ indId, indivId }) =>
        ensureIndicateurWritePermission({ indicateurId: indId, principalId }).map(() => ({
          principalId,
          satelliteCreate: (type: string) => ({
            indicateurIndividu: {
              create: { indicateurId: indId, individuId: indivId, type: type as never },
            },
          }),
        })),
      )
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
