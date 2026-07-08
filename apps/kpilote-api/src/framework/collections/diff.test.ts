import { describe, expect, it } from 'vitest'

import { diff } from '@/framework/collections/diff'

describe('diff', () => {
  it('retourne toAdd = desired \\ existing et toRemove = existing \\ desired', () => {
    expect(diff(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual({
      toAdd: ['a'],
      toRemove: ['d'],
    })
  })

  it('retourne deux tableaux vides quand les ensembles sont identiques', () => {
    expect(diff(['a', 'b'], ['b', 'a'])).toEqual({ toAdd: [], toRemove: [] })
  })

  it('considère tout comme toAdd quand existing est vide', () => {
    expect(diff(['a', 'b'], [])).toEqual({ toAdd: ['a', 'b'], toRemove: [] })
  })

  it('considère tout comme toRemove quand desired est vide', () => {
    expect(diff([], ['a', 'b'])).toEqual({ toAdd: [], toRemove: ['a', 'b'] })
  })

  it("préserve l'ordre de desired dans toAdd et l'ordre de existing dans toRemove", () => {
    expect(diff(['c', 'a', 'b'], ['d', 'b', 'e'])).toEqual({
      toAdd: ['c', 'a'],
      toRemove: ['d', 'e'],
    })
  })
})
