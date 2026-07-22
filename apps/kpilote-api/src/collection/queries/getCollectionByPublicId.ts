import { type CollectionApiModel } from '@pilote/kpilote-shared/collection'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withCollectionReadPermission } from '@/collection/permissions'
import { toCollectionApiModel } from '@/collection/utils'

export const getCollectionByPublicId = (
  publicId: string,
): ResultAsync<CollectionApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().collection.findFirstOrThrow({
      where: withCollectionReadPermission({ publicId }, principalId),
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
  ).map(toCollectionApiModel)
}
