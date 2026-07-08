import { type CreateApiKeyBody, type CreatedApiKeyApiModel } from '@pilote/kpilote-shared/apiKey'
import { ResultAsync } from 'neverthrow'

import { toApiKeyApiModel } from '@/apiKey/utils'
import { env } from '@/env'
import { buildApiKey } from '@/framework/auth/apiKey'
import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { parseIsoInstant, toDate } from '@/framework/date'
import { db } from '@/framework/persistence/dbStore'

const performCreate = async (body: CreateApiKeyBody): Promise<CreatedApiKeyApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')

  const generated = buildApiKey(env.API_KEY_HMAC_SECRET)
  await db().principal.create({ data: { id: generated.id } })
  const created = await db().apiKey.create({
    data: {
      id: generated.id,
      label: body.label,
      keyHash: generated.keyHash,
      prefix: generated.prefix,
      role: body.role,
      expiresAt: body.expiresAt ? toDate(parseIsoInstant(body.expiresAt)) : null,
    },
  })

  return { ...toApiKeyApiModel(created), rawKey: generated.rawKey }
}

export const createApiKey = (body: CreateApiKeyBody): ResultAsync<CreatedApiKeyApiModel, never> =>
  ResultAsync.fromSafePromise(performCreate(body))
