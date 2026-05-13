import { describe, expect, it } from 'vitest'

import { Decimal } from '@/framework/decimal'
import { computeMax } from '@/valeurAvancement/computeMax'

const d = (n: number): Decimal => new Decimal(n)

describe('computeMax', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeMax([])).toBeNull()
  })

  it('retourne la valeur unique pour un tableau de taille 1', () => {
    expect(computeMax([d(42)])).toBe(42)
  })

  it('retourne la plus grande valeur', () => {
    expect(computeMax([d(3), d(1), d(2)])).toBe(3)
    expect(computeMax([d(10), d(20), d(30), d(40), d(50)])).toBe(50)
  })

  it('gère les nombres négatifs', () => {
    expect(computeMax([d(-5), d(-1), d(-3)])).toBe(-1)
    expect(computeMax([d(-10), d(-5), d(-50)])).toBe(-5)
  })

  it('gère les valeurs décimales', () => {
    expect(computeMax([d(1.5), d(0.5), d(2.5)])).toBe(2.5)
  })

  it('gère les doublons', () => {
    expect(computeMax([d(5), d(5), d(5)])).toBe(5)
    expect(computeMax([d(1), d(2), d(2)])).toBe(2)
  })
})
