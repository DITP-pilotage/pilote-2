import { describe, expect, it } from 'vitest'

import { parseFrLibre } from '@/valeurImport/parsers/parseFrLibre'

describe('parseFrLibre', () => {
  it('gère l’ISO, y compris datetime (le bug d’origine)', () => {
    expect(parseFrLibre('2022-09-30')).toBe('2022-09-30')
    expect(parseFrLibre('2022-09-30T21:59:39.000Z')).toBe('2022-09-30')
  })

  it('ramène un datetime à offset sur la date calendaire Europe/Paris', () => {
    // 23h UTC en hiver (Paris = UTC+1) → bascule au lendemain.
    expect(parseFrLibre('2022-12-31T23:00:00Z')).toBe('2023-01-01')
    // 23h UTC en été (Paris = UTC+2) → bascule aussi au lendemain.
    expect(parseFrLibre('2022-06-30T23:00:00Z')).toBe('2022-07-01')
    // 21h UTC en hiver reste le même jour à Paris (22h locale).
    expect(parseFrLibre('2022-12-31T21:00:00Z')).toBe('2022-12-31')
  })

  it('priorise trimestre puis mois sur l’extraction d’année', () => {
    expect(parseFrLibre('T1 2023')).toBe('2023-01-01')
    expect(parseFrLibre('janvier 2023')).toBe('2023-01-01')
    expect(parseFrLibre('2023')).toBe('2023-01-01')
  })

  it('délègue les dates naturelles complètes à chrono', () => {
    expect(parseFrLibre('15 mars 2025')).toBe('2025-03-15')
    expect(parseFrLibre('1er janvier 2025')).toBe('2025-01-01')
    expect(parseFrLibre('15/03/2025')).toBe('2025-03-15')
  })

  it('normalise différentes entrées vides ou non parsables vers null', () => {
    expect(parseFrLibre('')).toBeNull()
    expect(parseFrLibre(null)).toBeNull()
    expect(parseFrLibre('population totale')).toBeNull()
    expect(parseFrLibre('2020-2023')).toBeNull()
  })

  it('avale un en-tête pivot bruité porteur d’une seule année', () => {
    expect(parseFrLibre('Émissions 2021 en kt')).toBe('2021-01-01')
  })
})
