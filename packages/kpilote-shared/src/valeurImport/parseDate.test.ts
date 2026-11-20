import { describe, expect, it } from 'vitest'

import { parseDate } from './parseDate'

describe('parseDate', () => {
  it('lit une date ISO et garde la date écrite d’un horodatage', () => {
    expect(parseDate('2022-09-30')).toBe('2022-09-30')
    expect(parseDate('2022-09-30T21:59:39.000Z')).toBe('2022-09-30')
  })

  it('lit une date à la française, jour puis mois', () => {
    expect(parseDate('15/03/2025')).toBe('2025-03-15')
    expect(parseDate('1-2-2024')).toBe('2024-02-01')
  })

  it('lit un trimestre et renvoie son premier jour', () => {
    expect(parseDate('T1 2023')).toBe('2023-01-01')
    expect(parseDate('2023 Q4')).toBe('2023-10-01')
    expect(parseDate('2e trimestre 2024')).toBe('2024-04-01')
  })

  it('lit un mois, en lettres ou en chiffres', () => {
    expect(parseDate('janvier 2023')).toBe('2023-01-01')
    expect(parseDate('Févr. 2024')).toBe('2024-02-01')
    expect(parseDate('03/2025')).toBe('2025-03-01')
    expect(parseDate('2025-03')).toBe('2025-03-01')
  })

  it('lit une date complète en toutes lettres', () => {
    expect(parseDate('15 mars 2025')).toBe('2025-03-15')
    expect(parseDate('1er janvier 2025')).toBe('2025-01-01')
  })

  it('lit une année seule, même dans un en-tête bruité', () => {
    expect(parseDate('2023')).toBe('2023-01-01')
    expect(parseDate(2021)).toBe('2021-01-01')
    expect(parseDate('Émissions 2021 en kt')).toBe('2021-01-01')
  })

  it('renvoie null en cas de doute', () => {
    expect(parseDate('')).toBeNull()
    expect(parseDate(null)).toBeNull()
    expect(parseDate('population totale')).toBeNull()
    expect(parseDate('2020-2023')).toBeNull()
    expect(parseDate('31/02/2024')).toBeNull()
    expect(parseDate('2022-13-40')).toBeNull()
  })
})
