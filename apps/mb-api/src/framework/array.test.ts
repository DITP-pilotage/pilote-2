import { describe, expect, it } from 'vitest'

import { groupBy, unique } from '@/framework/array'

describe('unique', () => {
  it('retourne un tableau vide pour une entrée vide', () => {
    expect(unique([])).toEqual([])
  })

  it("préserve l'ordre de première occurrence", () => {
    expect(unique([3, 1, 2, 1, 3, 4])).toEqual([3, 1, 2, 4])
  })

  it('dédoublonne les chaînes', () => {
    expect(unique(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c'])
  })

  it('utilise une égalité de référence pour les objets', () => {
    const a = { x: 1 }
    const b = { x: 1 }
    expect(unique([a, b, a])).toEqual([a, b])
  })
})

describe('groupBy', () => {
  it('retourne une map vide pour une entrée vide', () => {
    expect(groupBy<number, string>([], () => 'k')).toEqual(new Map())
  })

  it('groupe les éléments selon la clé', () => {
    const result = groupBy([1, 2, 3, 4], (n) => (n % 2 === 0 ? 'pair' : 'impair'))
    expect(result.get('pair')).toEqual([2, 4])
    expect(result.get('impair')).toEqual([1, 3])
  })

  it("préserve l'ordre d'apparition au sein de chaque groupe", () => {
    const result = groupBy([3, 1, 2], (n) => (n > 1 ? 'gt1' : 'le1'))
    expect(result.get('gt1')).toEqual([3, 2])
    expect(result.get('le1')).toEqual([1])
  })

  it('utilise des clés non-primitives via Map (référence)', () => {
    const k1 = { id: 1 }
    const k2 = { id: 2 }
    const result = groupBy(
      [
        { tag: k1, v: 'a' },
        { tag: k2, v: 'b' },
        { tag: k1, v: 'c' },
      ],
      (item) => item.tag,
    )
    expect(result.get(k1)?.map((i) => i.v)).toEqual(['a', 'c'])
    expect(result.get(k2)?.map((i) => i.v)).toEqual(['b'])
  })
})
