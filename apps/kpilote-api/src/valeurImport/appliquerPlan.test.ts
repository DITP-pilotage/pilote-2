import { describe, expect, it } from 'vitest'

import { appliquerPlan } from '@/valeurImport/appliquerPlan'
import { type Plan } from '@/valeurImport/calls/decouvrirStructure'
import { type ResolutionResult } from '@/valeurImport/calls/resoudreIndividus'

const individusValides = [{ publicId: 'D01' }, { publicId: 'D02' }]

const resolution: ResolutionResult = {
  mapping: [
    { libelleSource: 'Ain', individuPublicId: 'D01' },
    { libelleSource: 'Aisne', individuPublicId: 'D02' },
  ],
  nonResolus: [],
}

const planLong: Plan = {
  layout: 'long',
  colonneIndividu: 'zone_nom',
  colonneDate: { nom: 'date_valeur' },
  colonneValeur: 'valeur',
  colonneTypeValeur: { nom: 'type_valeur' },
}

describe('appliquerPlan — filtrage par type de valeur', () => {
  it('layout long : ne garde que les lignes dont le type est retenu (VA)', () => {
    const rows = [
      { zone_nom: 'Ain', date_valeur: '2022-10-01', type_valeur: 'vi', valeur: '2693,44' },
      { zone_nom: 'Ain', date_valeur: '2023-12-31', type_valeur: 'va', valeur: '3037,53' },
      { zone_nom: 'Ain', date_valeur: '2024-12-31', type_valeur: 'vc', valeur: '2626,11' },
    ]
    const { items, warnings } = appliquerPlan({
      plan: planLong,
      rows,
      resolution,
      individusValides,
      typeValeur: { colonne: 'type_valeur', typesValeurRetenus: ['va'] },
    })
    expect(items).toEqual([{ individu: 'D01', date: '2023-12-31', valeur: 3037.53 }])
    expect(warnings.filter((w) => w.code === 'LIGNE_IGNOREE')).toHaveLength(2)
  })

  it('compare le type sans tenir compte de la casse ni des espaces', () => {
    const rows = [
      { zone_nom: 'Ain', date_valeur: '2023-12-31', type_valeur: '  VA ', valeur: '10' },
    ]
    const { items } = appliquerPlan({
      plan: planLong,
      rows,
      resolution,
      individusValides,
      typeValeur: { colonne: 'type_valeur', typesValeurRetenus: ['va'] },
    })
    expect(items).toEqual([{ individu: 'D01', date: '2023-12-31', valeur: 10 }])
  })

  it('aucun type retenu : aucun item et un unique warning global', () => {
    const rows = [
      { zone_nom: 'Ain', date_valeur: '2023-12-31', type_valeur: 'vi', valeur: '10' },
      { zone_nom: 'Aisne', date_valeur: '2023-12-31', type_valeur: 'vc', valeur: '20' },
    ]
    const { items, warnings } = appliquerPlan({
      plan: planLong,
      rows,
      resolution,
      individusValides,
      typeValeur: { colonne: 'type_valeur', typesValeurRetenus: [] },
    })
    expect(items).toEqual([])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]?.code).toBe('LIGNE_IGNOREE')
  })

  it('sans typeValeur : comportement inchangé (toutes les lignes valides produisent un item)', () => {
    const planSansType: Plan = {
      layout: 'long',
      colonneIndividu: 'zone_nom',
      colonneDate: { nom: 'date_valeur' },
      colonneValeur: 'valeur',
    }
    const rows = [
      { zone_nom: 'Ain', date_valeur: '2023-12-31', valeur: '10' },
      { zone_nom: 'Aisne', date_valeur: '2023-12-31', valeur: '20' },
    ]
    const { items, warnings } = appliquerPlan({
      plan: planSansType,
      rows,
      resolution,
      individusValides,
    })
    expect(items).toHaveLength(2)
    expect(warnings.filter((w) => w.code === 'LIGNE_IGNOREE')).toHaveLength(0)
  })

  it('layout pivot : filtre par ligne avant expansion des colonnes-dates', () => {
    const planPivot: Plan = {
      layout: 'pivot',
      colonneIndividu: 'zone_nom',
      colonnesPivot: [
        { nom: '2022', dateIso: '2022-01-01' },
        { nom: '2023', dateIso: '2023-01-01' },
      ],
      colonneTypeValeur: { nom: 'type_valeur' },
    }
    const rows = [
      { zone_nom: 'Ain', type_valeur: 'va', '2022': '10', '2023': '20' },
      { zone_nom: 'Ain', type_valeur: 'vc', '2022': '11', '2023': '21' },
    ]
    const { items } = appliquerPlan({
      plan: planPivot,
      rows,
      resolution,
      individusValides,
      typeValeur: { colonne: 'type_valeur', typesValeurRetenus: ['va'] },
    })
    expect(items).toEqual([
      { individu: 'D01', date: '2022-01-01', valeur: 10 },
      { individu: 'D01', date: '2023-01-01', valeur: 20 },
    ])
  })
})
