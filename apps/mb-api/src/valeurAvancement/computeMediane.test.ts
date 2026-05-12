import { describe, expect, it } from 'vitest'

import { computeMediane } from '@/valeurAvancement/computeMediane'

describe('computeMediane', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeMediane([])).toBeNull()
  })

  it('retourne la valeur unique pour un tableau de taille 1', () => {
    expect(computeMediane([42])).toBe(42)
  })

  it('retourne la valeur centrale pour un nombre impair de valeurs', () => {
    expect(computeMediane([1, 2, 3])).toBe(2)
    expect(computeMediane([10, 20, 30, 40, 50])).toBe(30)
  })

  it('retourne la moyenne des deux valeurs centrales pour un nombre pair', () => {
    expect(computeMediane([1, 2, 3, 4])).toBe(2.5)
    expect(computeMediane([10, 20, 30, 40])).toBe(25)
  })

  it("trie les valeurs avant de calculer (l'ordre d'entrée n'importe pas)", () => {
    expect(computeMediane([3, 1, 2])).toBe(2)
    expect(computeMediane([40, 10, 30, 20])).toBe(25)
  })

  it('gère les nombres négatifs', () => {
    expect(computeMediane([-5, -1, -3])).toBe(-3)
    expect(computeMediane([-10, -5, 5, 10])).toBe(0)
  })

  it('gère les valeurs décimales', () => {
    expect(computeMediane([1.5, 2.5, 3.5])).toBe(2.5)
    expect(computeMediane([1.1, 2.2])).toBeCloseTo(1.65)
  })

  it('gère les doublons', () => {
    expect(computeMediane([5, 5, 5])).toBe(5)
    expect(computeMediane([1, 2, 2, 3])).toBe(2)
  })

  it('trie numériquement (pas lexicographiquement) pour distinguer 2 et 10', () => {
    expect(computeMediane([10, 2, 1])).toBe(2)
  })
})
