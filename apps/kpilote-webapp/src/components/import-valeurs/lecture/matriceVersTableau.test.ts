import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { type TableauSource } from '@pilote/kpilote-shared/valeurImport'
import { describe, expect, it } from 'vitest'

import { matriceVersTableau } from '@/components/import-valeurs/lecture/matriceVersTableau'
import { readTableau } from '@/components/import-valeurs/lecture/readTableau'

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

const readSample = async (nom: string) => {
  const bytes = readFileSync(join(import.meta.dirname, '../../../../samples', nom))
  return readTableau({ file: new File([bytes], nom) })
}

// Les tableaux attendus sont ceux de `applyPlan.samples.test.ts` (kpilote-shared),
// écrits à la main : ce test vérifie que le lecteur de la webapp donne bien ces
// tableaux à partir des fichiers.
describe('lecture des fichiers d’exemple', () => {
  it('05_import_albert_axes : point-virgule, virgule décimale, cellule vide en fin de ligne', async () => {
    const attendu: TableauSource = {
      entetes: ['Département', 'Opérateur', 'Type de fraude', 'T1 2019', 'T2 2019'],
      lignes: [
        ['Ain', 'Orange', 'TVA', '12,4', '13,1'],
        ['Ain', 'SFR', "Fraude à l'IR", '3,2', 'n.d.'],
        ['Bdr', 'Bouygues', 'Cotisations', '8,8', '9,4'],
        ['Corse', 'Free Mobile', 'Prestations', '1,1', '1,3'],
        ['Paris', 'MVNO', 'TVA', '20,5', '21,0'],
        ['Cotes d Armor', 'Orange', 'Impôt sur les sociétés', '4,4', '4,9'],
        // Le test de kpilote-shared écrit '' : le lecteur rend `null` pour une
        // cellule vide. `applyPlan` lit les deux comme une cellule vide.
        ['Vaucluse', 'SFR', 'Cotisations', '2,7', null],
      ],
    }
    expect(await readSample('05_import_albert_axes.csv')).toEqual({ ok: true, tableau: attendu })
  })

  it('12_import_albert_virgule_mois_en_colonnes : libellé entre guillemets qui contient une virgule', async () => {
    const libelleIr = "Fraude à l'impôt sur le revenu, IR"
    const libelleTva = 'TVA (fraude carrousel incluse)'
    const attendu: TableauSource = {
      entetes: [
        'Code département',
        'Opérateur',
        'Nature de la fraude',
        'janv. 2027',
        'févr. 2027',
        'mars 2027',
      ],
      lignes: [
        ['01', 'OP-ORANGE', libelleIr, '0.985', '1.005', '1.025'],
        ['01', 'OP-ORANGE', libelleTva, '2.046', '2.087', '2.128'],
        ['01', 'OP-SFR', libelleIr, '0.543', '0.554', '0.565'],
        ['01', 'OP-SFR', libelleTva, '1.507', '1.537', '1.567'],
        ['38', 'OP-ORANGE', libelleIr, '1.846', '1.883', '1.920'],
        ['38', 'OP-ORANGE', libelleTva, '3.917', '3.995', '4.073'],
        ['38', 'OP-SFR', libelleIr, '1.109', '1.131', '1.153'],
        ['38', 'OP-SFR', libelleTva, '2.514', '2.565', '2.615'],
      ],
    }
    expect(await readSample('12_import_albert_virgule_mois_en_colonnes.csv')).toEqual({
      ok: true,
      tableau: attendu,
    })
  })
})
