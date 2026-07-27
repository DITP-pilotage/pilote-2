import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/relation/utils'

const performSuppression = async (enfantPublicId: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  await db().relation.deleteMany({ where: { child: { publicId: enfantPublicId } } })
}

export const supprimerRelation = (enfantPublicId: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performSuppression(enfantPublicId))
