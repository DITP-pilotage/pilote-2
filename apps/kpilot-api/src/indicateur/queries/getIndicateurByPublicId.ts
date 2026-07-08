import { type IndicateurApiModel } from '@pilote/kpilot-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndicateurApiModel } from '@/indicateur/utils'

export const getIndicateurByPublicId = (
  publicId: string,
): ResultAsync<IndicateurApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  // Le bypass ADMIN est géré dans withIndicateurReadPermission. Sans lui, un ADMIN
  // listerait un indicateur PRIVÉ mais obtiendrait un 404 sur le détail (incohérence
  // liste ↔ détail).
  const where = withIndicateurReadPermission({ publicId }, principalId, {
    isAdmin: isAdminPrincipal(),
  })
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where,
      include: {
        referentiels: { include: { referentiel: true } },
        responsables: {
          orderBy: { createdAt: 'asc' },
          include: { utilisateur: true },
        },
      },
    }),
  ).map(toIndicateurApiModel)
}
