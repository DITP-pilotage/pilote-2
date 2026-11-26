import { describe, expect, it } from 'vitest'

import { joinCsv, splitCsv } from './texte'

describe('splitCsv', () => {
  it('découpe sur les virgules en retirant les blancs et les segments vides', () => {
    expect(splitCsv(' DEPT-84, ,BV-05,')).toEqual(['DEPT-84', 'BV-05'])
  })

  it('donne une liste vide sans valeur', () => {
    expect(splitCsv(undefined)).toEqual([])
    expect(splitCsv('')).toEqual([])
  })
})

describe('joinCsv', () => {
  it('joint les valeurs par des virgules', () => {
    expect(joinCsv(['DEPT-84', 'BV-05'])).toBe('DEPT-84,BV-05')
  })

  it('donne undefined pour une liste vide', () => {
    expect(joinCsv([])).toBeUndefined()
  })
})
