import { Temporal } from '@js-temporal/polyfill'
import { type ApiKeyApiModel, type ApiKeyStatus } from '@pilote/kpilote-shared/apiKey'

import { fromDate, now } from '@/framework/date'
import { type ApiKeyModel } from '@/generated/prisma/models'

export const computeApiKeyStatus = (
  apiKey: Pick<ApiKeyModel, 'revokedAt' | 'expiresAt'>,
  now: Temporal.Instant,
): ApiKeyStatus => {
  if (apiKey.revokedAt) return 'revoked'
  if (apiKey.expiresAt && Temporal.Instant.compare(fromDate(apiKey.expiresAt), now) <= 0)
    return 'expired'
  return 'active'
}

export const toApiKeyApiModel = (
  apiKey: ApiKeyModel,
  clock: Temporal.Instant = now(),
): ApiKeyApiModel => ({
  id: apiKey.id,
  label: apiKey.label,
  prefix: apiKey.prefix,
  role: apiKey.role,
  status: computeApiKeyStatus(apiKey, clock),
  createdAt: fromDate(apiKey.createdAt).toString(),
  expiresAt: apiKey.expiresAt ? fromDate(apiKey.expiresAt).toString() : null,
  revokedAt: apiKey.revokedAt ? fromDate(apiKey.revokedAt).toString() : null,
  lastUsedAt: apiKey.lastUsedAt ? fromDate(apiKey.lastUsedAt).toString() : null,
})
