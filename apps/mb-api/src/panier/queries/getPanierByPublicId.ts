import { type PanierApiModel } from '@pilote/mb-shared/panier'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withPanierReadPermission } from '@/panier/permissions'
import { toPanierApiModel } from '@/panier/utils'

export const getPanierByPublicId = (publicId: string): ResultAsync<PanierApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().panier.findFirstOrThrow({
      where: withPanierReadPermission({ publicId }, principalId),
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
  ).map(toPanierApiModel)
}
