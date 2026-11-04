import { describe, expect, it } from 'vitest'

import { formatDate, formatEcart, formatTaux, formatValeur } from '@/assistant/tools/rapport/format'

describe('formats recopiés par le sous-agent', () => {
  it('écrit une valeur avec son unité, le pourcentage en « % »', () => {
    expect(formatValeur(67.65, 'Pourcentage')).toBe('67,65 %')
    expect(formatValeur(1200, 'Nombre')).toBe('1 200 Nombre')
    expect(formatValeur(3, null)).toBe('3')
    expect(formatValeur(null, 'Pourcentage')).toBe('non renseignée')
  })

  it('arrondit le taux de progression', () => {
    expect(formatTaux(66.6)).toBe('67 %')
    expect(formatTaux(null)).toBe('non calculé')
  })

  it('signe un écart avec le signe moins typographique', () => {
    expect(formatEcart(-1.5, 'Pourcentage')).toBe('−1,5 %')
    expect(formatEcart(2, null)).toBe('+2')
    expect(formatEcart(0, null)).toBe('0')
    expect(formatEcart(null, null)).toBe('non calculé')
  })

  it('écrit une date en toutes lettres', () => {
    expect(formatDate('2026-03-01')).toBe('1 mars 2026')
  })
})
