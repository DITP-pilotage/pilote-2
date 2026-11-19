import { describe, expect, it } from 'vitest'

import { checkCleApiRevocable } from '@/apiKey/rules'

const CLE_ID = '00000000-0000-0000-0000-000000000001'
const AUTRE_ID = '00000000-0000-0000-0000-000000000002'

describe.concurrent('checkCleApiRevocable', () => {
  it('accepte une clé active autre que celle de la requête', () => {
    const result = checkCleApiRevocable({
      cleApi: { id: CLE_ID, revokedAt: null },
      principalId: AUTRE_ID,
    })
    expect(result.isOk()).toBe(true)
  })

  it('rejette la clé qui fait la requête', () => {
    const result = checkCleApiRevocable({
      cleApi: { id: CLE_ID, revokedAt: null },
      principalId: CLE_ID,
    })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'CLE_API_COURANTE' })
  })

  it('rejette une clé déjà révoquée', () => {
    const result = checkCleApiRevocable({
      cleApi: { id: CLE_ID, revokedAt: new Date('2026-01-01T00:00:00Z') },
      principalId: AUTRE_ID,
    })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'CLE_API_DEJA_REVOQUEE' })
  })
})
