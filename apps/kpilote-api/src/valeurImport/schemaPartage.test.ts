import {
  normaliserPlanSchema,
  normaliserValeursImportResponseApiModelSchema,
  normaliserWarningSchema,
} from '@pilote/kpilote-shared/valeurImport'
import { describe, expect, it } from 'vitest'

describe('schéma partagé — type de valeur', () => {
  it('le plan long accepte colonneTypeValeur', () => {
    const parsed = normaliserPlanSchema.safeParse({
      layout: 'long',
      colonneIndividu: 'zone_nom',
      colonneDate: { nom: 'date_valeur', format: 'iso' },
      colonneValeur: 'valeur',
      colonneTypeValeur: { nom: 'type_valeur' },
    })
    expect(parsed.success).toBe(true)
  })

  it('le warning accepte le code LIGNE_IGNOREE', () => {
    const parsed = normaliserWarningSchema.safeParse({
      code: 'LIGNE_IGNOREE',
      message: 'Ligne 2 : valeur « vc » écartée.',
    })
    expect(parsed.success).toBe(true)
  })

  it('la réponse accepte resolutionTypeValeur', () => {
    const parsed = normaliserValeursImportResponseApiModelSchema.safeParse({
      plan: {
        layout: 'long',
        colonneIndividu: 'zone_nom',
        colonneDate: { nom: 'date_valeur', format: 'iso' },
        colonneValeur: 'valeur',
        colonneTypeValeur: { nom: 'type_valeur' },
      },
      resolution: { mapping: [], nonResolus: [] },
      items: [],
      warnings: [],
      rapport: {
        totalLignes: 0,
        totalItemsProduits: 0,
        totalLibellesSources: 0,
        totalLibellesMappes: 0,
        totalLibellesNonResolus: 0,
      },
      resolutionTypeValeur: {
        colonne: 'type_valeur',
        typesValeurDistincts: ['vi', 'va', 'vc'],
        typesValeurRetenus: ['va'],
      },
    })
    expect(parsed.success).toBe(true)
  })
})
