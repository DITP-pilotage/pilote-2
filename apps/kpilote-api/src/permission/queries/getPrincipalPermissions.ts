import { type PrincipalPermissionsApiModel } from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performGet = async (principalId: string): Promise<PrincipalPermissionsApiModel> => {
  ensureAdmin()
  await db().principal.findUniqueOrThrow({ where: { id: principalId } }) // 404 si inconnu
  return loadPrincipalPermissions(principalId)
}

export const getPrincipalPermissions = (
  principalId: string,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performGet(principalId))
