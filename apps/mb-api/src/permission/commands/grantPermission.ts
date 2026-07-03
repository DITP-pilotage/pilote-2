import {
  type GrantPermissionBody,
  type PrincipalPermissionsApiModel,
} from '@pilote/mb-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'
import { resolveResourceId } from '@/permission/utils'

const performGrant = async (body: GrantPermissionBody): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })

  const resourceId = await resolveResourceId(body.resourceType, body.resourcePublicId)

  if (body.resourceType === 'PANIER') {
    await db().panierPermission.upsert({
      where: {
        principalId_panierId_action: {
          principalId: body.principalId,
          panierId: resourceId,
          action: body.action,
        },
      },
      create: { principalId: body.principalId, panierId: resourceId, action: body.action },
      update: {},
    })
  } else {
    await db().indicateurPermission.upsert({
      where: {
        principalId_indicateurId_action: {
          principalId: body.principalId,
          indicateurId: resourceId,
          action: body.action,
        },
      },
      create: { principalId: body.principalId, indicateurId: resourceId, action: body.action },
      update: {},
    })
  }

  return loadPrincipalPermissions(body.principalId)
}

export const grantPermission = (
  body: GrantPermissionBody,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performGrant(body))
