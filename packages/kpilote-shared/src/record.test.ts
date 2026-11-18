import { keyBy } from 'es-toolkit'
import { describe, expect, it } from 'vitest'

import { toMap } from './record'

describe('toMap', () => {
  it('convertit un record en map avec les mêmes entrées', () => {
    const individus = [
      { id: 'DEPT-13', nom: 'Bouches-du-Rhône' },
      { id: 'DEPT-84', nom: 'Vaucluse' },
    ]

    const individuById = toMap(keyBy(individus, (individu) => individu.id))

    expect([...individuById.entries()]).toEqual([
      ['DEPT-13', { id: 'DEPT-13', nom: 'Bouches-du-Rhône' }],
      ['DEPT-84', { id: 'DEPT-84', nom: 'Vaucluse' }],
    ])
  })

  it('renvoie une map vide pour un record vide', () => {
    expect(toMap({}).size).toBe(0)
  })
})
