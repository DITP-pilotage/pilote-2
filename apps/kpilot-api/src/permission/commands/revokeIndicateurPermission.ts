import {
  type PrincipalPermissionsApiModel,
  type RevokeIndicateurPermissionQuery,
} from '@pilote/kpilot-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performRevoke = async (
  query: RevokeIndicateurPermissionQuery,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: query.principalId } })
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: query.indicateurPublicId },
    select: { id: true },
  })

  await db().indicateurPermission.deleteMany({
    where: {
      principalId: query.principalId,
      indicateurId: indicateur.id,
      ...(query.action ? { action: query.action } : {}),
    },
  })

  return loadPrincipalPermissions(query.principalId)
}

export const revokeIndicateurPermission = (
  query: RevokeIndicateurPermissionQuery,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performRevoke(query))
