import { describe, expect, it } from 'vitest'

import { computeApiKeyStatus } from '@/apiKey/utils'

const base = { revokedAt: null, expiresAt: null }
const NOW = new Date('2026-07-02T00:00:00.000Z')

describe('computeApiKeyStatus', () => {
  it('active quand ni révoquée ni expirée', () => {
    expect(computeApiKeyStatus(base, NOW)).toBe('active')
  })
  it('revoked prioritaire sur expired', () => {
    expect(
      computeApiKeyStatus(
        { revokedAt: new Date('2026-01-01'), expiresAt: new Date('2000-01-01') },
        NOW,
      ),
    ).toBe('revoked')
  })
  it('expired quand expiresAt est dans le passé', () => {
    expect(computeApiKeyStatus({ revokedAt: null, expiresAt: new Date('2000-01-01') }, NOW)).toBe(
      'expired',
    )
  })
  it('active quand expiresAt est dans le futur', () => {
    expect(computeApiKeyStatus({ revokedAt: null, expiresAt: new Date('2100-01-01') }, NOW)).toBe(
      'active',
    )
  })
})
