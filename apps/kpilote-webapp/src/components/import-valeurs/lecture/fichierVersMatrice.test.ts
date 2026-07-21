import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { fichierVersMatrice } from '@/components/import-valeurs/lecture/fichierVersMatrice'

const csvFile = (contenu: string) => new File([contenu], 'valeurs.csv', { type: 'text/csv' })

describe('fichierVersMatrice', () => {
  it('lit un CSV en matrice de cellules (dates typées, nombres bruts)', async () => {
    const lecture = await fichierVersMatrice({
      file: csvFile('individu,date,valeur\nDEPT-84,2024-01-15,7.2\n'),
    })
    expect(lecture.ok).toBe(true)
    if (!lecture.ok) return
    expect(lecture.matrice[0]).toEqual(['individu', 'date', 'valeur'])
    expect(lecture.matrice[1]?.[0]).toBe('DEPT-84')
    // cellDates: true → la date du CSV est remontée en objet Date (converti plus tard par formatDateCell)
    expect(lecture.matrice[1]?.[1]).toBeInstanceOf(Date)
    expect(lecture.matrice[1]?.[2]).toBe(7.2)
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
