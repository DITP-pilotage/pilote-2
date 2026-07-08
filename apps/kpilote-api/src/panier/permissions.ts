import { ResultAsync } from 'neverthrow'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { PermissionAction, Visibilite } from '@/generated/prisma/enums'

export const PANIER_READ_PERMISSIONS: PermissionAction[] = [
  PermissionAction.READ,
  PermissionAction.WRITE,
]

export const withPanierReadPermission = (
  where: Prisma.PanierWhereInput,
  principalId: string,
): Prisma.PanierWhereInput => ({
  AND: [
    where,
    {
      OR: [
        { visibilite: Visibilite.PUBLIC },
        { permissions: { some: { principalId, action: { in: PANIER_READ_PERMISSIONS } } } },
      ],
    },
  ],
})

export const ensurePanierWritePermission = ({
  panierId,
  principalId,
}: {
  panierId: string
  principalId: string
}): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(
    db()
      .panierPermission.findUnique({
        where: {
          principalId_panierId_action: {
            principalId,
            panierId,
            action: PermissionAction.WRITE,
          },
        },
      })
      .then((hasWrite) => {
        if (!hasWrite) {
          throw new ForbiddenError("Vous n'avez pas la permission de modifier ce panier")
        }
      }),
  )
