import { ResultAsync } from 'neverthrow'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { CollectionPermissionAction, Visibilite } from '@/generated/prisma/enums'

export const COLLECTION_PERMISSIONS_GRANTING_READ: CollectionPermissionAction[] = [
  CollectionPermissionAction.READ,
  CollectionPermissionAction.WRITE_COMMENT,
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
        {
          permissions: {
            some: { principalId, action: { in: COLLECTION_PERMISSIONS_GRANTING_READ } },
          },
        },
      ],
    },
  ],
})

export const ensureCollectionWriteCommentPermission = ({
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
            action: CollectionPermissionAction.WRITE_COMMENT,
          },
        },
      })
      .then((hasWrite) => {
        if (!hasWrite) {
          throw new ForbiddenError(
            "Vous n'avez pas la permission d'écrire un commentaire sur cette collection",
          )
        }
      }),
  )
