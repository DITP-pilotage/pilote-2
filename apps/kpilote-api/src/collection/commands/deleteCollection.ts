import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { MESSAGE_ADMIN } from '@/collection/utils'

// `deleteMany` plutôt que `delete` : idempotent, sans P2025 sur une collection
// déjà absente. Les jointures partent en cascade (onDelete: Cascade).
const performDelete = async (publicId: string): Promise<void> => {
  ensurePrincipal(isApiKeyAdmin, MESSAGE_ADMIN)

  await db().collection.deleteMany({ where: { publicId } })
}

export const deleteCollection = (publicId: string): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performDelete(publicId))
