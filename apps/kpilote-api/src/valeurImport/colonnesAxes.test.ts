import { describe, expect, it } from 'vitest'

import { type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { rapprocherModalites, retenirColonnesAxes } from '@/valeurImport/colonnesAxes'
import { type AxePourImport } from '@/valeurImport/queries/listAxesForIndicateur'

const operateur: AxePourImport = {
  publicId: 'AXE-OPERATEUR',
  nom: 'Opérateur',
  modalitesFeuilles: [
    { publicId: 'OP-ORANGE', nom: 'Orange' },
    { publicId: 'OP-SFR', nom: 'SFR' },
  ],
}
const fraude: AxePourImport = {
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

describe('retenirColonnesAxes', () => {
  it('retient une colonne par axe, dans l’ordre des axes', () => {
    const { colonnes, warnings } = retenirColonnesAxes({
      plan: plan([
        { colonne: 'fraude', axe: 'AXE-FRAUDE' },
        { colonne: 'operateur', axe: 'AXE-OPERATEUR' },
      ]),
      headers,
      axes: [operateur, fraude],
    })

    expect(colonnes).toEqual([
      { colonne: 'operateur', axe: operateur },
      { colonne: 'fraude', axe: fraude },
    ])
    expect(warnings).toEqual([])
  })

  it('écarte une colonne absente, de structure ou en double, et signale l’axe non couvert', () => {
    const { colonnes, warnings } = retenirColonnesAxes({
      plan: plan([
        { colonne: 'inexistante', axe: 'AXE-FRAUDE' },
        { colonne: 'territoire', axe: 'AXE-FRAUDE' },
        { colonne: 'operateur', axe: 'AXE-OPERATEUR' },
        { colonne: 'fraude', axe: 'AXE-OPERATEUR' },
      ]),
      headers,
      axes: [operateur, fraude],
    })

    expect(colonnes).toEqual([{ colonne: 'operateur', axe: operateur }])
    expect(warnings.map((warning) => [warning.code, warning.colonneSource])).toEqual([
      ['COLONNE_AXE_IGNOREE', 'inexistante'],
      ['COLONNE_AXE_IGNOREE', 'territoire'],
      ['COLONNE_AXE_IGNOREE', 'fraude'],
      ['AXE_NON_COUVERT', undefined],
    ])
    expect(warnings[3]!.message).toContain('Type de fraude')
  })
})

describe('rapprocherModalites', () => {
  it('rattache par publicId ou par nom, sans tenir compte de la casse ni des accents', () => {
    const { mapping, restants } = rapprocherModalites({
      libelles: ['op-orange', ' sfr ', 'Électricité', 'Bouygues'],
      modalites: [...operateur.modalitesFeuilles, { publicId: 'OP-EDF', nom: 'Electricite' }],
    })

    expect(mapping).toEqual([
      { libelleSource: 'op-orange', publicId: 'OP-ORANGE' },
      { libelleSource: ' sfr ', publicId: 'OP-SFR' },
      { libelleSource: 'Électricité', publicId: 'OP-EDF' },
    ])
    expect(restants).toEqual(['Bouygues'])
  })

  it('laisse à Albert un libellé qui désigne plusieurs modalités', () => {
    const { mapping, restants } = rapprocherModalites({
      libelles: ['Orange'],
      modalites: [
        { publicId: 'OP-ORANGE', nom: 'Orange' },
        { publicId: 'OP-ORANGE-PRO', nom: 'orange' },
      ],
    })

    expect(mapping).toEqual([])
    expect(restants).toEqual(['Orange'])
  })
})
