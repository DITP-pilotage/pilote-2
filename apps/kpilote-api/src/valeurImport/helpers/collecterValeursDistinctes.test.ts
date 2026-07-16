import { describe, expect, it } from 'vitest'

import { collecterValeursDistinctes } from '@/valeurImport/helpers/collecterValeursDistinctes'

describe('collecterValeursDistinctes', () => {
  it('retourne les valeurs distinctes non vides en préservant la casse et l’ordre', () => {
    const rows = [{ type: 'va' }, { type: 'vc' }, { type: 'va' }, { type: 'vi' }]
    expect(collecterValeursDistinctes({ rows, colonne: 'type' })).toEqual(['va', 'vc', 'vi'])
  })

  it('applique trim, ignore null/undefined/cellules vides', () => {
    const rows = [
      { type: '  VA  ' },
      { type: '' },
      { type: null },
      { type: undefined },
      { autre: 'x' },
    ]
    expect(collecterValeursDistinctes({ rows, colonne: 'type' })).toEqual(['VA'])
  })

  it('retourne un tableau vide si la colonne est absente partout', () => {
    expect(collecterValeursDistinctes({ rows: [{ a: 1 }], colonne: 'type' })).toEqual([])
  })
})
