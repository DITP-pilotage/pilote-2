import { ResultAsync } from 'neverthrow'

import { hashApiKey } from '@/framework/auth/apiKey'
import type { ApiKeyAuthentifiee } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'

export const verifyApiKey = (
  rawKey: string,
  secret: string,
): ResultAsync<ApiKeyAuthentifiee | null, never> =>
  ResultAsync.fromSafePromise(resolveApiKey(rawKey, secret))

const resolveApiKey = async (
  rawKey: string,
  secret: string,
): Promise<ApiKeyAuthentifiee | null> => {
  const keyHash = hashApiKey(rawKey, secret)
  const row = await db().apiKey.findUnique({ where: { keyHash } })
  if (!row) return null

  if (row.revokedAt) {
    logger.warn({ event: 'auth.api_key.revoked', apiKeyId: row.id }, 'Revoked API key used')
    return null
  }

  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    logger.warn({ event: 'auth.api_key.expired', apiKeyId: row.id }, 'Expired API key used')
    return null
  }

  try {
    await db().apiKey.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
  } catch (error: unknown) {
    logger.warn(
      { event: 'auth.api_key.last_used_update_failed', err: error },
      'Failed to update API key lastUsedAt',
    )
  }

  return { id: row.id, label: row.label, role: row.role }
}
