import { type CreerCommentaireBody } from '@pilote/kpilote-shared/commentaire'
import { ResultAsync } from 'neverthrow'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { type CommentaireType } from '@/commentaire/ensureBrouillonUnique'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { ensureDossierWritePermission, withDossierReadPermission } from '@/dossier/permissions'

type Params = { dossierId: string }

export const dossierConfig: SujetCommentaireConfig<Params> = {
  resoudreCibleEcriture: ({ dossierId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().dossier.findFirstOrThrow({
        where: withDossierReadPermission({ publicId: dossierId }, principalId),
        select: { id: true },
      }),
    ).andThen((dossier) =>
      ensureDossierWritePermission({ dossierId: dossier.id, principalId }).map(() => ({
        principalId,
        satelliteCreate: (type: string) => ({
          dossier: { create: { dossierId: dossier.id, type: type as never } },
        }),
      })),
    )
  },
  whereLecture: ({ dossierId }, principalId) => ({
    dossier: { dossier: withDossierReadPermission({ publicId: dossierId }, principalId) },
  }),
}

type Input = {
  params: Params
  body: CreerCommentaireBody<CommentaireType>
}

export const creerDossierCommentaire = (input: Input) => creerCommentaire(dossierConfig, input)
