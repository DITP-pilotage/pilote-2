import {
  type GrantPanierPermissionBody,
  type PrincipalPermissionsApiModel,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performGrant = async (
  body: GrantPanierPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })
  const panier = await db().panier.findUniqueOrThrow({
    where: { publicId: body.panierPublicId },
    select: { id: true },
  })

  await db().panierPermission.upsert({
    where: {
      principalId_panierId_action: {
        principalId: body.principalId,
        panierId: panier.id,
        action: body.action,
      },
    },
    create: { principalId: body.principalId, panierId: panier.id, action: body.action },
    update: {},
  })

  return loadPrincipalPermissions(body.principalId)
}

export const grantPanierPermission = (
  body: GrantPanierPermissionBody,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performGrant(body))
