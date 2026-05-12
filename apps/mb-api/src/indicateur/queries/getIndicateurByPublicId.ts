import { type IndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { toIndicateurApiModel } from '@/indicateur/utils'

const READ_ACTIONS: PermissionAction[] = [PermissionAction.READ, PermissionAction.WRITE]

export const getIndicateurByPublicId = (
  publicId: string,
): ResultAsync<IndicateurApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: {
        publicId,
        permissions: { some: { principalId, action: { in: READ_ACTIONS } } },
      },
    }),
  ).map(toIndicateurApiModel)
}
