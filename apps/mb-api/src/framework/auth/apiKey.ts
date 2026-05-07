import { createHmac, randomBytes } from 'node:crypto'

import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { env } from '@/env'
import type { ApiKeyAuthentifiee } from '@/framework/auth/userContext'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'

export const API_KEY_PREFIX = 'mb_live_'

const PREFIX_VISIBLE_LENGTH = 16

export const looksLikeApiKey = (token: string): boolean => token.startsWith(API_KEY_PREFIX)

export const hashApiKey = (rawKey: string): string =>
  createHmac('sha256', env.API_KEY_HMAC_SECRET).update(rawKey).digest('hex')

export type GeneratedApiKey = {
  id: string
  rawKey: string
  keyHash: string
  prefix: string
}

export const buildApiKey = (): GeneratedApiKey => {
  const randomPart = randomBytes(32).toString('base64url')
  const rawKey = `${API_KEY_PREFIX}${randomPart}`
  return {
    id: uuidv7(),
    rawKey,
    keyHash: hashApiKey(rawKey),
    prefix: rawKey.slice(0, PREFIX_VISIBLE_LENGTH),
  }
}

export const verifyApiKey = (
  rawKey: string,
): ResultAsync<ApiKeyAuthentifiee | null, never> =>
  ResultAsync.fromSafePromise(resolveApiKey(rawKey))

const resolveApiKey = async (rawKey: string): Promise<ApiKeyAuthentifiee | null> => {
  const keyHash = hashApiKey(rawKey)
  const row = await db().apiKey.findUnique({
    where: { keyHash },
    select: { id: true, label: true, revokedAt: true, expiresAt: true },
  })
  if (!row) return null

  if (row.revokedAt) {
    logger.warn(
      { event: 'auth.api_key.revoked', apiKeyId: row.id },
      'Revoked API key used',
    )
    return null
  }

  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    logger.warn(
      { event: 'auth.api_key.expired', apiKeyId: row.id },
      'Expired API key used',
    )
    return null
  }

  void db()
    .apiKey.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((error: unknown) => {
      logger.warn(
        { event: 'auth.api_key.last_used_update_failed', err: error },
        'Failed to update API key lastUsedAt',
      )
    })

  return { id: row.id, label: row.label }
}
