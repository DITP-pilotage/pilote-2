import { describe, expect, it } from 'vitest'

import {
  choisirDimensionsColonnes,
  normaliserLibelle,
} from '@/valeurImport/choisirDimensionsColonnes'

const territoire = {
  publicId: 'DIM-TERRITOIRE',
  nom: 'Territoire',
  rang: 0,
  membres: [
    { publicId: 'COM-ORANGE', nom: 'Orange' },
    { publicId: 'COM-AVIGNON', nom: 'Avignon' },
    { publicId: 'COM-SAINT-ETIENNE', nom: 'Saint-Étienne' },
  ],
}
const operateur = {
  publicId: 'DIM-OPERATEUR',
  nom: 'Opérateur',
  rang: 1,
  membres: [
    { publicId: 'OP-ORANGE', nom: 'Orange' },
    { publicId: 'OP-SFR', nom: 'SFR' },
  ],
}

describe('normaliserLibelle', () => {
  it('ignore casse, accents et ponctuation', () => {
    expect(normaliserLibelle('  Saint-Étienne ')).toBe(normaliserLibelle('saint etienne'))
  })
})

describe('choisirDimensionsColonnes', () => {
  it('rattache chaque colonne à la dimension dont les membres correspondent le mieux, malgré un libellé commun', () => {
    const { affectations, colonnesIgnorees } = choisirDimensionsColonnes({
      colonnes: [
        { colonne: 'operateur', libelles: ['Orange', 'SFR'] },
        { colonne: 'commune', libelles: ['Orange', 'Avignon', 'saint etienne'] },
      ],
      dimensions: [territoire, operateur],
    })
    expect(affectations.map(({ colonne, dimension }) => [colonne, dimension.publicId])).toEqual([
      ['operateur', 'DIM-OPERATEUR'],
      ['commune', 'DIM-TERRITOIRE'],
    ])
    expect(colonnesIgnorees).toEqual([])
  })

  it('reconnaît les publicIds comme correspondances exactes', () => {
    const { affectations } = choisirDimensionsColonnes({
      colonnes: [
        { colonne: 'a', libelles: ['OP-SFR'] },
        { colonne: 'b', libelles: ['COM-AVIGNON'] },
      ],
      dimensions: [territoire, operateur],
    })
    expect(affectations.map(({ dimension }) => dimension.publicId)).toEqual([
      'DIM-OPERATEUR',
      'DIM-TERRITOIRE',
    ])
  })

  it('sans correspondance exacte, une colonne prend la première dimension restante', () => {
    const { affectations } = choisirDimensionsColonnes({
      colonnes: [
        { colonne: 'zone', libelles: ['Vaucluse ?'] },
        { colonne: 'operateur', libelles: ['SFR'] },
      ],
      dimensions: [territoire, operateur],
    })
    expect(affectations.map(({ colonne, dimension }) => [colonne, dimension.publicId])).toEqual([
      ['zone', 'DIM-TERRITOIRE'],
      ['operateur', 'DIM-OPERATEUR'],
    ])
  })

  it('ignore une colonne de trop (plus de colonnes que de dimensions)', () => {
    const { affectations, colonnesIgnorees } = choisirDimensionsColonnes({
      colonnes: [
        { colonne: 'commune', libelles: ['Avignon'] },
        { colonne: 'operateur', libelles: ['SFR'] },
        { colonne: 'type', libelles: ['Fixe'] },
      ],
      dimensions: [territoire, operateur],
    })
    expect(affectations.map(({ colonne }) => colonne)).toEqual(['commune', 'operateur'])
    expect(colonnesIgnorees).toEqual(['type'])
  })
})
