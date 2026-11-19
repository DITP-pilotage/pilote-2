import { type GrantCollectionPermissionBody } from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performGrant = async (body: GrantCollectionPermissionBody): Promise<void> => {
  ensureAdmin()
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })
  const collection = await db().collection.findUniqueOrThrow({
    where: { publicId: body.collectionPublicId },
    select: { id: true },
  })

  await db().collectionPermission.upsert({
    where: {
      principalId_collectionId_action: {
        principalId: body.principalId,
        collectionId: collection.id,
        action: body.action,
      },
    },
    create: { principalId: body.principalId, collectionId: collection.id, action: body.action },
    update: {},
  })
}

export const grantCollectionPermission = (
  body: GrantCollectionPermissionBody,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performGrant(body))
