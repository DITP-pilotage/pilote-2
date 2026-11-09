import { describe, expect, it } from 'vitest'

import { formatMoisAnneeLongFr, zeroSiAfficheZero } from '@/lib/format'

describe('formatMoisAnneeLongFr', () => {
  it('formate une date ISO en mois-année long fr-FR', () => {
    expect(formatMoisAnneeLongFr('2024-12-01')).toBe('décembre 2024')
    expect(formatMoisAnneeLongFr('2025-06-15')).toBe('juin 2025')
  })
})

describe('zeroSiAfficheZero', () => {
  it("ramène à 0 une valeur que l'affichage arrondit à 0", () => {
    expect(zeroSiAfficheZero(0.0001)).toBe(0)
    expect(zeroSiAfficheZero(-3e-13)).toBe(0)
  })

  it('garde une valeur affichée non nulle', () => {
    expect(zeroSiAfficheZero(0.0005)).toBe(0.0005)
    expect(zeroSiAfficheZero(-1.3)).toBe(-1.3)
  })
})
