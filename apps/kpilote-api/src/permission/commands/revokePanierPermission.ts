import {
  type PrincipalPermissionsApiModel,
  type RevokePanierPermissionQuery,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performRevoke = async (
  query: RevokePanierPermissionQuery,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: query.principalId } })
  const panier = await db().panier.findUniqueOrThrow({
    where: { publicId: query.panierPublicId },
    select: { id: true },
  })

  await db().panierPermission.deleteMany({
    where: {
      principalId: query.principalId,
      panierId: panier.id,
      ...(query.action ? { action: query.action } : {}),
    },
  })

  return loadPrincipalPermissions(query.principalId)
}

export const revokePanierPermission = (
  query: RevokePanierPermissionQuery,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performRevoke(query))
