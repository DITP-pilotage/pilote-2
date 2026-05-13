import { type IndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndicateurApiModel } from '@/indicateur/utils'

export const getIndicateurByPublicId = (
  publicId: string,
): ResultAsync<IndicateurApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId }, principalId),
      include: {
        referentiels: {
          include: { referentiel: { select: { publicId: true } } },
        },
      },
    }),
  ).map(toIndicateurApiModel)
}
