import { describe, expect, it } from 'vitest'

import { Prisma } from '@/generated/prisma/client'
import {
  computeMediane,
  computeMedianeFromDecimals,
  groupMedianesByKey,
} from '@/valeurAvancement/computeMediane'

const d = (n: number): Prisma.Decimal => new Prisma.Decimal(n)

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

describe('computeMedianeFromDecimals', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeMedianeFromDecimals([])).toBeNull()
  })

  it('calcule la médiane sur les Decimal mappés en number', () => {
    expect(computeMedianeFromDecimals([{ valeur: d(10) }, { valeur: d(30) }])).toBe(20)
    expect(computeMedianeFromDecimals([{ valeur: d(1) }, { valeur: d(2) }, { valeur: d(3) }])).toBe(
      2,
    )
  })

  it('gère les décimaux Decimal sans perte de précision', () => {
    expect(computeMedianeFromDecimals([{ valeur: d(0.1) }, { valeur: d(0.2) }])).toBeCloseTo(0.15)
  })
})

describe('groupMedianesByKey', () => {
  it('retourne une map vide pour une entrée vide', () => {
    expect(
      groupMedianesByKey<{ key: string; valeur: Prisma.Decimal }, string>(
        [],
        (r) => r.key,
        (r) => r.valeur,
      ),
    ).toEqual(new Map())
  })

  it('calcule la médiane indépendamment par groupe', () => {
    const rows = [
      { ref: 'A', valeur: d(10) },
      { ref: 'A', valeur: d(30) },
      { ref: 'B', valeur: d(100) },
      { ref: 'B', valeur: d(200) },
    ]
    const result = groupMedianesByKey(
      rows,
      (r) => r.ref,
      (r) => r.valeur,
    )
    expect(result.get('A')).toBe(20)
    expect(result.get('B')).toBe(150)
  })

  it('retourne la valeur unique quand un groupe a un seul élément', () => {
    const result = groupMedianesByKey(
      [{ ref: 'A', valeur: d(42) }],
      (r) => r.ref,
      (r) => r.valeur,
    )
    expect(result.get('A')).toBe(42)
  })
})
