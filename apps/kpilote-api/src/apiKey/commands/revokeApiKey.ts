import { type ApiKeyApiModel } from '@pilote/kpilote-shared/apiKey'
import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { checkCleApiRevocable, type CleApiNonRevocableError } from '@/apiKey/rules'
import { toApiKeyApiModel } from '@/apiKey/utils'
import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { now, toDate } from '@/framework/date'
import { db } from '@/framework/persistence/dbStore'

export type RevokeApiKeyError = CleApiNonRevocableError

const performRevoke = async (id: string): Promise<Result<ApiKeyApiModel, RevokeApiKeyError>> => {
  ensureAdmin()

  const cleApi = await db().apiKey.findUniqueOrThrow({ where: { id } })

  const revocable = checkCleApiRevocable({ cleApi, principalId: requireCurrentPrincipalId() })
  if (revocable.isErr()) return err(revocable.error)

  const revoked = await db().apiKey.update({
    where: { id },
    data: { revokedAt: toDate(now()) },
  })

  return ok(toApiKeyApiModel(revoked))
}

export const revokeApiKey = (id: string): ResultAsync<ApiKeyApiModel, RevokeApiKeyError> =>
  new ResultAsync(performRevoke(id))
