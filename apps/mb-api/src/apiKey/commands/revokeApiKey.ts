import { type ApiKeyApiModel } from '@pilote/mb-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { ensurePrincipal } from '@/framework/auth/ensurePrincipal'
import { isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { now } from '@/framework/date'
import { ConflictError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

const performRevoke = async (id: string): Promise<ApiKeyApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

  if (id === requireCurrentPrincipalId()) {
    throw new ConflictError('Impossible de révoquer la clé API utilisée pour cette requête')
  }

  const existing = await db().apiKey.findUniqueOrThrow({ where: { id } })
  if (existing.revokedAt) {
    throw new ConflictError('Cette clé API est déjà révoquée')
  }

  const revoked = await db().apiKey.update({
    where: { id },
    data: { revokedAt: now() },
  })

  return toApiKeyApiModel(revoked)
}

export const revokeApiKey = (id: string): ResultAsync<ApiKeyApiModel, never> =>
  ResultAsync.fromSafePromise(performRevoke(id))
