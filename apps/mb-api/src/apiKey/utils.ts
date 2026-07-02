import { type ApiKeyApiModel, type ApiKeyStatus } from '@pilote/mb-shared/apiKey'

import { type ApiKeyModel } from '@/generated/prisma/models'

export const computeApiKeyStatus = (
  apiKey: Pick<ApiKeyModel, 'revokedAt' | 'expiresAt'>,
  now: Date,
): ApiKeyStatus => {
  if (apiKey.revokedAt) return 'revoked'
  if (apiKey.expiresAt && apiKey.expiresAt.getTime() <= now.getTime()) return 'expired'
  return 'active'
}

export const toApiKeyApiModel = (apiKey: ApiKeyModel, now: Date = new Date()): ApiKeyApiModel => ({
  id: apiKey.id,
  label: apiKey.label,
  prefix: apiKey.prefix,
  role: apiKey.role,
  status: computeApiKeyStatus(apiKey, now),
  createdAt: apiKey.createdAt.toISOString(),
  expiresAt: apiKey.expiresAt ? apiKey.expiresAt.toISOString() : null,
  revokedAt: apiKey.revokedAt ? apiKey.revokedAt.toISOString() : null,
  lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : null,
})
