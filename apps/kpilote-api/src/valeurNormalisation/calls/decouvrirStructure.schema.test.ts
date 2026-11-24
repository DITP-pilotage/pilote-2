import { describe, expect, it } from 'vitest'

import {
  decouverteOutputSchema,
  makeDecouverteOutputSchemaWithAxes,
} from '@/valeurNormalisation/calls/decouvrirStructure'

describe('decouverteOutputSchema — colonneTypeValeur', () => {
  it('accepte un plan long AVEC colonneTypeValeur', () => {
    const parsed = decouverteOutputSchema.safeParse({
      statut: 'reconnu',
      plan: {
        layout: 'long',
        colonneIndividu: 'zone_nom',
        colonneDate: { nom: 'date_valeur' },
        colonneValeur: 'valeur',
        colonneTypeValeur: { nom: 'type_valeur' },
      },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success && parsed.data.statut === 'reconnu') {
      expect(parsed.data.plan.colonneTypeValeur).toEqual({ nom: 'type_valeur' })
    }
  })

  it('accepte un plan long SANS colonneTypeValeur (optionnel)', () => {
    const parsed = decouverteOutputSchema.safeParse({
      statut: 'reconnu',
      plan: {
        layout: 'long',
        colonneIndividu: 'zone_nom',
        colonneDate: { nom: 'date_valeur' },
        colonneValeur: 'valeur',
      },
    })
    expect(parsed.success).toBe(true)
  })

  it('accepte un plan pivot AVEC colonneTypeValeur', () => {
    const parsed = decouverteOutputSchema.safeParse({
      statut: 'reconnu',
      plan: {
        layout: 'pivot',
        colonneIndividu: 'zone_nom',
        colonnesPivot: [{ nom: '2022', dateIso: '2022-01-01' }],
        colonneTypeValeur: { nom: 'type_valeur' },
      },
    })
    expect(parsed.success).toBe(true)
    if (parsed.success && parsed.data.statut === 'reconnu' && parsed.data.plan.layout === 'pivot') {
      expect(parsed.data.plan.colonneTypeValeur).toEqual({ nom: 'type_valeur' })
    }
  })
})

describe('makeDecouverteOutputSchemaWithAxes — colonnesAxes', () => {
  const schema = makeDecouverteOutputSchemaWithAxes({ axePublicIds: ['AXE-OPERATEUR'] })
  const plan = (axe: string) => ({
    statut: 'reconnu',
    plan: {
      layout: 'long',
      colonneIndividu: 'territoire',
      colonneDate: { nom: 'date' },
      colonneValeur: 'valeur',
      colonnesAxes: [{ colonne: 'operateur', axe }],
    },
  })

  it('accepte un axe de l’indicateur', () => {
    expect(schema.safeParse(plan('AXE-OPERATEUR')).success).toBe(true)
  })

  it('refuse un axe inconnu', () => {
    expect(schema.safeParse(plan('AXE-INVENTE')).success).toBe(false)
  })

  it('le schéma sans axe ignore colonnesAxes', () => {
    const parsed = decouverteOutputSchema.parse(plan('AXE-OPERATEUR'))
    expect(parsed.statut === 'reconnu' && 'colonnesAxes' in parsed.plan).toBe(false)
  })
})
