import { describe, expect, it } from 'vitest'

import { type AxeColumn, appliquerPlan } from '@/valeurImport/appliquerPlan'
import { type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { type ResolutionResult } from '@/valeurImport/calls/resoudreIndividus'

const individusValides = [{ publicId: 'DEPT-01' }, { publicId: 'DEPT-84' }]

const resolution: ResolutionResult = {
  mapping: [
    { libelleSource: 'Ain', individuPublicId: 'DEPT-01' },
    { libelleSource: 'Vaucluse', individuPublicId: 'DEPT-84' },
  ],
  nonResolus: [],
}

const axes: AxeColumn[] = [
  {
    column: 'operateur',
    axe: { publicId: 'AXE-OPERATEUR', nom: 'Opérateur' },
    validModalites: new Set(['OP-ORANGE', 'OP-SFR']),
    resolution: {
      mapping: [
        { libelleSource: 'Orange', publicId: 'OP-ORANGE' },
        { libelleSource: 'SFR', publicId: 'OP-SFR' },
        { libelleSource: 'Free', publicId: 'OP-HALLUCINE' },
      ],
      nonResolus: [{ libelleSource: 'Bouygues', raison: 'Opérateur inconnu.' }],
    },
  },
  {
    column: 'fraude',
    axe: { publicId: 'AXE-FRAUDE', nom: 'Type de fraude' },
    validModalites: new Set(['FR-TVA']),
    resolution: { mapping: [{ libelleSource: 'TVA', publicId: 'FR-TVA' }], nonResolus: [] },
  },
]

describe('appliquerPlan — colonnes d’axe', () => {
  it('layout long : une modalité par axe, dans l’ordre des axes', () => {
    const plan: Plan = {
      layout: 'long',
      colonneIndividu: 'territoire',
      colonneDate: { nom: 'date' },
      colonneValeur: 'valeur',
    }
    const rows = [
      { territoire: 'Ain', fraude: 'TVA', operateur: 'Orange', date: '2024-01-01', valeur: '10' },
      {
        territoire: 'Vaucluse',
        fraude: 'TVA',
        operateur: 'SFR',
        date: '2024-01-01',
        valeur: '3,5',
      },
    ]

    const { items, warnings } = appliquerPlan({
      plan,
      rows,
      resolution,
      individusValides,
      typeValeur: null,
      axes,
    })

    expect(items).toEqual([
      { individu: 'DEPT-01', modalites: ['OP-ORANGE', 'FR-TVA'], date: '2024-01-01', valeur: 10 },
      { individu: 'DEPT-84', modalites: ['OP-SFR', 'FR-TVA'], date: '2024-01-01', valeur: 3.5 },
    ])
    expect(warnings).toEqual([])
  })

  it('layout pivot : les modalités de la ligne s’appliquent à chaque colonne-date', () => {
    const plan: Plan = {
      layout: 'pivot',
      colonneIndividu: 'territoire',
      colonnesPivot: [
        { nom: '2023', dateIso: '2023-01-01' },
        { nom: '2024', dateIso: '2024-01-01' },
      ],
    }
    const rows = [{ territoire: 'Ain', operateur: 'Orange', fraude: 'TVA', 2023: 1, 2024: 2 }]

    const { items } = appliquerPlan({
      plan,
      rows,
      resolution,
      individusValides,
      typeValeur: null,
      axes,
    })

    expect(items).toEqual([
      { individu: 'DEPT-01', modalites: ['OP-ORANGE', 'FR-TVA'], date: '2023-01-01', valeur: 1 },
      { individu: 'DEPT-01', modalites: ['OP-ORANGE', 'FR-TVA'], date: '2024-01-01', valeur: 2 },
    ])
  })

  it('écarte les lignes partielles et les modalités non résolues, signalées une fois', () => {
    const plan: Plan = {
      layout: 'long',
      colonneIndividu: 'territoire',
      colonneDate: { nom: 'date' },
      colonneValeur: 'valeur',
    }
    const rows = [
      { territoire: 'Ain', operateur: '', fraude: 'TVA', date: '2024-01-01', valeur: 1 },
      { territoire: 'Ain', operateur: 'Bouygues', fraude: 'TVA', date: '2024-01-01', valeur: 1 },
      { territoire: 'Ain', operateur: 'Bouygues', fraude: 'TVA', date: '2024-02-01', valeur: 1 },
      { territoire: 'Ain', operateur: 'Free', fraude: 'TVA', date: '2024-01-01', valeur: 1 },
    ]

    const { items, warnings } = appliquerPlan({
      plan,
      rows,
      resolution,
      individusValides,
      typeValeur: null,
      axes,
    })

    expect(items).toEqual([])
    expect(
      warnings.map(({ code, libelleSource, ligneSource }) => ({
        code,
        libelleSource,
        ligneSource,
      })),
    ).toEqual([
      { code: 'LIGNE_PARTIELLE', libelleSource: undefined, ligneSource: 0 },
      { code: 'MODALITE_NON_RESOLUE', libelleSource: 'Bouygues', ligneSource: 1 },
      { code: 'MODALITE_NON_RESOLUE', libelleSource: 'Free', ligneSource: 3 },
    ])
    expect(warnings[1]!.message).toContain('Opérateur inconnu.')
  })
})
