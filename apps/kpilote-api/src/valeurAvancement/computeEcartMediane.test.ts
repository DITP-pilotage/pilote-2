import { describe, expect, it } from 'vitest'

import { Decimal } from '@/framework/decimal'
import { computeEcartMediane } from '@/valeurAvancement/computeEcartMediane'

const d = (n: number): Decimal => new Decimal(n)

describe('computeEcartMediane', () => {
  it('retourne null si la dernière valeur est undefined', () => {
    expect(computeEcartMediane(undefined, 10)).toBeNull()
  })

  it('retourne null si la médiane est null', () => {
    expect(computeEcartMediane(d(10), null)).toBeNull()
  })

  it('retourne null si les deux sont absents', () => {
    expect(computeEcartMediane(undefined, null)).toBeNull()
  })

  it("retourne l'écart positif quand la valeur est au-dessus de la médiane", () => {
    expect(computeEcartMediane(d(50), 30)).toBe(20)
  })

  it("retourne l'écart négatif quand la valeur est en-dessous de la médiane", () => {
    expect(computeEcartMediane(d(10), 30)).toBe(-20)
  })

  it('retourne 0 quand la valeur est égale à la médiane', () => {
    expect(computeEcartMediane(d(42), 42)).toBe(0)
  })

  it('évite les erreurs de précision IEEE 754', () => {
    expect(computeEcartMediane(d(0.3), 0.15)).toBeCloseTo(0.15)
  })
})
