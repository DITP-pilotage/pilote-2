import { type ApiKeyApiModel } from '@pilote/kpilote-shared/apiKey'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { now, toDate } from '@/framework/date'
import { db } from '@/framework/persistence/dbStore'

export type RevokeApiKeyError = { type: 'CLE_API_COURANTE' } | { type: 'CLE_API_DEJA_REVOQUEE' }

const performRevoke = async (id: string): Promise<Result<ApiKeyApiModel, RevokeApiKeyError>> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

  if (id === requireCurrentPrincipalId()) return err({ type: 'CLE_API_COURANTE' })

  const existing = await db().apiKey.findUniqueOrThrow({ where: { id } })
  if (existing.revokedAt) return err({ type: 'CLE_API_DEJA_REVOQUEE' })

  const revoked = await db().apiKey.update({
    where: { id },
    data: { revokedAt: toDate(now()) },
  })

  return ok(toApiKeyApiModel(revoked))
}

export const revokeApiKey = (id: string): ResultAsync<ApiKeyApiModel, RevokeApiKeyError> =>
  ResultAsync.fromSafePromise(performRevoke(id)).andThen((result) => result)
