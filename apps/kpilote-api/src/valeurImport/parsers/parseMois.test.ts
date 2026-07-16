import { describe, expect, it } from 'vitest'

import { parseMois } from '@/valeurImport/parsers/parseMois'

describe('parseMois', () => {
  it('résout un mois en toutes lettres au 1er du mois', () => {
    expect(parseMois('janvier 2026')).toBe('2026-01-01')
    expect(parseMois('décembre 2023')).toBe('2023-12-01')
    expect(parseMois('Février 2024')).toBe('2024-02-01')
  })

  it('accepte les abréviations et l’ordre inversé', () => {
    expect(parseMois('janv 2026')).toBe('2026-01-01')
    expect(parseMois('sept. 2023')).toBe('2023-09-01')
    expect(parseMois('2026 janvier')).toBe('2026-01-01')
  })

  it('gère les formes numériques MM/YYYY et YYYY-MM', () => {
    expect(parseMois('01/2023')).toBe('2023-01-01')
    expect(parseMois('12-2023')).toBe('2023-12-01')
    expect(parseMois('2023-01')).toBe('2023-01-01')
    expect(parseMois('2023/12')).toBe('2023-12-01')
  })

  it('ne grignote pas une date complète (laisse chrono faire)', () => {
    expect(parseMois('15/03/2025')).toBeNull()
  })

  it('renvoie null si mois inconnu, absent, ou ambigu', () => {
    expect(parseMois('2023')).toBeNull()
    expect(parseMois('13/2023')).toBeNull()
    expect(parseMois('séparation 2023')).toBeNull()
  })
})
