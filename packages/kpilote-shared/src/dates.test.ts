import { describe, expect, it } from 'vitest'

import { formatIsoDate, parseDateFr } from './dates'

describe('parseDateFr', () => {
  it('lit une date ISO et garde la date écrite d’un horodatage', () => {
    expect(parseDateFr('2022-09-30')).toBe('2022-09-30')
    expect(parseDateFr('2022-09-30T21:59:39.000Z')).toBe('2022-09-30')
  })

  it('lit une date à la française, jour puis mois', () => {
    expect(parseDateFr('15/03/2025')).toBe('2025-03-15')
    expect(parseDateFr('1-2-2024')).toBe('2024-02-01')
  })

  it('lit un trimestre et renvoie son premier jour', () => {
    expect(parseDateFr('T1 2023')).toBe('2023-01-01')
    expect(parseDateFr('2023 Q4')).toBe('2023-10-01')
    expect(parseDateFr('2e trimestre 2024')).toBe('2024-04-01')
  })

  it('lit un mois, en lettres ou en chiffres', () => {
    expect(parseDateFr('janvier 2023')).toBe('2023-01-01')
    expect(parseDateFr('Févr. 2024')).toBe('2024-02-01')
    expect(parseDateFr('03/2025')).toBe('2025-03-01')
    expect(parseDateFr('2025-03')).toBe('2025-03-01')
  })

  it('lit une date complète en toutes lettres', () => {
    expect(parseDateFr('15 mars 2025')).toBe('2025-03-15')
    expect(parseDateFr('1er janvier 2025')).toBe('2025-01-01')
  })

  it('lit une année seule, même dans un en-tête bruité', () => {
    expect(parseDateFr('2023')).toBe('2023-01-01')
    expect(parseDateFr(2021)).toBe('2021-01-01')
    expect(parseDateFr('Émissions 2021 en kt')).toBe('2021-01-01')
  })

  it('renvoie null en cas de doute', () => {
    expect(parseDateFr('')).toBeNull()
    expect(parseDateFr(null)).toBeNull()
    expect(parseDateFr('population totale')).toBeNull()
    expect(parseDateFr('2020-2023')).toBeNull()
    expect(parseDateFr('31/02/2024')).toBeNull()
    expect(parseDateFr('2022-13-40')).toBeNull()
  })
})

describe('formatIsoDate', () => {
  it('complète le mois et le jour sur deux chiffres', () => {
    expect(formatIsoDate({ year: 2024, month: 3, day: 1 })).toBe('2024-03-01')
  })
})
