import { describe, expect, it } from 'vitest'

import { type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { matchModalites, selectAxeColumns } from '@/valeurImport/axeColumns'
import { type AxeForImport } from '@/valeurImport/queries/listAxesForIndicateur'

const operateur: AxeForImport = {
  publicId: 'AXE-OPERATEUR',
  nom: 'Opérateur',
  modalitesFeuilles: [
    { publicId: 'OP-ORANGE', nom: 'Orange' },
    { publicId: 'OP-SFR', nom: 'SFR' },
  ],
}
const fraude: AxeForImport = {
  publicId: 'AXE-FRAUDE',
  nom: 'Type de fraude',
  modalitesFeuilles: [{ publicId: 'FR-TVA', nom: 'TVA' }],
}

const plan = (colonnesAxes: NonNullable<Plan['colonnesAxes']>): Plan => ({
  layout: 'long',
  colonneIndividu: 'territoire',
  colonneDate: { nom: 'date' },
  colonneValeur: 'valeur',
  colonnesAxes,
})

const headers = ['territoire', 'operateur', 'fraude', 'date', 'valeur']

describe('selectAxeColumns', () => {
  it('retient une colonne par axe, dans l’ordre des axes', () => {
    const { columns, warnings } = selectAxeColumns({
      plan: plan([
        { colonne: 'fraude', axe: 'AXE-FRAUDE' },
        { colonne: 'operateur', axe: 'AXE-OPERATEUR' },
      ]),
      headers,
      axes: [operateur, fraude],
    })

    expect(columns).toEqual([
      { column: 'operateur', axe: operateur },
      { column: 'fraude', axe: fraude },
    ])
    expect(warnings).toEqual([])
  })

  it('écarte une colonne absente, de structure ou en double, et signale l’axe non couvert', () => {
    const { columns, warnings } = selectAxeColumns({
      plan: plan([
        { colonne: 'inexistante', axe: 'AXE-FRAUDE' },
        { colonne: 'territoire', axe: 'AXE-FRAUDE' },
        { colonne: 'operateur', axe: 'AXE-OPERATEUR' },
        { colonne: 'fraude', axe: 'AXE-OPERATEUR' },
      ]),
      headers,
      axes: [operateur, fraude],
    })

    expect(columns).toEqual([{ column: 'operateur', axe: operateur }])
    expect(warnings.map((warning) => [warning.code, warning.colonneSource])).toEqual([
      ['COLONNE_AXE_IGNOREE', 'inexistante'],
      ['COLONNE_AXE_IGNOREE', 'territoire'],
      ['COLONNE_AXE_IGNOREE', 'fraude'],
      ['AXE_NON_COUVERT', undefined],
    ])
    expect(warnings[3]!.message).toContain('Type de fraude')
  })
})

describe('matchModalites', () => {
  it('rattache par publicId ou par nom, sans tenir compte de la casse ni des accents', () => {
    const { mapping, remaining } = matchModalites({
      labels: ['op-orange', ' sfr ', 'Électricité', 'Bouygues'],
      modalites: [...operateur.modalitesFeuilles, { publicId: 'OP-EDF', nom: 'Electricite' }],
    })

    expect(mapping).toEqual([
      { libelleSource: 'op-orange', publicId: 'OP-ORANGE' },
      { libelleSource: ' sfr ', publicId: 'OP-SFR' },
      { libelleSource: 'Électricité', publicId: 'OP-EDF' },
    ])
    expect(remaining).toEqual(['Bouygues'])
  })

  it('laisse à Albert un libellé qui désigne plusieurs modalités', () => {
    const { mapping, remaining } = matchModalites({
      labels: ['Orange'],
      modalites: [
        { publicId: 'OP-ORANGE', nom: 'Orange' },
        { publicId: 'OP-ORANGE-PRO', nom: 'orange' },
      ],
    })

    expect(mapping).toEqual([])
    expect(remaining).toEqual(['Orange'])
  })
})
