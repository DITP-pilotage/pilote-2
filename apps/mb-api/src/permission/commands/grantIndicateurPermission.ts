import {
  type GrantIndicateurPermissionBody,
  type PrincipalPermissionsApiModel,
} from '@pilote/mb-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performGrant = async (
  body: GrantIndicateurPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: body.indicateurPublicId },
    select: { id: true },
  })

  await db().indicateurPermission.upsert({
    where: {
      principalId_indicateurId_action: {
        principalId: body.principalId,
        indicateurId: indicateur.id,
        action: body.action,
      },
    },
    create: { principalId: body.principalId, indicateurId: indicateur.id, action: body.action },
    update: {},
  })

  return loadPrincipalPermissions(body.principalId)
}

export const grantIndicateurPermission = (
  body: GrantIndicateurPermissionBody,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performGrant(body))
