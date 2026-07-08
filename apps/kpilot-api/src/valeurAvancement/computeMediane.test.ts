import { describe, expect, it } from 'vitest'

import { Decimal } from '@/framework/decimal'
import { computeMediane, groupMedianesByKey } from '@/valeurAvancement/computeMediane'

const d = (n: number): Decimal => new Decimal(n)

describe('computeMediane', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeMediane([])).toBeNull()
  })

  it('retourne la valeur unique pour un tableau de taille 1', () => {
    expect(computeMediane([d(42)])).toBe(42)
  })

  it('retourne la valeur centrale pour un nombre impair de valeurs', () => {
    expect(computeMediane([d(1), d(2), d(3)])).toBe(2)
    expect(computeMediane([d(10), d(20), d(30), d(40), d(50)])).toBe(30)
  })

  it('retourne la moyenne des deux valeurs centrales pour un nombre pair', () => {
    expect(computeMediane([d(1), d(2), d(3), d(4)])).toBe(2.5)
    expect(computeMediane([d(10), d(20), d(30), d(40)])).toBe(25)
  })

  it("trie les valeurs avant de calculer (l'ordre d'entrée n'importe pas)", () => {
    expect(computeMediane([d(3), d(1), d(2)])).toBe(2)
    expect(computeMediane([d(40), d(10), d(30), d(20)])).toBe(25)
  })

  it('gère les nombres négatifs', () => {
    expect(computeMediane([d(-5), d(-1), d(-3)])).toBe(-3)
    expect(computeMediane([d(-10), d(-5), d(5), d(10)])).toBe(0)
  })

  it('gère les valeurs décimales', () => {
    expect(computeMediane([d(1.5), d(2.5), d(3.5)])).toBe(2.5)
    expect(computeMediane([d(1.1), d(2.2)])).toBeCloseTo(1.65)
  })

  it('gère les doublons', () => {
    expect(computeMediane([d(5), d(5), d(5)])).toBe(5)
    expect(computeMediane([d(1), d(2), d(2), d(3)])).toBe(2)
  })

  it('trie numériquement (pas lexicographiquement) pour distinguer 2 et 10', () => {
    expect(computeMediane([d(10), d(2), d(1)])).toBe(2)
  })
})

describe('groupMedianesByKey', () => {
  it('retourne une map vide pour une entrée vide', () => {
    expect(
      groupMedianesByKey<{ key: string; valeur: Decimal }, string>(
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
