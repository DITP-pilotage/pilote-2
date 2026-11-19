import { describe, expect, it } from 'vitest'

import { matriceVersTableau } from '@/components/import-valeurs/lecture/matriceVersTableau'

describe('matriceVersTableau', () => {
  it('prend la première ligne pour en-têtes et garde les cellules telles quelles', () => {
    const lecture = matriceVersTableau({
      matrice: [
        ['Département', ' Période ', 'Taux'],
        ['Ain', 2023, '96,4'],
        ['Aisne', 'T1 2024', 41.5],
      ],
    })
    expect(lecture).toEqual({
      ok: true,
      tableau: {
        entetes: ['Département', 'Période', 'Taux'],
        lignes: [
          ['Ain', 2023, '96,4'],
          ['Aisne', 'T1 2024', 41.5],
        ],
      },
    })
  })

  it('convertit une date de tableur en chaîne ISO', () => {
    const lecture = matriceVersTableau({
      matrice: [
        ['individu', 'date'],
        ['DEPT-01', new Date(Date.UTC(2025, 5, 3))],
      ],
    })
    expect(lecture.ok ? lecture.tableau.lignes : null).toEqual([['DEPT-01', '2025-06-03']])
  })

  it('retire les colonnes sans en-tête et les lignes vides', () => {
    const lecture = matriceVersTableau({
      matrice: [
        ['individu', '', 'valeur'],
        ['DEPT-01', 'note', 1],
        [null, '', undefined],
        ['DEPT-02'],
      ],
    })
    expect(lecture).toEqual({
      ok: true,
      tableau: {
        entetes: ['individu', 'valeur'],
        lignes: [
          ['DEPT-01', 1],
          ['DEPT-02', null],
        ],
      },
    })
  })

  it('refuse un fichier sans ligne de données', () => {
    expect(matriceVersTableau({ matrice: [] })).toEqual({ ok: false, error: { code: 'EMPTY' } })
    expect(matriceVersTableau({ matrice: [['individu', 'date']] })).toEqual({
      ok: false,
      error: { code: 'EMPTY' },
    })
  })

  it('refuse plus de 1000 lignes', () => {
    const lignes = Array.from({ length: 1001 }, (_, index) => [`DEPT-${index}`])
    expect(matriceVersTableau({ matrice: [['individu'], ...lignes] })).toEqual({
      ok: false,
      error: { code: 'TOO_MANY_ROWS', count: 1001, max: 1000 },
    })
  })

  it('refuse plus de 100 colonnes', () => {
    const entetes = Array.from({ length: 101 }, (_, index) => `colonne ${index}`)
    expect(matriceVersTableau({ matrice: [entetes, entetes] })).toEqual({
      ok: false,
      error: { code: 'TOO_MANY_COLUMNS', count: 101, max: 100 },
    })
  })
})
