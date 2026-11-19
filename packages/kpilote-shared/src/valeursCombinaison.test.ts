import { describe, expect, it } from 'vitest'

import { TOUS_ID } from './modaliteTree'
import { type ValeurAvancementApiModel } from './valeurAvancement'
import {
  buildAxeIndexByModalite,
  buildSeriesByCombinaison,
  combinaisonKey,
  explainCellule,
  listPeriodes,
  resolveCellule,
  toCombinaisonIds,
} from './valeursCombinaison'

const axes = [
  { modalites: [{ id: 'FT' }, { id: 'CAF' }] },
  { modalites: [{ id: 'FISCALE' }, { id: 'TVA' }, { id: 'SOCIALE' }] },
]
const axeIndexByModalite = buildAxeIndexByModalite(axes)

const saisie = (date: string, valeur: number): ValeurAvancementApiModel => ({
  indicateur: 'IND',
  individu: 'D84',
  date,
  valeur,
  type: 'saisie',
})

const derivee = ({
  date,
  valeur,
  individu = 'D84',
  contributions,
}: {
  date: string
  valeur: number
  individu?: string
  contributions: Array<{ individu?: string; modalites?: string[]; valeur: number | null }>
}): ValeurAvancementApiModel => ({
  indicateur: 'IND',
  individu,
  date,
  valeur,
  type: 'derivee',
  fonctionAgregation: 'SUM',
  contributions: contributions.map((contribution) => ({
    individu: contribution.individu ?? individu,
    valeur: contribution.valeur,
    date: contribution.valeur === null ? null : date,
    source: contribution.valeur === null ? 'manquante' : 'saisie',
    ...(contribution.modalites ? { modalites: contribution.modalites } : {}),
  })),
  couverture: {
    nbEnfantsAvecValeur: contributions.filter((contribution) => contribution.valeur !== null)
      .length,
    nbEnfantsTotal: contributions.length,
  },
})

describe('toCombinaisonIds', () => {
  it('place chaque modalité sur son axe, « Tous » ailleurs', () => {
    expect(toCombinaisonIds({ modalites: ['SOCIALE'], axeIndexByModalite, axesCount: 2 })).toEqual([
      TOUS_ID,
      'SOCIALE',
    ])
    expect(toCombinaisonIds({ modalites: [], axeIndexByModalite, axesCount: 2 })).toEqual([
      TOUS_ID,
      TOUS_ID,
    ])
  })
})

describe('buildSeriesByCombinaison et listPeriodes', () => {
  it('indexe les séries par combinaison et réunit leurs dates', () => {
    const series = buildSeriesByCombinaison({
      items: [
        { modalites: ['FT', 'TVA'], valeurs: [saisie('2025-03-01', 5), saisie('2025-01-01', 1)] },
        { modalites: ['CAF', 'SOCIALE'], valeurs: [saisie('2025-02-01', 2)] },
      ],
      axeIndexByModalite,
      axesCount: 2,
    })

    expect(series.get(combinaisonKey(['FT', 'TVA']))?.map((point) => point.date)).toEqual([
      '2025-01-01',
      '2025-03-01',
    ])
    expect(listPeriodes(series)).toEqual(['2025-01-01', '2025-02-01', '2025-03-01'])
  })
})

describe('resolveCellule', () => {
  const valeurs = [saisie('2025-02-01', 4), saisie('2025-04-01', 6)]

  it('distingue saisie, reportée, manquante et absente', () => {
    expect(resolveCellule({ valeurs, periode: '2025-02-01' })).toMatchObject({
      value: 4,
      statut: 'saisie',
    })
    expect(resolveCellule({ valeurs, periode: '2025-03-01' })).toMatchObject({
      value: 4,
      statut: 'reportee',
    })
    expect(resolveCellule({ valeurs, periode: '2025-01-01' })).toMatchObject({
      value: null,
      statut: 'manquante',
    })
    expect(resolveCellule({ valeurs: undefined, periode: '2025-01-01' })).toMatchObject({
      value: null,
      statut: 'absente',
    })
  })

  it('reprend la valeur et la couverture calculées par l’API', () => {
    const point = derivee({
      date: '2025-01-01',
      valeur: 4,
      contributions: [
        { modalites: ['FT', 'SOCIALE'], valeur: 4 },
        { modalites: ['CAF', 'SOCIALE'], valeur: null },
      ],
    })

    expect(resolveCellule({ valeurs: [point], periode: '2025-02-01' })).toEqual({
      value: 4,
      statut: 'calculee',
      present: 1,
      expected: 2,
      point,
    })
  })
})

describe('explainCellule', () => {
  it('trouve l’axe descendu par l’API et la combinaison de chaque terme', () => {
    const point = derivee({
      date: '2025-01-01',
      valeur: 4,
      contributions: [
        { modalites: ['FT', 'SOCIALE'], valeur: 4 },
        { modalites: ['CAF', 'SOCIALE'], valeur: null },
      ],
    })
    const cellule = resolveCellule({ valeurs: [point], periode: '2025-01-01' })

    const explication = explainCellule({
      cellule,
      ids: [TOUS_ID, 'SOCIALE'],
      axeIndexByModalite,
    })

    expect(explication).toMatchObject({
      kind: 'axe',
      axeIndex: 0,
      fonction: 'SUM',
      termes: [
        { ids: ['FT', 'SOCIALE'], valeur: 4, source: 'saisie' },
        { ids: ['CAF', 'SOCIALE'], valeur: null, source: 'manquante' },
      ],
    })
  })

  it('reconnaît un individu calculé à partir de ses individus enfants', () => {
    const point = derivee({
      date: '2025-01-01',
      valeur: 3,
      individu: 'PACA',
      contributions: [
        { individu: 'D84', modalites: ['FT'], valeur: 1 },
        { individu: 'D13', modalites: ['FT'], valeur: 2 },
      ],
    })
    const cellule = resolveCellule({ valeurs: [point], periode: '2025-01-01' })

    expect(explainCellule({ cellule, ids: ['FT', TOUS_ID], axeIndexByModalite })).toMatchObject({
      kind: 'individus',
      termes: [
        { individu: 'D84', ids: ['FT', TOUS_ID] },
        { individu: 'D13', ids: ['FT', TOUS_ID] },
      ],
    })
  })

  it('explique une saisie reportée par la date de sa source', () => {
    const cellule = resolveCellule({ valeurs: [saisie('2025-01-01', 7)], periode: '2025-03-01' })

    expect(explainCellule({ cellule, ids: ['FT', 'TVA'], axeIndexByModalite })).toEqual({
      kind: 'reportee',
      date: '2025-01-01',
      valeur: 7,
    })
  })
})
