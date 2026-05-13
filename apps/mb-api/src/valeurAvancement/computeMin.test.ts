import { describe, expect, it } from 'vitest'

import { Decimal } from '@/framework/decimal'
import { computeMin } from '@/valeurAvancement/computeMin'

const d = (n: number): Decimal => new Decimal(n)

describe('computeMin', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeMin([])).toBeNull()
  })

  it('retourne la valeur unique pour un tableau de taille 1', () => {
    expect(computeMin([d(42)])).toBe(42)
  })

  it('retourne la plus petite valeur', () => {
    expect(computeMin([d(3), d(1), d(2)])).toBe(1)
    expect(computeMin([d(10), d(20), d(30), d(40), d(50)])).toBe(10)
  })

  it('gère les nombres négatifs', () => {
    expect(computeMin([d(-5), d(-1), d(-3)])).toBe(-5)
    expect(computeMin([d(-10), d(5), d(10)])).toBe(-10)
  })

  it('gère les valeurs décimales', () => {
    expect(computeMin([d(1.5), d(0.5), d(2.5)])).toBe(0.5)
  })

  it('gère les doublons', () => {
    expect(computeMin([d(5), d(5), d(5)])).toBe(5)
    expect(computeMin([d(1), d(1), d(2)])).toBe(1)
  })
})
