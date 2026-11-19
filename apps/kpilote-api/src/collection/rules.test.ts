import { describe, expect, it } from 'vitest'

import { checkIndicateurNonAffecte, checkResponsableNonAffecte } from '@/collection/rules'

describe.concurrent('checkIndicateurNonAffecte', () => {
  it('accepte un indicateur absent de la collection', () => {
    expect(checkIndicateurNonAffecte({ dejaAffecte: false }).isOk()).toBe(true)
  })

  it('rejette un indicateur déjà affecté', () => {
    const result = checkIndicateurNonAffecte({ dejaAffecte: true })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'INDICATEUR_DEJA_AFFECTE' })
  })
})

describe.concurrent('checkResponsableNonAffecte', () => {
  it('accepte un utilisateur qui n’est pas encore responsable', () => {
    expect(checkResponsableNonAffecte({ dejaAffecte: false }).isOk()).toBe(true)
  })

  it('rejette un utilisateur déjà responsable', () => {
    const result = checkResponsableNonAffecte({ dejaAffecte: true })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'RESPONSABLE_DEJA_AFFECTE' })
  })
})
