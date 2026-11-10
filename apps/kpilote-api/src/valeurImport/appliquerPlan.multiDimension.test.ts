import { describe, expect, it } from 'vitest'

import { appliquerPlanMultiDimension } from '@/valeurImport/appliquerPlan'
import { type Plan } from '@/valeurImport/calls/decouvrirStructure'

const territoire = {
  colonne: 'territoire',
  rang: 0,
  membres: [{ publicId: 'COM-ORANGE' }, { publicId: 'COM-AVIGNON' }],
  resolution: {
    mapping: [
      { libelleSource: 'Orange', individuPublicId: 'COM-ORANGE' },
      { libelleSource: 'Avignon', individuPublicId: 'COM-AVIGNON' },
    ],
    nonResolus: [],
  },
}
const operateur = {
  colonne: 'operateur',
  rang: 1,
  membres: [{ publicId: 'OP-ORANGE' }, { publicId: 'OP-SFR' }],
  resolution: {
    mapping: [
      { libelleSource: 'Orange', individuPublicId: 'OP-ORANGE' },
      // Halluciné : membre d'une autre dimension, écarté.
      { libelleSource: 'SFR', individuPublicId: 'COM-AVIGNON' },
    ],
    nonResolus: [{ libelleSource: 'Free', raison: 'Inconnu.' }],
  },
}

const planLong: Plan = {
  layout: 'long',
  colonneIndividu: 'operateur',
  colonnesIdentiteSupplementaires: ['territoire'],
  colonneDate: { nom: 'date' },
  colonneValeur: 'valeur',
}

describe('appliquerPlanMultiDimension', () => {
  it('produit des items à coordonnées canoniques (ordre des dimensions, pas du plan)', () => {
    const { items, warnings } = appliquerPlanMultiDimension({
      plan: planLong,
      rows: [{ operateur: 'Orange', territoire: 'Orange', date: '2025-01-01', valeur: '4' }],
      colonnes: [operateur, territoire],
      typeValeur: null,
    })
    expect(items).toEqual([
      {
        individu: 'COM-ORANGE~OP-ORANGE',
        coordonnees: ['COM-ORANGE', 'OP-ORANGE'],
        date: '2025-01-01',
        valeur: 4,
      },
    ])
    expect(warnings.map((warning) => warning.code)).toEqual(['INDIVIDU_HALLUCINE'])
  })

  it('écarte les lignes partielles ; une ligne sans aucune identité résolue ne doublonne pas l’avertissement', () => {
    const { items, warnings } = appliquerPlanMultiDimension({
      plan: planLong,
      rows: [
        { operateur: 'Free', territoire: 'Avignon', date: '2025-01-01', valeur: '1' },
        { operateur: 'Free', territoire: 'Avignon', date: '2025-02-01', valeur: '2' },
        { operateur: 'Free', territoire: 'Inconnue', date: '2025-01-01', valeur: '3' },
        { operateur: '', territoire: '', date: '2025-01-01', valeur: '4' },
      ],
      colonnes: [operateur, territoire],
      typeValeur: null,
    })
    expect(items).toEqual([])
    expect(
      warnings.map((warning) => [warning.code, warning.ligneSource, warning.colonneSource]),
    ).toEqual([
      ['INDIVIDU_HALLUCINE', undefined, undefined],
      ['INDIVIDU_NON_RESOLU', 0, 'operateur'],
      ['LIGNE_PARTIELLE', 0, 'operateur'],
      ['LIGNE_PARTIELLE', 1, 'operateur'],
      ['INDIVIDU_NON_RESOLU', 2, 'territoire'],
      ['CELLULE_VIDE', 3, 'operateur'],
    ])
  })

  it('layout pivot : une coordonnée par colonne d’identité, une valeur par colonne-date', () => {
    const { items } = appliquerPlanMultiDimension({
      plan: {
        layout: 'pivot',
        colonneIndividu: 'territoire',
        colonnesIdentiteSupplementaires: ['operateur'],
        colonnesPivot: [
          { nom: '2025-01', dateIso: '2025-01-01' },
          { nom: '2025-02', dateIso: '2025-02-01' },
        ],
      },
      rows: [{ territoire: 'Avignon', operateur: 'Orange', '2025-01': '1', '2025-02': '2' }],
      colonnes: [territoire, operateur],
      typeValeur: null,
    })
    expect(items).toEqual([
      {
        individu: 'COM-AVIGNON~OP-ORANGE',
        coordonnees: ['COM-AVIGNON', 'OP-ORANGE'],
        date: '2025-01-01',
        valeur: 1,
      },
      {
        individu: 'COM-AVIGNON~OP-ORANGE',
        coordonnees: ['COM-AVIGNON', 'OP-ORANGE'],
        date: '2025-02-01',
        valeur: 2,
      },
    ])
  })

  it('une seule colonne d’identité : items sans coordonnées', () => {
    const { items } = appliquerPlanMultiDimension({
      plan: { ...planLong, colonneIndividu: 'territoire', colonnesIdentiteSupplementaires: [] },
      rows: [{ territoire: 'Avignon', date: '2025-01-01', valeur: '1' }],
      colonnes: [territoire],
      typeValeur: null,
    })
    expect(items).toStrictEqual([{ individu: 'COM-AVIGNON', date: '2025-01-01', valeur: 1 }])
  })
})
