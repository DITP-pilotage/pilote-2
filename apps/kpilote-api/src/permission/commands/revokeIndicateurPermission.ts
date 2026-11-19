import { type RevokeIndicateurPermissionQuery } from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performRevoke = async (query: RevokeIndicateurPermissionQuery): Promise<void> => {
  ensureAdmin()
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
}

export const revokeIndicateurPermission = (
  query: RevokeIndicateurPermissionQuery,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performRevoke(query))
