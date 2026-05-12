import { describe, expect, it } from 'vitest'

import { computeMax } from '@/valeurAvancement/computeMax'

describe('computeMax', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeMax([])).toBeNull()
  })

  it('retourne la valeur unique pour un tableau de taille 1', () => {
    expect(computeMax([42])).toBe(42)
  })

  it('retourne la plus grande valeur', () => {
    expect(computeMax([3, 1, 2])).toBe(3)
    expect(computeMax([10, 20, 30, 40, 50])).toBe(50)
  })

  it('gère les nombres négatifs', () => {
    expect(computeMax([-5, -1, -3])).toBe(-1)
    expect(computeMax([-10, -5, -50])).toBe(-5)
  })

  it('gère les valeurs décimales', () => {
    expect(computeMax([1.5, 0.5, 2.5])).toBe(2.5)
  })

  it('gère les doublons', () => {
    expect(computeMax([5, 5, 5])).toBe(5)
    expect(computeMax([1, 2, 2])).toBe(2)
  })
})
