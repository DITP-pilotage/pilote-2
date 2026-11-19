import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performRemove = async (publicId: string, indicateurPublicId: string): Promise<void> => {
  ensureAdmin()

  await db().collectionIndicateur.deleteMany({
    where: { collection: { publicId }, indicateur: { publicId: indicateurPublicId } },
  })
}

export const removeCollectionIndicateur = (
  publicId: string,
  indicateurPublicId: string,
): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performRemove(publicId, indicateurPublicId))
