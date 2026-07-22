import { ResultAsync } from 'neverthrow'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { PermissionAction, Visibilite } from '@/generated/prisma/enums'

export const COLLECTION_READ_PERMISSIONS: PermissionAction[] = [
  PermissionAction.READ,
  PermissionAction.WRITE,
]

export const withCollectionReadPermission = (
  where: Prisma.CollectionWhereInput,
  principalId: string,
): Prisma.CollectionWhereInput => ({
  AND: [
    where,
    {
      OR: [
        { visibilite: Visibilite.PUBLIC },
        { permissions: { some: { principalId, action: { in: COLLECTION_READ_PERMISSIONS } } } },
      ],
    },
  ],
})

export const ensureCollectionWritePermission = ({
  collectionId,
  principalId,
}: {
  collectionId: string
  principalId: string
}): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(
    db()
      .collectionPermission.findUnique({
        where: {
          principalId_collectionId_action: {
            principalId,
            collectionId,
            action: PermissionAction.WRITE,
          },
        },
      })
      .then((hasWrite) => {
        if (!hasWrite) {
          throw new ForbiddenError("Vous n'avez pas la permission de modifier ce collection")
        }
      }),
  )
