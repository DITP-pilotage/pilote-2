import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performRemove = async (publicId: string, utilisateurId: string): Promise<void> => {
  ensureAdmin()

  await db().collectionResponsable.deleteMany({
    where: { collection: { publicId }, utilisateurId },
  })
}

export const removeCollectionResponsable = (
  publicId: string,
  utilisateurId: string,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performRemove(publicId, utilisateurId))
