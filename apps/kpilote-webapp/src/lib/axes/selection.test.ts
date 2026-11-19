import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it } from 'vitest'

import {
  type AxeWithModalites,
  orderModalites,
  parseModalitesParam,
  readSelection,
  selectionLabel,
  setModalite,
  writeSelection,
} from './selection'

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
  modalites: [modalite('OP-ORANGE', 'Orange'), modalite('OP-SFR', 'SFR')],
}

const fraude: AxeWithModalites = {
  id: 'FRAUDE',
  nom: 'Type de fraude',
  modalites: [
    modalite('FR-FISCALE', 'Fiscale'),
    modalite('FR-SOCIALE', 'Sociale'),
    modalite('FR-TVA', 'TVA', 'FR-FISCALE'),
    modalite('FR-CAF', 'CAF', 'FR-SOCIALE'),
    modalite('FR-IR', 'Impôt sur le revenu', 'FR-FISCALE'),
  ],
}

const axes = [operateur, fraude]

describe('readSelection', () => {
  it('rattache chaque modalité de l’URL à son axe', () => {
    expect(readSelection({ axes, modalites: ['FR-TVA', 'OP-ORANGE'] })).toEqual(
      new Map([
        ['OPERATEUR', 'OP-ORANGE'],
        ['FRAUDE', 'FR-TVA'],
      ]),
    )
  })

  it('ignore une modalité inconnue et garde la première modalité d’un même axe', () => {
    expect(readSelection({ axes, modalites: ['OP-INCONNU', 'OP-SFR', 'OP-ORANGE'] })).toEqual(
      new Map([['OPERATEUR', 'OP-SFR']]),
    )
  })

  it('vaut « Tous » partout sans modalité', () => {
    expect(readSelection({ axes, modalites: [] })).toEqual(new Map())
  })
})

describe('writeSelection', () => {
  it('écrit les modalités dans l’ordre de déclaration des axes', () => {
    const selection = new Map([
      ['FRAUDE', 'FR-TVA'],
      ['OPERATEUR', 'OP-ORANGE'],
    ])
    expect(writeSelection({ axes, selection })).toBe('OP-ORANGE,FR-TVA')
  })

  it('n’écrit rien quand tous les axes sont à « Tous »', () => {
    expect(writeSelection({ axes, selection: new Map() })).toBeUndefined()
  })
})

describe('normalisation de l’URL', () => {
  it('est stable au second passage, ce qui évite une boucle de redirection', () => {
    const normalize = (param: string | undefined) =>
      writeSelection({
        axes,
        selection: readSelection({ axes, modalites: parseModalitesParam(param) }),
      })
    const once = normalize('FR-TVA,,OP-INCONNU,OP-SFR,OP-ORANGE')
    expect(once).toBe('OP-SFR,FR-TVA')
    expect(normalize(once)).toBe(once)
    expect(normalize(undefined)).toBeUndefined()
  })
})

describe('setModalite', () => {
  it('remplace la modalité d’un axe sans toucher aux autres', () => {
    const selection = new Map([
      ['OPERATEUR', 'OP-ORANGE'],
      ['FRAUDE', 'FR-TVA'],
    ])
    expect(setModalite({ selection, axeId: 'OPERATEUR', modalite: 'OP-SFR' })).toEqual(
      new Map([
        ['OPERATEUR', 'OP-SFR'],
        ['FRAUDE', 'FR-TVA'],
      ]),
    )
  })

  it('remet un axe à « Tous »', () => {
    const selection = new Map([['OPERATEUR', 'OP-ORANGE']])
    expect(setModalite({ selection, axeId: 'OPERATEUR', modalite: null })).toEqual(new Map())
  })
})

describe('orderModalites', () => {
  it('range les children sous leur parent, avec leur depth', () => {
    expect(orderModalites(fraude.modalites).map(({ modalite: m, depth }) => [m.id, depth])).toEqual(
      [
        ['FR-FISCALE', 0],
        ['FR-IR', 1],
        ['FR-TVA', 1],
        ['FR-SOCIALE', 0],
        ['FR-CAF', 1],
      ],
    )
  })
})

describe('selectionLabel', () => {
  it('n’a pas de libellé pour un indicateur sans axe', () => {
    expect(selectionLabel({ axes: [], selection: new Map() })).toBeNull()
  })

  it('vaut « Ensemble » quand tous les axes sont à « Tous »', () => {
    expect(selectionLabel({ axes, selection: new Map() })).toBe('Ensemble')
  })

  it('nomme les modalités choisies et les axes laissés à « Tous »', () => {
    expect(selectionLabel({ axes, selection: new Map([['FRAUDE', 'FR-TVA']]) })).toBe(
      'Opérateur : ensemble · TVA',
    )
  })
})
