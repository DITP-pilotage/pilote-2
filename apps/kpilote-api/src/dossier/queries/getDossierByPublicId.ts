import { type DossierApiModel } from '@pilote/kpilote-shared/dossier'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withDossierReadPermission } from '@/dossier/permissions'
import { toDossierApiModel } from '@/dossier/utils'

export const getDossierByPublicId = (publicId: string): ResultAsync<DossierApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().dossier.findFirstOrThrow({
      where: withDossierReadPermission({ publicId }, principalId),
      include: {
        indicateurs: {
          orderBy: { createdAt: 'asc' },
          include: { indicateur: { select: { publicId: true } } },
        },
        responsables: {
          orderBy: { createdAt: 'asc' },
          include: { utilisateur: true },
        },
        contactsUtiles: {
          include: { contactUtile: { include: { organisme: true } } },
        },
      },
    }),
  ).map(toDossierApiModel)
}
