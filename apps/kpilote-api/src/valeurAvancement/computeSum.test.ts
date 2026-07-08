import { describe, expect, it } from 'vitest'

import { Decimal } from '@/framework/decimal'
import { computeSum } from '@/valeurAvancement/computeSum'

const d = (n: number): Decimal => new Decimal(n)

describe('computeSum', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeSum([])).toBeNull()
  })

  it('retourne la valeur unique pour un tableau de taille 1', () => {
    expect(computeSum([d(42)])).toBe(42)
  })

  it('somme plusieurs valeurs positives', () => {
    expect(computeSum([d(1), d(2), d(3)])).toBe(6)
    expect(computeSum([d(10), d(20), d(30), d(40), d(50)])).toBe(150)
  })

  it('gère les nombres négatifs', () => {
    expect(computeSum([d(-5), d(-1), d(-3)])).toBe(-9)
    expect(computeSum([d(-10), d(10)])).toBe(0)
  })

  it('gère les valeurs décimales sans perte de précision', () => {
    expect(computeSum([d(0.1), d(0.2)])).toBe(0.3)
    expect(computeSum([d(1.5), d(2.5), d(3.5)])).toBe(7.5)
  })

  it("préserve l'ordre indépendant (somme commutative)", () => {
    expect(computeSum([d(3), d(1), d(2)])).toBe(6)
    expect(computeSum([d(2), d(3), d(1)])).toBe(6)
  })
})
