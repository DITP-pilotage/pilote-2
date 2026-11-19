import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performSuppression = async (enfantPublicId: string): Promise<void> => {
  ensureAdmin()

  await db().relation.deleteMany({ where: { child: { publicId: enfantPublicId } } })
}

export const supprimerRelation = (enfantPublicId: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performSuppression(enfantPublicId))
