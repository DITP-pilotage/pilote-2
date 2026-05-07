import { describe, expect, it } from 'vitest'

import { API_KEY_PREFIX, buildApiKey, hashApiKey, looksLikeApiKey } from '@/framework/auth/apiKey'

const TEST_SECRET = 'unit-test-secret-must-be-32-bytes-min'

describe.concurrent('apiKey', () => {
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
      const first = hashApiKey('mb_live_some_value', TEST_SECRET)
      const second = hashApiKey('mb_live_some_value', TEST_SECRET)
      expect(first).toBe(second)
      expect(first).toMatch(/^[a-f0-9]{64}$/)
    })

    it('produces different hashes for different inputs', () => {
      expect(hashApiKey('mb_live_a', TEST_SECRET)).not.toBe(hashApiKey('mb_live_b', TEST_SECRET))
    })

    it('produces different hashes for different secrets', () => {
      const a = hashApiKey('mb_live_same', TEST_SECRET)
      const b = hashApiKey('mb_live_same', 'another-secret-must-be-32-bytes-min')
      expect(a).not.toBe(b)
    })
  })

  describe('buildApiKey', () => {
    it('builds a key with the public prefix and a matching hash', () => {
      const generated = buildApiKey(TEST_SECRET)
      expect(generated.rawKey.startsWith(API_KEY_PREFIX)).toBe(true)
      expect(generated.keyHash).toBe(hashApiKey(generated.rawKey, TEST_SECRET))
      expect(generated.prefix).toHaveLength(16)
      expect(generated.prefix).toBe(generated.rawKey.slice(0, 16))
    })

    it('produces unique keys on each call', () => {
      const a = buildApiKey(TEST_SECRET)
      const b = buildApiKey(TEST_SECRET)
      expect(a.rawKey).not.toBe(b.rawKey)
      expect(a.id).not.toBe(b.id)
    })
  })
})
