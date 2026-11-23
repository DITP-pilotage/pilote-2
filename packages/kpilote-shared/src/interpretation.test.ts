import { describe, expect, it } from 'vitest'

import { interpretDifference, interpretExtremes } from './interpretation'

describe('interpretDifference', () => {
  it.each([
    { difference: 3, sens: 'HAUSSE', expected: 'favorable' },
    { difference: -3, sens: 'HAUSSE', expected: 'unfavorable' },
    { difference: 0, sens: 'HAUSSE', expected: 'neutral' },
    { difference: 3, sens: 'BAISSE', expected: 'unfavorable' },
    { difference: 8 - 10, sens: 'BAISSE', expected: 'favorable' }, // critère du ticket : 10 → 8
    { difference: 0, sens: 'BAISSE', expected: 'neutral' },
  ] as const)('$sens, différence $difference → $expected', ({ difference, sens, expected }) => {
    expect(interpretDifference({ difference, sensSouhaite: sens })).toBe(expected)
  })
})

describe('interpretExtremes', () => {
  it('interprète le maximum et le minimum selon le sens', () => {
    expect(interpretExtremes({ sensSouhaite: 'HAUSSE', sameValue: false })).toEqual({
      max: 'favorable',
      min: 'unfavorable',
    })
    expect(interpretExtremes({ sensSouhaite: 'BAISSE', sameValue: false })).toEqual({
      max: 'unfavorable',
      min: 'favorable',
    })
  })

  it("n'interprète pas deux extrêmes égaux (référentiel à un seul individu)", () => {
    expect(interpretExtremes({ sensSouhaite: 'BAISSE', sameValue: true })).toEqual({
      max: 'neutral',
      min: 'neutral',
    })
  })
})
