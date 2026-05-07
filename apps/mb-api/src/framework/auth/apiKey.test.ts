import { describe, expect, it } from 'vitest'

import { API_KEY_PREFIX, buildApiKey, hashApiKey, looksLikeApiKey } from '@/framework/auth/apiKey'

const TEST_SECRET = 'unit-test-secret-must-be-32-bytes-min'

describe.concurrent('apiKey', () => {
  describe('looksLikeApiKey', () => {
    it('renvoie true quand le token commence par le préfixe public', () => {
      expect(looksLikeApiKey('pilote_live_abc')).toBe(true)
    })

    it("renvoie false pour un token de format JWT", () => {
      expect(looksLikeApiKey('eyJhbGciOiJSUzI1NiJ9.payload.signature')).toBe(false)
    })
  })

  describe('hashApiKey', () => {
    it('est déterministe et produit un digest hex de 64 caractères', () => {
      const first = hashApiKey('pilote_live_some_value', TEST_SECRET)
      const second = hashApiKey('pilote_live_some_value', TEST_SECRET)
      expect(first).toBe(second)
      expect(first).toMatch(/^[a-f0-9]{64}$/)
    })

    it('produit des hashs différents pour des entrées différentes', () => {
      expect(hashApiKey('pilote_live_a', TEST_SECRET)).not.toBe(
        hashApiKey('pilote_live_b', TEST_SECRET),
      )
    })

    it('produit des hashs différents pour des secrets différents', () => {
      const a = hashApiKey('pilote_live_same', TEST_SECRET)
      const b = hashApiKey('pilote_live_same', 'another-secret-must-be-32-bytes-min')
      expect(a).not.toBe(b)
    })
  })

  describe('buildApiKey', () => {
    it('construit une clé avec le préfixe public et un hash cohérent', () => {
      const generated = buildApiKey(TEST_SECRET)
      expect(generated.rawKey.startsWith(API_KEY_PREFIX)).toBe(true)
      expect(generated.keyHash).toBe(hashApiKey(generated.rawKey, TEST_SECRET))
      expect(generated.prefix).toHaveLength(API_KEY_PREFIX.length + 8)
      expect(generated.prefix).toBe(generated.rawKey.slice(0, API_KEY_PREFIX.length + 8))
    })

    it('produit des clés uniques à chaque appel', () => {
      const a = buildApiKey(TEST_SECRET)
      const b = buildApiKey(TEST_SECRET)
      expect(a.rawKey).not.toBe(b.rawKey)
      expect(a.id).not.toBe(b.id)
    })
  })
})
