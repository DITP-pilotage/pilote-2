import { ResultAsync } from 'neverthrow'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { PermissionAction, Visibilite } from '@/generated/prisma/enums'

export const DOSSIER_READ_PERMISSIONS: PermissionAction[] = [
  PermissionAction.READ,
  PermissionAction.WRITE,
]

export const withDossierReadPermission = (
  where: Prisma.DossierWhereInput,
  principalId: string,
): Prisma.DossierWhereInput => ({
  AND: [
    where,
    {
      OR: [
        { visibilite: Visibilite.PUBLIC },
        { permissions: { some: { principalId, action: { in: DOSSIER_READ_PERMISSIONS } } } },
      ],
    },
  ],
})

export const ensureDossierWritePermission = ({
  dossierId,
  principalId,
}: {
  dossierId: string
  principalId: string
}): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(
    db()
      .dossierPermission.findUnique({
        where: {
          principalId_dossierId_action: {
            principalId,
            dossierId,
            action: PermissionAction.WRITE,
          },
        },
      })
      .then((hasWrite) => {
        if (!hasWrite) {
          throw new ForbiddenError("Vous n'avez pas la permission de modifier ce dossier")
        }
      }),
  )
