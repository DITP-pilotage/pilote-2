import { type ApiKeyApiModel } from '@pilote/kpilot-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'

const performGet = async (id: string): Promise<ApiKeyApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const row = await db().apiKey.findUniqueOrThrow({ where: { id } })
  return toApiKeyApiModel(row)
}

export const getApiKeyById = (id: string): ResultAsync<ApiKeyApiModel, never> =>
  ResultAsync.fromSafePromise(performGet(id))
