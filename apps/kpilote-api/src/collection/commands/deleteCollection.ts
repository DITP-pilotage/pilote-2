import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

// `deleteMany` plutôt que `delete` : idempotent, sans P2025 sur une collection
// déjà absente. Les jointures partent en cascade (onDelete: Cascade).
const performDelete = async (publicId: string): Promise<void> => {
  ensureAdmin()

  await db().collection.deleteMany({ where: { publicId } })
}

export const deleteCollection = (publicId: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performDelete(publicId))
