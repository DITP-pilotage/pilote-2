import { describe, expect, it } from 'vitest'

import { type PlanTransformation, type TableauSource } from '../valeurImport'
import { applyPlan, correctionKey, isImportable, toItemsImport } from './applyPlan'
import { buildPlanStandard, setRapprochement } from './buildPlan'

const resolu = (publicId: string) => ({ statut: 'RESOLU', publicId, par: 'EXACT' }) as const

const planLignes: PlanTransformation = {
  individu: {
    colonne: 'Département',
    rapprochements: {
      Ain: resolu('DEPT-01'),
      Bdr: { statut: 'RESOLU', publicId: 'DEPT-13', par: 'LLM' },
      Corse: { statut: 'AMBIGU', candidats: ['DEPT-2A', 'DEPT-2B'] },
    },
  },
  axes: [],
  valeurs: { disposition: 'LIGNES', colonneDate: 'Période', colonneValeur: 'Taux' },
}

const tableauLignes: TableauSource = {
  entetes: ['Département', 'Période', 'Taux'],
  lignes: [
    ['Ain', '2023', '96,4'],
    ['Bdr', 'T2 2024', 41],
    ['Corse', '2023', '88,7'],
    ['Lune', '2023', 'n.d.'],
    [null, null, null],
  ],
}

describe('applyPlan, valeurs en lignes', () => {
  it('produit une ligne par ligne du fichier, dans l’ordre, sans les lignes vides', () => {
    const { lignes } = applyPlan({ plan: planLignes, tableau: tableauLignes })
    expect(lignes.map((ligne) => ligne.source.ligne)).toEqual([0, 1, 2, 3])
  })

  it('lit la date et la valeur, et garde l’origine du rapprochement', () => {
    const { lignes } = applyPlan({ plan: planLignes, tableau: tableauLignes })
    expect(lignes[1]).toEqual({
      source: { ligne: 1, colonneValeur: 'Taux' },
      individu: { statut: 'VALIDE', brut: 'Bdr', valeur: 'DEPT-13', par: 'LLM' },
      modalites: [],
      date: { statut: 'VALIDE', brut: 'T2 2024', valeur: '2024-04-01', par: 'LECTURE' },
      valeur: { statut: 'VALIDE', brut: '41', valeur: 41, par: 'LECTURE' },
    })
  })

  it('signale un libellé ambigu avec ses candidats', () => {
    const { lignes } = applyPlan({ plan: planLignes, tableau: tableauLignes })
    expect(lignes[2]?.individu).toEqual({
      statut: 'A_CORRIGER',
      brut: 'Corse',
      motif: { type: 'LIBELLE_AMBIGU', candidats: ['DEPT-2A', 'DEPT-2B'] },
    })
  })

  it('signale un libellé absent du plan et une valeur non numérique', () => {
    const { lignes } = applyPlan({ plan: planLignes, tableau: tableauLignes })
    expect(lignes[3]?.individu).toMatchObject({ motif: { type: 'LIBELLE_INCONNU' } })
    expect(lignes[3]?.valeur).toMatchObject({ motif: { type: 'VALEUR_NON_NUMERIQUE' } })
  })

  it('applique une correction de valeur saisie par l’utilisateur', () => {
    const corrections = { [correctionKey({ ligne: 3, colonneValeur: 'Taux' })]: { valeur: 12 } }
    const { lignes } = applyPlan({ plan: planLignes, tableau: tableauLignes, corrections })
    expect(lignes[3]?.valeur).toEqual({
      statut: 'VALIDE',
      brut: 'n.d.',
      valeur: 12,
      par: 'UTILISATEUR',
    })
  })

  it('corrige toutes les lignes d’un libellé quand son rapprochement change', () => {
    const plan = setRapprochement({
      plan: planLignes,
      cible: { type: 'INDIVIDU' },
      libelle: 'Corse',
      publicId: 'DEPT-2A',
    })
    const { lignes } = applyPlan({ plan, tableau: tableauLignes })
    expect(lignes[2]?.individu).toEqual({
      statut: 'VALIDE',
      brut: 'Corse',
      valeur: 'DEPT-2A',
      par: 'UTILISATEUR',
    })
    expect(toItemsImport(lignes)).toHaveLength(3)
  })
})

describe('applyPlan, dates en colonnes', () => {
  const plan: PlanTransformation = {
    individu: { colonne: 'Dept', rapprochements: { Ain: resolu('DEPT-01') } },
    axes: [
      {
        axe: 'AXE-OPERATEUR',
        colonne: 'Opérateur',
        rapprochements: { Orange: resolu('OP-ORANGE'), MVNO: { statut: 'INCONNU' } },
      },
    ],
    valeurs: {
      disposition: 'COLONNES',
      colonnes: [
        { colonne: '2022', date: '2022-01-01' },
        { colonne: '2023', date: '2023-01-01' },
      ],
    },
  }
  const tableau: TableauSource = {
    entetes: ['Dept', 'Opérateur', '2022', '2023'],
    lignes: [
      ['Ain', 'Orange', 96.4, null],
      ['Ain', 'MVNO', 60.1, 62.5],
    ],
  }

  it('produit une ligne par cellule de date non vide', () => {
    const { lignes } = applyPlan({ plan, tableau })
    expect(lignes.map((ligne) => ligne.source)).toEqual([
      { ligne: 0, colonneValeur: '2022' },
      { ligne: 1, colonneValeur: '2022' },
      { ligne: 1, colonneValeur: '2023' },
    ])
    expect(lignes[0]?.date).toEqual({
      statut: 'VALIDE',
      brut: '2022',
      valeur: '2022-01-01',
      par: 'LECTURE',
    })
  })

  it('n’importe que les lignes dont toutes les cellules sont valides', () => {
    const { lignes } = applyPlan({ plan, tableau })
    expect(lignes.map(isImportable)).toEqual([true, false, false])
    expect(toItemsImport(lignes)).toEqual([
      { individu: 'DEPT-01', modalites: ['OP-ORANGE'], date: '2022-01-01', valeur: 96.4 },
    ])
  })
})

describe('applyPlan, filtre et doublons', () => {
  it('écarte les lignes hors du filtre et les compte', () => {
    const plan: PlanTransformation = {
      ...planLignes,
      filtre: { colonne: 'Type', valeursRetenues: ['VA'] },
    }
    const tableau: TableauSource = {
      entetes: ['Département', 'Période', 'Taux', 'Type'],
      lignes: [
        ['Ain', '2023', 10, 'VA'],
        ['Ain', '2023', 5, 'VI'],
        ['Ain', '2023', 20, 'VC'],
      ],
    }
    const { lignes, lignesEcartees } = applyPlan({ plan, tableau })
    expect(lignes).toHaveLength(1)
    expect(lignesEcartees).toBe(2)
  })

  it('marque la seconde ligne de même individu et même date comme doublon', () => {
    const tableau: TableauSource = {
      entetes: ['Département', 'Période', 'Taux'],
      lignes: [
        ['Ain', '2023', 10],
        ['Ain', '01/01/2023', 11],
      ],
    }
    const { lignes } = applyPlan({ plan: planLignes, tableau })
    expect(lignes[1]?.doublonDe).toBe(0)
    expect(toItemsImport(lignes)).toHaveLength(1)
  })
})

describe('buildPlanStandard', () => {
  const cibles = {
    individus: [
      { id: 'DEPT-01', nom: 'Ain', referentiel: 'REF-DEPT' },
      { id: 'DEPT-02', nom: 'Aisne', referentiel: 'REF-DEPT' },
    ],
    axes: [
      { id: 'AXE-OPERATEUR', nom: 'Opérateur', modalites: [{ id: 'OP-ORANGE', nom: 'Orange' }] },
    ],
  }

  it('reconnaît les colonnes standard sans tenir compte de la casse', () => {
    const tableau: TableauSource = {
      entetes: ['Individu', 'axe-operateur', 'DATE', 'valeur'],
      lignes: [
        ['DEPT-01', 'OP-ORANGE', '2023-01-01', 1],
        ['aisne', 'Inconnu', '2023-01-01', 2],
      ],
    }
    const result = buildPlanStandard({ tableau, cibles })
    expect(result).toEqual({
      ok: true,
      plan: {
        individu: {
          colonne: 'Individu',
          rapprochements: { 'DEPT-01': resolu('DEPT-01'), aisne: resolu('DEPT-02') },
        },
        axes: [
          {
            axe: 'AXE-OPERATEUR',
            colonne: 'axe-operateur',
            rapprochements: { 'OP-ORANGE': resolu('OP-ORANGE'), Inconnu: { statut: 'INCONNU' } },
          },
        ],
        valeurs: { disposition: 'LIGNES', colonneDate: 'DATE', colonneValeur: 'valeur' },
      },
    })
  })

  it('liste les colonnes manquantes d’un fichier hors format', () => {
    const tableau: TableauSource = { entetes: ['Département', '2023'], lignes: [['Ain', 1]] }
    expect(buildPlanStandard({ tableau, cibles })).toEqual({
      ok: false,
      colonnesManquantes: ['individu', 'AXE-OPERATEUR', 'date', 'valeur'],
    })
  })
})
