import { type GrantIndicateurPermissionBody } from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performGrant = async (body: GrantIndicateurPermissionBody): Promise<void> => {
  ensureAdmin()
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
}

export const grantIndicateurPermission = (
  body: GrantIndicateurPermissionBody,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performGrant(body))
