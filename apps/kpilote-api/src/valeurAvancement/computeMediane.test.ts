import { describe, expect, it } from 'vitest'

import { Decimal } from '@/framework/decimal'
import { computeMediane } from '@/valeurAvancement/computeMediane'

const d = (n: number): Decimal => new Decimal(n)
const mediane = (values: ReadonlyArray<Decimal>): number | null =>
  computeMediane(values)?.toNumber() ?? null

describe('computeMediane', () => {
  it('retourne null pour un tableau vide', () => {
    expect(computeMediane([])).toBeNull()
  })

  it('retourne la valeur unique pour un tableau de taille 1', () => {
    expect(mediane([d(42)])).toBe(42)
  })

  it('retourne la valeur centrale pour un nombre impair de valeurs', () => {
    expect(mediane([d(1), d(2), d(3)])).toBe(2)
    expect(mediane([d(10), d(20), d(30), d(40), d(50)])).toBe(30)
  })

  it('retourne la moyenne des deux valeurs centrales pour un nombre pair', () => {
    expect(mediane([d(1), d(2), d(3), d(4)])).toBe(2.5)
    expect(mediane([d(10), d(20), d(30), d(40)])).toBe(25)
  })

  it("trie les valeurs avant de calculer (l'ordre d'entrée n'importe pas)", () => {
    expect(mediane([d(3), d(1), d(2)])).toBe(2)
    expect(mediane([d(40), d(10), d(30), d(20)])).toBe(25)
  })

  it('gère les nombres négatifs', () => {
    expect(mediane([d(-5), d(-1), d(-3)])).toBe(-3)
    expect(mediane([d(-10), d(-5), d(5), d(10)])).toBe(0)
  })

  it('gère les valeurs décimales sans erreur de précision', () => {
    expect(mediane([d(1.5), d(2.5), d(3.5)])).toBe(2.5)
    expect(mediane([d(1.1), d(2.2)])).toBe(1.65)
  })

  it('gère les doublons', () => {
    expect(mediane([d(5), d(5), d(5)])).toBe(5)
    expect(mediane([d(1), d(2), d(2), d(3)])).toBe(2)
  })

  it('trie numériquement (pas lexicographiquement) pour distinguer 2 et 10', () => {
    expect(mediane([d(10), d(2), d(1)])).toBe(2)
  })
})
