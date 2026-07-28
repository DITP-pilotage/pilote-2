import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'

const performRemove = async (publicId: string, utilisateurId: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  await db().collectionResponsable.deleteMany({
    where: { collection: { publicId }, utilisateurId },
  })
}

export const removeCollectionResponsable = (
  publicId: string,
  utilisateurId: string,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performRemove(publicId, utilisateurId))
