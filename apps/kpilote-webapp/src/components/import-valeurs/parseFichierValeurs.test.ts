import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import {
  formatDateCell,
  parseValeurCell,
  parseFichierValeurs,
} from '@/components/import-valeurs/parseFichierValeurs'

const csvFile = (contenu: string) => new File([contenu], 'valeurs.csv', { type: 'text/csv' })

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

describe('parseFichierValeurs', () => {
  it('parse un CSV valide en lignes normalisées', async () => {
    const result = await parseFichierValeurs({
      file: csvFile('individu,date,valeur\nDEPT-84,2024-01-15,7.2\nDEPT-13,2024-01-15,8.1\n'),
    })
    expect(result).toEqual({
      ok: true,
      rows: [
        { individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 },
        { individu: 'DEPT-13', date: '2024-01-15', valeur: 8.1 },
      ],
    })
  })

  it('remonte MISSING_COLUMNS si une colonne manque', async () => {
    const result = await parseFichierValeurs({
      file: csvFile('individu,valeur\nDEPT-84,7.2\n'),
    })
    expect(result).toEqual({ ok: false, error: { code: 'MISSING_COLUMNS', missing: ['date'] } })
  })

  it('remonte EMPTY si aucune ligne de données', async () => {
    const result = await parseFichierValeurs({ file: csvFile('individu,date,valeur\n') })
    expect(result).toEqual({ ok: false, error: { code: 'EMPTY' } })
  })

  it('remonte TOO_MANY_ROWS au-delà de 1000 lignes', async () => {
    const lignes = Array.from({ length: 1001 }, () => 'DEPT-84,2024-01-15,7.2').join('\n')
    const result = await parseFichierValeurs({ file: csvFile(`individu,date,valeur\n${lignes}\n`) })
    expect(result).toEqual({ ok: false, error: { code: 'TOO_MANY_ROWS', count: 1001, max: 1000 } })
  })

  it('parse un fichier XLSX', async () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['individu', 'date', 'valeur'],
      ['REG-93', '2024-01-15', 7.8],
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Feuille1')
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    const file = new File([buffer], 'valeurs.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const result = await parseFichierValeurs({ file })
    expect(result).toEqual({
      ok: true,
      rows: [{ individu: 'REG-93', date: '2024-01-15', valeur: 7.8 }],
    })
  })

  it('convertit une cellule Date (UTC) en YYYY-MM-DD dans un XLSX', async () => {
    const dateCell = new Date(Date.UTC(2025, 5, 3)) // 2025-06-03
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['individu', 'date', 'valeur'],
      ['DEPT-01', dateCell, 42],
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Feuille1')
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    const file = new File([buffer], 'valeurs.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const result = await parseFichierValeurs({ file })
    expect(result).toEqual({
      ok: true,
      rows: [{ individu: 'DEPT-01', date: '2025-06-03', valeur: 42 }],
    })
  })
})
