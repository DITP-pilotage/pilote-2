import { describe, expect, it } from 'vitest'

import { displayedDifferenceSign, formatMoisAnneeLongFr } from '@/lib/format'

describe('formatMoisAnneeLongFr', () => {
  it('formate une date ISO en mois-année long fr-FR', () => {
    expect(formatMoisAnneeLongFr('2024-12-01')).toBe('décembre 2024')
    expect(formatMoisAnneeLongFr('2025-06-15')).toBe('juin 2025')
  })
})

describe('displayedDifferenceSign', () => {
  it("lit 0 quand l'affichage arrondit la différence à « 0 »", () => {
    expect(displayedDifferenceSign(0)).toBe(0)
    expect(displayedDifferenceSign(0.0001)).toBe(0)
    expect(displayedDifferenceSign(-3e-13)).toBe(0)
  })

  it("garde le signe d'une différence affichée non nulle", () => {
    expect(displayedDifferenceSign(0.0005)).toBe(1)
    expect(displayedDifferenceSign(-1.3)).toBe(-1)
  })
})
