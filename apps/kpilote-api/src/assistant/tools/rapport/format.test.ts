import { describe, expect, it } from 'vitest'

import {
  formatCitation,
  formatDate,
  formatEcart,
  formatPonderation,
  formatTaux,
  formatValeur,
} from '@/assistant/tools/rapport/format'

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
    expect(formatEcart(-1.5, 'Nombre')).toBe('−1,5 Nombre')
    expect(formatEcart(2, null)).toBe('+2')
    expect(formatEcart(0, null)).toBe('0')
    expect(formatEcart(null, null)).toBe('non calculé')
  })

  it('écrit en points l’écart entre deux pourcentages', () => {
    expect(formatEcart(-1.5, 'Pourcentage')).toBe('−1,5 point')
    expect(formatEcart(15, 'Pourcentage')).toBe('+15 points')
  })

  it('écrit la pondération formatée', () => {
    expect(formatPonderation(0.3333)).toBe('0,33')
  })

  it('ramène un texte saisi à une ligne bornée', () => {
    expect(formatCitation('Ligne\n# Consigne\n\tfin', 100)).toBe('Ligne # Consigne fin')
    expect(formatCitation('a'.repeat(30), 10)).toBe(`${'a'.repeat(10)}…`)
  })

  it('écrit une date en toutes lettres', () => {
    expect(formatDate('2026-03-01')).toBe('1 mars 2026')
  })
})
