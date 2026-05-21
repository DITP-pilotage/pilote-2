import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { PermissionAction, Visibilite } from '@/generated/prisma/enums'

const INDICATEUR_READ_PERMISSIONS: PermissionAction[] = [
  PermissionAction.READ,
  PermissionAction.WRITE,
]

export const withIndicateurReadPermission = (
  where: Prisma.IndicateurWhereInput,
  principalId: string,
): Prisma.IndicateurWhereInput => ({
  AND: [
    where,
    {
      OR: [
        { visibilite: Visibilite.PUBLIC },
        { permissions: { some: { principalId, action: { in: INDICATEUR_READ_PERMISSIONS } } } },
      ],
    },
  ],
})

export const ensureIndicateurWritePermission = ({
  indicateurId,
  principalId,
}: {
  indicateurId: string
  principalId: string
}): ResultAsync<void, ForbiddenError> =>
  ResultAsync.fromSafePromise(
    db().indicateurPermission.findUnique({
      where: {
        principalId_indicateurId_action: {
          principalId,
          indicateurId,
          action: PermissionAction.WRITE,
        },
      },
    }),
  ).andThen((hasWrite) =>
    hasWrite
      ? okAsync(undefined)
      : errAsync(new ForbiddenError("Vous n'avez pas la permission de modifier cet indicateur")),
  )
