import {
  type GrantDossierPermissionBody,
  type PrincipalPermissionsApiModel,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performGrant = async (
  body: GrantDossierPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })
  const dossier = await db().dossier.findUniqueOrThrow({
    where: { publicId: body.dossierPublicId },
    select: { id: true },
  })

  await db().dossierPermission.upsert({
    where: {
      principalId_dossierId_action: {
        principalId: body.principalId,
        dossierId: dossier.id,
        action: body.action,
      },
    },
    create: { principalId: body.principalId, dossierId: dossier.id, action: body.action },
    update: {},
  })

  return loadPrincipalPermissions(body.principalId)
}

export const grantDossierPermission = (
  body: GrantDossierPermissionBody,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performGrant(body))
