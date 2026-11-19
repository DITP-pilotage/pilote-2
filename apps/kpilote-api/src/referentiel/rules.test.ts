import { describe, expect, it } from 'vitest'

import { checkIndividusLibres } from '@/referentiel/rules'

describe.concurrent('checkIndividusLibres', () => {
  it('accepte des individus nouveaux ou déjà dans le référentiel', () => {
    const result = checkIndividusLibres({
      referentielId: 'ref',
      individusExistants: [{ publicId: 'DEPT-84', referentielId: 'ref' }],
    })
    expect(result.isOk()).toBe(true)
  })

  it('rejette des individus rattachés à un autre référentiel, triés', () => {
    const result = checkIndividusLibres({
      referentielId: 'ref',
      individusExistants: [
        { publicId: 'DEPT-84', referentielId: 'autre' },
        { publicId: 'DEPT-13', referentielId: 'autre' },
        { publicId: 'DEPT-30', referentielId: 'ref' },
      ],
    })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'INDIVIDUS_ALREADY_ATTACHED',
      individuIds: ['DEPT-13', 'DEPT-84'],
    })
  })

  it('rejette tout individu existant pour un référentiel nouveau', () => {
    const result = checkIndividusLibres({
      referentielId: null,
      individusExistants: [{ publicId: 'DEPT-84', referentielId: 'autre' }],
    })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'INDIVIDUS_ALREADY_ATTACHED',
      individuIds: ['DEPT-84'],
    })
  })
})
