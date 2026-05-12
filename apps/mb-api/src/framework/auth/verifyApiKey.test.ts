import { describe, expect, it } from 'vitest'

import { env } from '@/env'
import { verifyApiKey } from '@/framework/auth/verifyApiKey'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('verifyApiKey', () => {
  it(
    'renvoie le principal API key quand la clé existe et est active',
    integrationTest(async () => {
      const row = await fixtures.apiKey({
        rawKey: 'pilote_live_active_key_for_test_value',
        label: 'partenaire X',
      })

      const result = await verifyApiKey(
        'pilote_live_active_key_for_test_value',
        env.API_KEY_HMAC_SECRET,
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({ id: row.id, label: 'partenaire X' })
    }),
  )

  it(
    'renvoie null quand la clé est inconnue',
    integrationTest(async () => {
      const result = await verifyApiKey('pilote_live_unknown_key_value_xx', env.API_KEY_HMAC_SECRET)
      expect(result._unsafeUnwrap()).toBeNull()
    }),
  )

  it(
    'renvoie null quand la clé a été révoquée',
    integrationTest(async () => {
      await fixtures.apiKey({
        rawKey: 'pilote_live_revoked_key_for_test_value',
        revokedAt: new Date('2026-01-01'),
      })

      const result = await verifyApiKey(
        'pilote_live_revoked_key_for_test_value',
        env.API_KEY_HMAC_SECRET,
      )

      expect(result._unsafeUnwrap()).toBeNull()
    }),
  )

  it(
    'renvoie null quand la clé a expiré',
    integrationTest(async () => {
      await fixtures.apiKey({
        rawKey: 'pilote_live_expired_key_for_test_value',
        expiresAt: new Date('2020-01-01'),
      })

      const result = await verifyApiKey(
        'pilote_live_expired_key_for_test_value',
        env.API_KEY_HMAC_SECRET,
      )

      expect(result._unsafeUnwrap()).toBeNull()
    }),
  )
})
