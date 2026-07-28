import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'

const performRemove = async (publicId: string, indicateurPublicId: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  await db().collectionIndicateur.deleteMany({
    where: { collection: { publicId }, indicateur: { publicId: indicateurPublicId } },
  })
}

export const removeCollectionIndicateur = (
  publicId: string,
  indicateurPublicId: string,
): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performRemove(publicId, indicateurPublicId))
