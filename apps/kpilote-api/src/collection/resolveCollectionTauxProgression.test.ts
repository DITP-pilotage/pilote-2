import { describe, expect, it } from 'vitest'

import { Decimal } from '@/framework/decimal'
import {
  type IndicateurContribution,
  resolveCollectionTauxProgression,
} from '@/collection/resolveCollectionTauxProgression'

const c = (overrides: Partial<IndicateurContribution> = {}): IndicateurContribution => ({
  indicateurPublicId: 'IND-X',
  tauxProgression: 50,
  date: null,
  ponderation: new Decimal(1),
  ...overrides,
})

describe('resolveCollectionTauxProgression', () => {
  it('retourne null pour un collection vide', () => {
    const result = resolveCollectionTauxProgression([])
    expect(result.tauxProgression).toBeNull()
    expect(result.contributions).toEqual([])
  })

  it('moyenne arithmétique simple avec pondérations uniformes', () => {
    const result = resolveCollectionTauxProgression([
      c({ indicateurPublicId: 'IND-A', tauxProgression: 50 }),
      c({ indicateurPublicId: 'IND-B', tauxProgression: 100 }),
    ])
    expect(result.tauxProgression).toBe(75)
  })

  it("retourne null dès qu'une contribution est null (tout-ou-rien)", () => {
    const result = resolveCollectionTauxProgression([
      c({ indicateurPublicId: 'IND-A', tauxProgression: 80 }),
      c({ indicateurPublicId: 'IND-B', tauxProgression: null }),
      c({ indicateurPublicId: 'IND-C', tauxProgression: 90 }),
    ])
    expect(result.tauxProgression).toBeNull()
    expect(result.contributions).toHaveLength(3)
  })

  it('applique des pondérations hétérogènes (moyenne pondérée)', () => {
    // (50 × 1 + 100 × 3) / (1 + 3) = 350 / 4 = 87.5
    const result = resolveCollectionTauxProgression([
      c({ tauxProgression: 50, ponderation: new Decimal(1) }),
      c({ tauxProgression: 100, ponderation: new Decimal(3) }),
    ])
    expect(result.tauxProgression).toBe(87.5)
  })

  it("tronque le taux à 2 décimales (ROUND_DOWN, jamais d'arrondi half-up)", () => {
    // (66.666 + 66.666) / 2 = 66.666 → tronqué → 66.66
    const result = resolveCollectionTauxProgression([
      c({ tauxProgression: 66.666 }),
      c({ tauxProgression: 66.666 }),
    ])
    expect(result.tauxProgression).toBe(66.66)
  })

  it('plafonne à 100', () => {
    // Cas pathologique : toutes les contributions à 100, la moyenne reste 100.
    const result = resolveCollectionTauxProgression([
      c({ tauxProgression: 100 }),
      c({ tauxProgression: 100 }),
    ])
    expect(result.tauxProgression).toBe(100)
  })

  it('ignore les indicateurs à pondération 0 (y compris non calculables)', () => {
    // IND-Z a pondération 0 et pas de taux → exclu du calcul, ne déclenche pas
    // le tout-ou-rien. La moyenne porte uniquement sur IND-A et IND-B.
    const result = resolveCollectionTauxProgression([
      c({ indicateurPublicId: 'IND-A', tauxProgression: 50, ponderation: new Decimal(1) }),
      c({ indicateurPublicId: 'IND-B', tauxProgression: 100, ponderation: new Decimal(1) }),
      c({ indicateurPublicId: 'IND-Z', tauxProgression: null, ponderation: new Decimal(0) }),
    ])
    expect(result.tauxProgression).toBe(75)
  })

  it('retourne null si toutes les pondérations valent 0', () => {
    const result = resolveCollectionTauxProgression([
      c({ tauxProgression: 50, ponderation: new Decimal(0) }),
      c({ tauxProgression: 80, ponderation: new Decimal(0) }),
    ])
    expect(result.tauxProgression).toBeNull()
  })
})
