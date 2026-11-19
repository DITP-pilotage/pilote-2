import { describe, expect, it } from 'vitest'

import { checkBrouillonUnique } from '@/commentaire/rules'

describe.concurrent('checkBrouillonUnique', () => {
  it('accepte un commentaire publié, même si l’auteur a déjà un brouillon', () => {
    expect(checkBrouillonUnique({ statut: 'PUBLIE', brouillonExistant: true }).isOk()).toBe(true)
  })

  it('accepte un premier brouillon', () => {
    expect(checkBrouillonUnique({ statut: 'BROUILLON', brouillonExistant: false }).isOk()).toBe(
      true,
    )
  })

  it('rejette un second brouillon', () => {
    const result = checkBrouillonUnique({ statut: 'BROUILLON', brouillonExistant: true })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'BROUILLON_EXISTANT' })
  })
})
