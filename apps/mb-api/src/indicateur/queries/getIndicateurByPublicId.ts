import { type IndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'

import { isAdminPrincipal, requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { toIndicateurApiModel } from '@/indicateur/utils'

export const getIndicateurByPublicId = (
  publicId: string,
): ResultAsync<IndicateurApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  // Un principal ADMIN administre toutes les ressources (PUBLIC + PRIVÉ), comme
  // dans listIndicateurs. Sans ce bypass, un ADMIN listerait un indicateur PRIVÉ
  // mais obtiendrait un 404 sur le détail (incohérence liste ↔ détail).
  const where = isAdminPrincipal()
    ? { publicId }
    : withIndicateurReadPermission({ publicId }, principalId)
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where,
      include: { referentiels: { include: { referentiel: true } } },
    }),
  ).map(toIndicateurApiModel)
}
