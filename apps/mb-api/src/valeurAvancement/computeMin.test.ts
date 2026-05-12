import { describe, expect, it } from 'vitest'

import { computeMin } from '@/valeurAvancement/computeMin'

describe('computeMin', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeMin([])).toBeNull()
  })

  it('retourne la valeur unique pour un tableau de taille 1', () => {
    expect(computeMin([42])).toBe(42)
  })

  it('retourne la plus petite valeur', () => {
    expect(computeMin([3, 1, 2])).toBe(1)
    expect(computeMin([10, 20, 30, 40, 50])).toBe(10)
  })

  it('gère les nombres négatifs', () => {
    expect(computeMin([-5, -1, -3])).toBe(-5)
    expect(computeMin([-10, 5, 10])).toBe(-10)
  })

  it('gère les valeurs décimales', () => {
    expect(computeMin([1.5, 0.5, 2.5])).toBe(0.5)
  })

  it('gère les doublons', () => {
    expect(computeMin([5, 5, 5])).toBe(5)
    expect(computeMin([1, 1, 2])).toBe(1)
  })
})
