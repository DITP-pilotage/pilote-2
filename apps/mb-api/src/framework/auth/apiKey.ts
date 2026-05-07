import { createHmac, randomBytes } from 'node:crypto'

import { uuidv7 } from 'uuidv7'

export const API_KEY_PREFIX = 'pilote_live_'

const PREFIX_VISIBLE_LENGTH = API_KEY_PREFIX.length + 8

export const looksLikeApiKey = (token: string): boolean => token.startsWith(API_KEY_PREFIX)

export const hashApiKey = (rawKey: string, secret: string): string =>
  createHmac('sha256', secret).update(rawKey).digest('hex')

export type GeneratedApiKey = {
  id: string
  rawKey: string
  keyHash: string
  prefix: string
}

export const buildApiKey = (secret: string): GeneratedApiKey => {
  const randomPart = randomBytes(32).toString('base64url')
  const rawKey = `${API_KEY_PREFIX}${randomPart}`
  return {
    id: uuidv7(),
    rawKey,
    keyHash: hashApiKey(rawKey, secret),
    prefix: rawKey.slice(0, PREFIX_VISIBLE_LENGTH),
  }
}
