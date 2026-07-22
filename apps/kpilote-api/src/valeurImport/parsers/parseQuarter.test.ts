import { describe, expect, it } from 'vitest'

import { parseQuarter } from '@/valeurImport/parsers/parseQuarter'

describe('parseQuarter', () => {
  it('résout un trimestre au 1er jour du trimestre', () => {
    expect(parseQuarter('Q1 2023')).toBe('2023-01-01')
    expect(parseQuarter('T2 2023')).toBe('2023-04-01')
    expect(parseQuarter('Q3 2023')).toBe('2023-07-01')
    expect(parseQuarter('T4 2023')).toBe('2023-10-01')
  })

  it('accepte l’année avant ou après le trimestre', () => {
    expect(parseQuarter('2023 Q4')).toBe('2023-10-01')
    expect(parseQuarter('2023 T4')).toBe('2023-10-01')
  })

  it('accepte la forme en toutes lettres', () => {
    expect(parseQuarter('1er trimestre 2023')).toBe('2023-01-01')
    expect(parseQuarter('4e trim. 2023')).toBe('2023-10-01')
    expect(parseQuarter('trimestre 2 2023')).toBe('2023-04-01')
  })

  it('tolère du bruit autour', () => {
    expect(parseQuarter('Émissions T1 2023 (kt)')).toBe('2023-01-01')
  })

  it('renvoie null si pas de trimestre ou année ambiguë', () => {
    expect(parseQuarter('2023')).toBeNull()
    expect(parseQuarter('Q1 2023 vs Q1 2022')).toBeNull()
    expect(parseQuarter('janvier 2023')).toBeNull()
  })
})
