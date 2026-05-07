import { describe, expect, it } from 'vitest'

import { API_KEY_PREFIX, buildApiKey, hashApiKey, looksLikeApiKey, verifyApiKey } from '@/framework/auth/apiKey'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('apiKey module', () => {
  describe('looksLikeApiKey', () => {
    it('returns true when the token starts with the public prefix', () => {
      expect(looksLikeApiKey('mb_live_abc')).toBe(true)
    })

    it('returns false for a JWT-shaped token', () => {
      expect(looksLikeApiKey('eyJhbGciOiJSUzI1NiJ9.payload.signature')).toBe(false)
    })
  })

  describe('hashApiKey', () => {
    it('is deterministic and produces a 64-char hex digest', () => {
      const first = hashApiKey('mb_live_some_value')
      const second = hashApiKey('mb_live_some_value')
      expect(first).toBe(second)
      expect(first).toMatch(/^[a-f0-9]{64}$/)
    })

    it('produces different hashes for different inputs', () => {
      expect(hashApiKey('mb_live_a')).not.toBe(hashApiKey('mb_live_b'))
    })
  })

  describe('buildApiKey', () => {
    it('builds a key with the public prefix and a matching hash', () => {
      const generated = buildApiKey()
      expect(generated.rawKey.startsWith(API_KEY_PREFIX)).toBe(true)
      expect(generated.keyHash).toBe(hashApiKey(generated.rawKey))
      expect(generated.prefix).toHaveLength(16)
      expect(generated.prefix).toBe(generated.rawKey.slice(0, 16))
    })

    it('produces unique keys on each call', () => {
      const a = buildApiKey()
      const b = buildApiKey()
      expect(a.rawKey).not.toBe(b.rawKey)
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('verifyApiKey', () => {
    it(
      'returns the api key principal when the key exists and is active',
      integrationTest(async () => {
        const row = await fixtures.apiKey({
          rawKey: 'mb_live_active_key_for_test_value',
          label: 'partenaire X',
        })

        const result = await verifyApiKey('mb_live_active_key_for_test_value')

        expect(result.isOk()).toBe(true)
        expect(result._unsafeUnwrap()).toEqual({ id: row.id, label: 'partenaire X' })
      }),
    )

    it(
      "returns null when the key is unknown",
      integrationTest(async () => {
        const result = await verifyApiKey('mb_live_unknown_key_value_xx')
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

        const result = await verifyApiKey('mb_live_revoked_key_for_test_value')

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

        const result = await verifyApiKey('mb_live_expired_key_for_test_value')

        expect(result._unsafeUnwrap()).toBeNull()
      }),
    )
  })
})
