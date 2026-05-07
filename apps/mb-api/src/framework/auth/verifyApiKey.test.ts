import { describe, expect, it } from 'vitest'

import { env } from '@/env'
import { verifyApiKey } from '@/framework/auth/verifyApiKey'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('verifyApiKey', () => {
  it(
    'returns the api key principal when the key exists and is active',
    integrationTest(async () => {
      const row = await fixtures.apiKey({
        rawKey: 'mb_live_active_key_for_test_value',
        label: 'partenaire X',
      })

      const result = await verifyApiKey(
        'mb_live_active_key_for_test_value',
        env.API_KEY_HMAC_SECRET,
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ id: row.id, label: 'partenaire X' })
    }),
  )

  it(
    'returns null when the key is unknown',
    integrationTest(async () => {
      const result = await verifyApiKey(
        'mb_live_unknown_key_value_xx',
        env.API_KEY_HMAC_SECRET,
      )
      expect(result._unsafeUnwrap()).toBeNull()
    }),
  )

  it(
    'returns null when the key is revoked',
    integrationTest(async () => {
      await fixtures.apiKey({
        rawKey: 'mb_live_revoked_key_for_test_value',
        revokedAt: new Date('2026-01-01'),
      })

      const result = await verifyApiKey(
        'mb_live_revoked_key_for_test_value',
        env.API_KEY_HMAC_SECRET,
      )

      expect(result._unsafeUnwrap()).toBeNull()
    }),
  )

  it(
    'returns null when the key has expired',
    integrationTest(async () => {
      await fixtures.apiKey({
        rawKey: 'mb_live_expired_key_for_test_value',
        expiresAt: new Date('2020-01-01'),
      })

      const result = await verifyApiKey(
        'mb_live_expired_key_for_test_value',
        env.API_KEY_HMAC_SECRET,
      )

      expect(result._unsafeUnwrap()).toBeNull()
    }),
  )
})
