import {
  type PrincipalPermissionsApiModel,
  type RevokePermissionQuery,
} from '@pilote/mb-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'
import { resolveResourceId } from '@/permission/utils'

const performRevoke = async (
  query: RevokePermissionQuery,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: query.principalId } })

  const resourceId = await resolveResourceId(query.resourceType, query.resourcePublicId)

  if (query.resourceType === 'PANIER') {
    await db().panierPermission.deleteMany({
      where: {
        principalId: query.principalId,
        panierId: resourceId,
        ...(query.action ? { action: query.action } : {}),
      },
    })
  } else {
    await db().indicateurPermission.deleteMany({
      where: {
        principalId: query.principalId,
        indicateurId: resourceId,
        ...(query.action ? { action: query.action } : {}),
      },
    })
  }

  return loadPrincipalPermissions(query.principalId)
}

export const revokePermission = (
  query: RevokePermissionQuery,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performRevoke(query))
