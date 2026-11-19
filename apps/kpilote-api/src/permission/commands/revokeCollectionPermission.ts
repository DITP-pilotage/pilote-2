import { type RevokeCollectionPermissionQuery } from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performRevoke = async (query: RevokeCollectionPermissionQuery): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: query.principalId } })
  const collection = await db().collection.findUniqueOrThrow({
    where: { publicId: query.collectionPublicId },
    select: { id: true },
  })

  await db().collectionPermission.deleteMany({
    where: {
      principalId: query.principalId,
      collectionId: collection.id,
      ...(query.action ? { action: query.action } : {}),
    },
  })
}

export const revokeCollectionPermission = (
  query: RevokeCollectionPermissionQuery,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performRevoke(query))
