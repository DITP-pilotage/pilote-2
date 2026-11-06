import { describe, expect, it } from 'vitest'

import { buildNodesCube, DIMENSIONS_CUBE } from '@/tests/factories/dimensions'

import { construireDecomposition, membresDecomposition } from './decomposition'

const DEPT_84 = { dimension: 'DIM-TERRITOIRE', individu: 'DEPT-84', referentiel: 'REF-DEPT' }
const ORANGE = { dimension: 'DIM-OPERATEUR', individu: 'OP-ORANGE', referentiel: 'REF-OPERATEUR' }

const nodes = buildNodesCube()
const territoire = nodes.filter((n) => n.referentiel.dimension === 'DIM-TERRITOIRE')
const operateurs = nodes.filter((n) => n.referentiel.dimension === 'DIM-OPERATEUR')
const ids = (membres: ReadonlyArray<{ individu: { id: string } }>) =>
  membres.map((m) => m.individu.id)

describe('membresDecomposition', () => {
  it('« Tous » sur une dimension plate : tous ses membres', () => {
    expect(ids(membresDecomposition({ nodes: operateurs, individu: null }))).toEqual([
      'OP-ORANGE',
      'OP-SFR',
    ])
  })

  it('« Tous » sur une hiérarchie à racine unique : descend sous la racine', () => {
    expect(ids(membresDecomposition({ nodes: territoire, individu: null }))).toEqual([
      'DEPT-13',
      'DEPT-84',
    ])
  })

  it('coordonnée fixée : ses enfants déclarés', () => {
    expect(ids(membresDecomposition({ nodes: territoire, individu: 'FR' }))).toEqual([
      'DEPT-13',
      'DEPT-84',
    ])
  })

  it('feuille : aucun membre', () => {
    expect(membresDecomposition({ nodes: territoire, individu: 'DEPT-84' })).toEqual([])
  })
})

describe('construireDecomposition', () => {
  it('une série par membre, coordonnée de la dimension remplacée, ordre canonique', () => {
    expect(
      construireDecomposition({
        coordonnees: [DEPT_84],
        dimensions: DIMENSIONS_CUBE,
        dimension: 'DIM-OPERATEUR',
        membres: operateurs,
      }),
    ).toEqual({
      total: 2,
      series: [
        { cellule: 'DEPT-84~OP-ORANGE', individu: 'OP-ORANGE', nom: 'Orange' },
        { cellule: 'DEPT-84~OP-SFR', individu: 'OP-SFR', nom: 'SFR' },
      ],
    })
  })

  it('remplace une coordonnée déjà fixée', () => {
    expect(
      construireDecomposition({
        coordonnees: [DEPT_84, ORANGE],
        dimensions: DIMENSIONS_CUBE,
        dimension: 'DIM-TERRITOIRE',
        membres: territoire.filter((n) => n.depth === 1),
      }).series.map((s) => s.cellule),
    ).toEqual(['DEPT-13~OP-ORANGE', 'DEPT-84~OP-ORANGE'])
  })

  it('plafonne le nombre de séries et garde le total', () => {
    const decomposition = construireDecomposition({
      coordonnees: [DEPT_84],
      dimensions: DIMENSIONS_CUBE,
      dimension: 'DIM-OPERATEUR',
      membres: operateurs,
      max: 1,
    })
    expect(decomposition.total).toBe(2)
    expect(decomposition.series.map((s) => s.individu)).toEqual(['OP-ORANGE'])
  })
})
