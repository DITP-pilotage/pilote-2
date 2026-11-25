import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it } from 'vitest'

import { buildDecomposition, listDecompositionModalites } from './decomposition'
import { type AxeWithModalites } from './selection'

const modalite = (id: string, nom: string, parent: string | null = null): ModaliteApiModel => ({
  id,
  nom,
  niveau: parent ? 2 : 1,
  parent,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const operateur: AxeWithModalites = {
  id: 'OPERATEUR',
  nom: 'Opérateur',
  modalites: [modalite('OP-SFR', 'SFR'), modalite('OP-ORANGE', 'Orange')],
}

const fraude: AxeWithModalites = {
  id: 'FRAUDE',
  nom: 'Type de fraude',
  modalites: [
    modalite('FR-FISCALE', 'Fiscale'),
    modalite('FR-SOCIALE', 'Sociale'),
    modalite('FR-TVA', 'TVA', 'FR-FISCALE'),
    modalite('FR-IR', 'Impôt sur le revenu', 'FR-FISCALE'),
    modalite('FR-CAF', 'CAF', 'FR-SOCIALE'),
  ],
}

const nomsOf = (modalites: ReadonlyArray<ModaliteApiModel>) =>
  modalites.map((candidate) => candidate.nom)

describe('listDecompositionModalites', () => {
  it('décompose « Tous » en modalités du premier niveau, triées par nom', () => {
    expect(nomsOf(listDecompositionModalites({ axe: fraude, modaliteId: null }))).toEqual([
      'Fiscale',
      'Sociale',
    ])
  })

  it('décompose une modalité en ses enfants', () => {
    expect(nomsOf(listDecompositionModalites({ axe: fraude, modaliteId: 'FR-FISCALE' }))).toEqual([
      'Impôt sur le revenu',
      'TVA',
    ])
  })

  it('ne décompose pas une modalité feuille', () => {
    expect(listDecompositionModalites({ axe: fraude, modaliteId: 'FR-TVA' })).toEqual([])
  })

  it('descend sous une racine unique, qui ne ferait qu’une série égale à « Tous »', () => {
    const territoire: AxeWithModalites = {
      id: 'ZONE',
      nom: 'Zone',
      modalites: [
        modalite('Z-FRANCE', 'France'),
        modalite('Z-NORD', 'Nord', 'Z-FRANCE'),
        modalite('Z-SUD', 'Sud', 'Z-FRANCE'),
      ],
    }
    expect(nomsOf(listDecompositionModalites({ axe: territoire, modaliteId: null }))).toEqual([
      'Nord',
      'Sud',
    ])
  })

  it('garde une racine unique sans enfant', () => {
    const unique: AxeWithModalites = {
      id: 'UNIQUE',
      nom: 'Unique',
      modalites: [modalite('U-SEULE', 'Seule')],
    }
    expect(nomsOf(listDecompositionModalites({ axe: unique, modaliteId: null }))).toEqual(['Seule'])
  })
})

describe('buildDecomposition', () => {
  it('lit chaque série sur la sélection des autres axes, dans l’ordre des axes', () => {
    const decomposition = buildDecomposition({
      axes: [operateur, fraude],
      selection: new Map([['FRAUDE', 'FR-TVA']]),
      axeId: 'OPERATEUR',
    })
    expect(decomposition.total).toBe(2)
    expect(
      decomposition.series.map((serie) => ({
        nom: serie.modalite.nom,
        modalites: serie.modalites,
      })),
    ).toEqual([
      { nom: 'Orange', modalites: ['OP-ORANGE', 'FR-TVA'] },
      { nom: 'SFR', modalites: ['OP-SFR', 'FR-TVA'] },
    ])
  })

  it('remplace la modalité choisie sur l’axe décomposé par ses enfants', () => {
    const decomposition = buildDecomposition({
      axes: [operateur, fraude],
      selection: new Map([
        ['OPERATEUR', 'OP-ORANGE'],
        ['FRAUDE', 'FR-FISCALE'],
      ]),
      axeId: 'FRAUDE',
    })
    expect(decomposition.series.map((serie) => serie.modalites)).toEqual([
      ['OP-ORANGE', 'FR-IR'],
      ['OP-ORANGE', 'FR-TVA'],
    ])
  })

  it('plafonne le nombre de séries et compte les modalités candidates', () => {
    const decomposition = buildDecomposition({
      axes: [fraude],
      selection: new Map(),
      axeId: 'FRAUDE',
      max: 1,
    })
    expect(decomposition.total).toBe(2)
    expect(nomsOf(decomposition.series.map((serie) => serie.modalite))).toEqual(['Fiscale'])
  })

  it('ne décompose pas selon un axe inconnu', () => {
    expect(
      buildDecomposition({ axes: [operateur], selection: new Map(), axeId: 'INCONNU' }),
    ).toEqual({ series: [], total: 0 })
  })
})
