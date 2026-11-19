import { describe, expect, it } from 'vitest'

import { parseNombre } from './parseNombre'

describe('parseNombre', () => {
  it('garde un nombre natif', () => {
    expect(parseNombre(42)).toBe(42)
    expect(parseNombre(3.14)).toBe(3.14)
  })

  it('lit la virgule décimale', () => {
    expect(parseNombre('3,14')).toBe(3.14)
    expect(parseNombre('-5,5')).toBe(-5.5)
  })

  it('lit les séparateurs de milliers', () => {
    expect(parseNombre('1 234,56')).toBe(1234.56)
    expect(parseNombre('1 000 000')).toBe(1000000)
    expect(parseNombre('1.234,56')).toBe(1234.56)
    expect(parseNombre('1,234.56')).toBe(1234.56)
  })

  it('retire les unités collées', () => {
    expect(parseNombre('12 %')).toBe(12)
    expect(parseNombre('1 500 €')).toBe(1500)
  })

  it('renvoie null pour ce qui n’est pas un nombre', () => {
    expect(parseNombre('')).toBeNull()
    expect(parseNombre(null)).toBeNull()
    expect(parseNombre('n.d.')).toBeNull()
    expect(parseNombre('-')).toBeNull()
    expect(parseNombre(Number.NaN)).toBeNull()
  })
})
