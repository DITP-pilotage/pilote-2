import {
  type PrincipalPermissionsApiModel,
  type RevokeDossierPermissionQuery,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performRevoke = async (
  query: RevokeDossierPermissionQuery,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: query.principalId } })
  const dossier = await db().dossier.findUniqueOrThrow({
    where: { publicId: query.dossierPublicId },
    select: { id: true },
  })

  await db().dossierPermission.deleteMany({
    where: {
      principalId: query.principalId,
      dossierId: dossier.id,
      ...(query.action ? { action: query.action } : {}),
    },
  })

  return loadPrincipalPermissions(query.principalId)
}

export const revokeDossierPermission = (
  query: RevokeDossierPermissionQuery,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performRevoke(query))
