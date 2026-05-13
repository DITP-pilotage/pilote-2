import { describe, expect, it } from 'vitest'

import { Decimal } from '@/framework/decimal'
import { computeVariation } from '@/valeurAvancement/computeVariation'

const d = (n: number): Decimal => new Decimal(n)

describe('computeVariation', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeVariation([])).toBeNull()
  })

  it('retourne la valeur seule (comparée à 0) si une seule entrée', () => {
    expect(computeVariation([{ valeur: d(50) }])).toBe(50)
  })

  it('retourne la différence entre la valeur la plus récente et la précédente', () => {
    expect(computeVariation([{ valeur: d(75) }, { valeur: d(25) }])).toBe(50)
    expect(computeVariation([{ valeur: d(25) }, { valeur: d(50) }])).toBe(-25)
  })

  it("n'utilise que les 2 premières entrées (les plus récentes)", () => {
    expect(computeVariation([{ valeur: d(10) }, { valeur: d(5) }, { valeur: d(999) }])).toBe(5)
  })

  it('évite les erreurs de précision IEEE 754', () => {
    expect(computeVariation([{ valeur: d(0.3) }, { valeur: d(0.15) }])).toBe(0.15)
  })
})
