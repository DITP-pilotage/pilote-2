import { describe, expect, it } from 'vitest'

import { checkIndividuRattache } from '@/individu/rules'

const individu = { id: 'id-1', publicId: 'DEPT-84', referentielId: 'ref-dept' }

describe.concurrent('checkIndividuRattache', () => {
  it('renvoie l’individu quand son référentiel est lié à l’indicateur', () => {
    const result = checkIndividuRattache({
      individuPublicId: 'DEPT-84',
      individu,
      referentielIdsLies: new Set(['ref-dept']),
    })
    expect(result._unsafeUnwrap()).toBe(individu)
  })

  it('rejette un individu inconnu', () => {
    const result = checkIndividuRattache({
      individuPublicId: 'DEPT-99',
      individu: undefined,
      referentielIdsLies: new Set(['ref-dept']),
    })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'INDIVIDU_INCONNU', individu: 'DEPT-99' })
  })

  it('rejette, avec la même erreur, un individu hors des référentiels de l’indicateur', () => {
    const result = checkIndividuRattache({
      individuPublicId: 'DEPT-84',
      individu,
      referentielIdsLies: new Set(['ref-region']),
    })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'INDIVIDU_INCONNU', individu: 'DEPT-84' })
  })
})
