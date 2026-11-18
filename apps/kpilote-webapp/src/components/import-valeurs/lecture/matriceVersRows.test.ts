import { describe, expect, it } from 'vitest'
import {
  formatDateCell,
  parseValeurCell,
  matriceVersRows,
} from '@/components/import-valeurs/lecture/matriceVersRows'

describe('formatDateCell', () => {
  it('formate un objet Date en YYYY-MM-DD (UTC)', () => {
    expect(formatDateCell({ cell: new Date(Date.UTC(2024, 0, 15)) })).toBe('2024-01-15')
  })

  it('laisse une chaîne telle quelle (trim)', () => {
    expect(formatDateCell({ cell: ' 2024-01-15 ' })).toBe('2024-01-15')
  })
})

describe('parseValeurCell', () => {
  it('garde un nombre tel quel', () => {
    expect(parseValeurCell({ cell: 7.2 })).toBe(7.2)
  })

  it('convertit une décimale à virgule en nombre', () => {
    expect(parseValeurCell({ cell: '1,5' })).toBe(1.5)
  })

  it('renvoie la chaîne brute si non numérique', () => {
    expect(parseValeurCell({ cell: 'abc' })).toBe('abc')
  })
})

describe('matriceVersRows', () => {
  it('parse une matrice valide en lignes normalisées', () => {
    const result = matriceVersRows({
      matrice: [
        ['individu', 'date', 'valeur'],
        ['DEPT-84', '2024-01-15', 7.2],
        ['DEPT-13', '2024-01-15', 8.1],
      ],
    })
    expect(result).toEqual({
      ok: true,
      rows: [
        { individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 },
        { individu: 'DEPT-13', date: '2024-01-15', valeur: 8.1 },
      ],
    })
  })

  it('tolère un ordre de colonnes différent et une casse mixte', () => {
    const result = matriceVersRows({
      matrice: [
        ['Valeur', 'Individu', 'Date'],
        [7.2, 'DEPT-84', '2024-01-15'],
      ],
    })
    expect(result).toEqual({
      ok: true,
      rows: [{ individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 }],
    })
  })

  it('remonte MISSING_COLUMNS si une colonne manque', () => {
    const result = matriceVersRows({
      matrice: [
        ['individu', 'valeur'],
        ['DEPT-84', 7.2],
      ],
    })
    expect(result).toEqual({ ok: false, error: { code: 'MISSING_COLUMNS', missing: ['date'] } })
  })

  it('remonte EMPTY si la matrice est vide', () => {
    expect(matriceVersRows({ matrice: [] })).toEqual({ ok: false, error: { code: 'EMPTY' } })
  })

  it('remonte EMPTY si aucune ligne de données', () => {
    const result = matriceVersRows({ matrice: [['individu', 'date', 'valeur']] })
    expect(result).toEqual({ ok: false, error: { code: 'EMPTY' } })
  })

  it('remonte TOO_MANY_ROWS au-delà de 1000 lignes', () => {
    const lignes = Array.from({ length: 1001 }, () => ['DEPT-84', '2024-01-15', 7.2])
    const result = matriceVersRows({ matrice: [['individu', 'date', 'valeur'], ...lignes] })
    expect(result).toEqual({ ok: false, error: { code: 'TOO_MANY_ROWS', count: 1001, max: 1000 } })
  })

  it('convertit une cellule Date (UTC) en YYYY-MM-DD', () => {
    const result = matriceVersRows({
      matrice: [
        ['individu', 'date', 'valeur'],
        ['DEPT-01', new Date(Date.UTC(2025, 5, 3)), 42],
      ],
    })
    expect(result).toEqual({
      ok: true,
      rows: [{ individu: 'DEPT-01', date: '2025-06-03', valeur: 42 }],
    })
  })
})

describe('matriceVersRows — indicateur à axes', () => {
  const axes = [
    { id: 'AXE-OPERATEUR', nom: 'Opérateur' },
    { id: 'AXE-FRAUDE', nom: 'Type de fraude' },
  ]

  it('lit une colonne par axe, dans l’ordre des axes, quel que soit l’ordre des colonnes', () => {
    const result = matriceVersRows({
      matrice: [
        ['axe-fraude', 'individu', 'date', 'AXE-OPERATEUR', 'valeur'],
        ['FR-TVA', 'DEPT-84', '2024-01-15', ' OP-ORANGE ', 7.2],
      ],
      axes,
    })
    expect(result).toEqual({
      ok: true,
      rows: [
        {
          individu: 'DEPT-84',
          modalites: ['OP-ORANGE', 'FR-TVA'],
          date: '2024-01-15',
          valeur: 7.2,
        },
      ],
    })
  })

  it('omet une cellule d’axe vide (l’API signale la modalité manquante)', () => {
    const result = matriceVersRows({
      matrice: [
        ['individu', 'AXE-OPERATEUR', 'AXE-FRAUDE', 'date', 'valeur'],
        ['DEPT-84', '', 'FR-TVA', '2024-01-15', 1],
      ],
      axes,
    })
    expect(result).toEqual({
      ok: true,
      rows: [{ individu: 'DEPT-84', modalites: ['FR-TVA'], date: '2024-01-15', valeur: 1 }],
    })
  })

  it('remonte MISSING_COLUMNS avec la colonne d’axe absente', () => {
    const result = matriceVersRows({
      matrice: [
        ['individu', 'AXE-OPERATEUR', 'date', 'valeur'],
        ['DEPT-84', 'OP-ORANGE', '2024-01-15', 1],
      ],
      axes,
    })
    expect(result).toEqual({
      ok: false,
      error: { code: 'MISSING_COLUMNS', missing: ['AXE-FRAUDE'] },
    })
  })
})
