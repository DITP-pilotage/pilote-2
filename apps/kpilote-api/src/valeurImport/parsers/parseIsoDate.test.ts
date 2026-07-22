import { describe, expect, it } from 'vitest'

import { parseIsoDate } from '@/valeurImport/parsers/parseIsoDate'

describe('parseIsoDate', () => {
  it('accepte une date nue YYYY-MM-DD', () => {
    expect(parseIsoDate('2023-09-30')).toBe('2023-09-30')
  })

  it('extrait la date d’un datetime UTC en interprétant Europe/Paris', () => {
    // 21:59 UTC = 23:59 Paris (été) → même jour
    expect(parseIsoDate('2022-09-30T21:59:39.000Z')).toBe('2022-09-30')
    // 22:59 UTC = 23:59 Paris (hiver) → même jour
    expect(parseIsoDate('2022-12-30T22:59:39.000Z')).toBe('2022-12-30')
  })

  it('bascule de jour quand l’instant UTC franchit minuit à Paris', () => {
    // 23:00 UTC le 31/12 = 00:00 Paris le 01/01
    expect(parseIsoDate('2022-12-31T23:00:00.000Z')).toBe('2023-01-01')
  })

  it('gère un offset explicite', () => {
    expect(parseIsoDate('2023-06-15T10:00:00+02:00')).toBe('2023-06-15')
  })

  it('garde la date écrite d’un datetime flottant (sans offset)', () => {
    expect(parseIsoDate('2023-06-15T23:30:00')).toBe('2023-06-15')
  })

  it('rejette une date calendaire invalide', () => {
    expect(parseIsoDate('2023-02-30')).toBeNull()
    expect(parseIsoDate('2023-13-01')).toBeNull()
  })

  it('renvoie null pour ce qui n’est pas de l’ISO', () => {
    expect(parseIsoDate('30/09/2023')).toBeNull()
    expect(parseIsoDate('2023')).toBeNull()
  })
})
