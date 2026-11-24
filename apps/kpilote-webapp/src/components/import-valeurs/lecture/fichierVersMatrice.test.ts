import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { fichierVersMatrice } from '@/components/import-valeurs/lecture/fichierVersMatrice'

const csvFile = (contenu: string) => new File([contenu], 'valeurs.csv', { type: 'text/csv' })

describe('fichierVersMatrice', () => {
  it('lit un CSV en gardant ses cellules en texte, accents et virgule décimale compris', async () => {
    const lecture = await fichierVersMatrice({
      file: csvFile('Département;Période;Taux\nCôtes-d’Armor;03/04/2024;12,4\n'),
    })
    expect(lecture.ok).toBe(true)
    if (!lecture.ok) return
    expect(lecture.matrice[0]).toEqual(['Département', 'Période', 'Taux'])
    expect(lecture.matrice[1]).toEqual(['Côtes-d’Armor', '03/04/2024', '12,4'])
  })

  it('lit un CSV encodé en Windows-1252', async () => {
    // « Département » : le é est l’octet 0xE9, invalide en UTF-8.
    const bytes = new Uint8Array([0x44, 0xe9, 0x70, 0x74, 0x0a, 0x41, 0x69, 0x6e, 0x0a])
    const lecture = await fichierVersMatrice({ file: new File([bytes], 'valeurs.csv') })
    expect(lecture.ok).toBe(true)
    if (!lecture.ok) return
    expect(lecture.matrice[0]).toEqual(['Dépt'])
  })

  it('lit un XLSX en préservant les cellules Date', async () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['individu', 'date', 'valeur'],
      ['DEPT-01', new Date(Date.UTC(2025, 5, 3)), 42],
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Feuille1')
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    const file = new File([buffer], 'valeurs.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const lecture = await fichierVersMatrice({ file })
    expect(lecture.ok).toBe(true)
    if (!lecture.ok) return
    expect(lecture.matrice[0]).toEqual(['individu', 'date', 'valeur'])
    expect(lecture.matrice[1]?.[0]).toBe('DEPT-01')
    expect(lecture.matrice[1]?.[1]).toBeInstanceOf(Date)
    expect(lecture.matrice[1]?.[2]).toBe(42)
  })

  it('remonte ok:false si la lecture du fichier échoue', async () => {
    // xlsx est très permissif sur le contenu ; la seule voie réaliste vers ok:false
    // est un échec d'I/O à la lecture du fichier.
    const file = {
      name: 'illisible.xlsx',
      arrayBuffer: () => Promise.reject(new Error('lecture impossible')),
    } as unknown as File
    const lecture = await fichierVersMatrice({ file })
    expect(lecture).toEqual({ ok: false })
  })
})
