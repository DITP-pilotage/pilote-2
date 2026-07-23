import {
  type GrantCollectionPermissionBody,
  type PrincipalPermissionsApiModel,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performGrant = async (
  body: GrantCollectionPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })
  const collection = await db().collection.findUniqueOrThrow({
    where: { publicId: body.collectionPublicId },
    select: { id: true },
  })

  await db().collectionPermission.upsert({
    where: {
      principalId_collectionId_action: {
        principalId: body.principalId,
        collectionId: collection.id,
        action: body.action,
      },
    },
    create: { principalId: body.principalId, collectionId: collection.id, action: body.action },
    update: {},
  })

  return loadPrincipalPermissions(body.principalId)
}

export const grantCollectionPermission = (
  body: GrantCollectionPermissionBody,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performGrant(body))
