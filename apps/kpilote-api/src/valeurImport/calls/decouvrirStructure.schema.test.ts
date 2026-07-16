import { describe, expect, it } from 'vitest'

import { decouverteOutputSchema } from '@/valeurImport/calls/decouvrirStructure'

describe('decouverteOutputSchema — colonneTypeValeur', () => {
  it('accepte un plan long AVEC colonneTypeValeur', () => {
    const parsed = decouverteOutputSchema.safeParse({
      statut: 'reconnu',
      plan: {
        layout: 'long',
        colonneIndividu: 'zone_nom',
        colonneDate: { nom: 'date_valeur', format: 'iso' },
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
        colonneDate: { nom: 'date_valeur', format: 'iso' },
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
