import { describe, expect, it } from 'vitest'

import { checkCommentaireConfiance } from '@/niveauConfiance/rules'

describe.concurrent('checkCommentaireConfiance', () => {
  it('accepte un commentaire CONFIANCE', () => {
    expect(checkCommentaireConfiance({ typeCommentaire: 'CONFIANCE' }).isOk()).toBe(true)
  })

  it('rejette un commentaire d’un autre type', () => {
    const result = checkCommentaireConfiance({ typeCommentaire: 'DEFAUT' })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'COMMENTAIRE_PAS_CONFIANCE' })
  })

  it('rejette un commentaire sans sujet', () => {
    const result = checkCommentaireConfiance({ typeCommentaire: null })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'COMMENTAIRE_PAS_CONFIANCE' })
  })
})
