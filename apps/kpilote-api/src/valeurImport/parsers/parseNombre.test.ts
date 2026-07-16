import { describe, expect, it } from 'vitest'

import { parseNombre } from '@/valeurImport/parsers/parseNombre'

const valeur = (v: unknown): number | null => {
  const r = parseNombre(v)
  return r.ok ? r.valeur : null
}

describe('parseNombre', () => {
  it('accepte un nombre natif', () => {
    expect(valeur(42)).toBe(42)
    expect(valeur(3.14)).toBe(3.14)
  })

  it('gère la virgule décimale FR', () => {
    expect(valeur('3,14')).toBe(3.14)
    expect(valeur('-5,5')).toBe(-5.5)
  })

  it('gère les séparateurs de milliers (espace, insécable, point)', () => {
    expect(valeur('1 234,56')).toBe(1234.56)
    expect(valeur('1 234,56')).toBe(1234.56)
    expect(valeur('1 000 000')).toBe(1000000)
    expect(valeur('1.234,56')).toBe(1234.56)
  })

  it('gère la convention anglo-saxonne (point décimal, virgule millier)', () => {
    expect(valeur('1,234.56')).toBe(1234.56)
  })

  it('retire les symboles d’unité collés', () => {
    expect(valeur('12 %')).toBe(12)
    expect(valeur('1 500 €')).toBe(1500)
  })

  it('rejette ce qui n’est pas un nombre', () => {
    expect(valeur('')).toBeNull()
    expect(valeur('abc')).toBeNull()
    expect(valeur('-')).toBeNull()
    expect(valeur(null)).toBeNull()
  })
})
