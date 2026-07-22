import { describe, expect, it } from 'vitest'
import { matriceVersRecords } from '@/components/import-valeurs/lecture/matriceVersRecords'

describe('matriceVersRecords', () => {
  it('projette chaque ligne en record indexé par les entêtes', () => {
    const records = matriceVersRecords({
      matrice: [
        ['libellé', 'janvier', 'février'],
        ['Paris', 12, 15],
        ['Lyon', 8, 9],
      ],
    })
    expect(records).toEqual([
      { libellé: 'Paris', janvier: 12, février: 15 },
      { libellé: 'Lyon', janvier: 8, février: 9 },
    ])
  })

  it('ignore les colonnes sans entête', () => {
    const records = matriceVersRecords({
      matrice: [
        ['a', '', 'c'],
        [1, 2, 3],
      ],
    })
    expect(records).toEqual([{ a: 1, c: 3 }])
  })

  it('filtre les lignes entièrement vides', () => {
    const records = matriceVersRecords({
      matrice: [['a', 'b'], ['1', '2'], ['', ''], []],
    })
    expect(records).toEqual([{ a: '1', b: '2' }])
  })

  it('renvoie un tableau vide si la matrice est vide', () => {
    expect(matriceVersRecords({ matrice: [] })).toEqual([])
  })
})
