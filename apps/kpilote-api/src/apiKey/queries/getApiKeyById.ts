import { type ApiKeyApiModel } from '@pilote/kpilote-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performGet = async (id: string): Promise<ApiKeyApiModel> => {
  ensureAdmin()
  const row = await db().apiKey.findUniqueOrThrow({ where: { id } })
  return toApiKeyApiModel(row)
}

export const getApiKeyById = (id: string): ResultAsync<ApiKeyApiModel, never> =>
  ResultAsync.fromSafePromise(performGet(id))
