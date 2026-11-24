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
      Bdr: { statut: 'RESOLU', publicId: 'DEPT-13', par: 'ALBERT' },
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
      individu: { statut: 'VALIDE', brut: 'Bdr', valeur: 'DEPT-13', par: 'ALBERT' },
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
        lecture: 'CELLULE',
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

describe('applyPlan, une modalité par colonne de valeurs', () => {
  const plan: PlanTransformation = {
    individu: { colonne: 'Dept', rapprochements: { Ain: resolu('DEPT-01') } },
    axes: [
      {
        lecture: 'CELLULE',
        axe: 'AXE-OPERATEUR',
        colonne: 'Opérateur',
        rapprochements: { Orange: resolu('OP-ORANGE'), SFR: resolu('OP-SFR') },
      },
      {
        lecture: 'ENTETE',
        axe: 'AXE-FRAUDE',
        rapprochements: {
          TVA: resolu('FR-TVA'),
          IR: { statut: 'RESOLU', publicId: 'FR-IR', par: 'ALBERT' },
          Autre: { statut: 'INCONNU' },
        },
      },
    ],
    valeurs: {
      disposition: 'COLONNES_MODALITES',
      colonneDate: 'Trimestre',
      colonnes: ['TVA', 'IR', 'Autre'],
    },
  }
  const tableau: TableauSource = {
    entetes: ['Dept', 'Opérateur', 'Trimestre', 'TVA', 'IR', 'Autre', 'Type'],
    lignes: [
      ['Ain', 'Orange', 'T2 2026', '2,25', '1,00', '0,5', 'VA'],
      ['Ain', 'SFR', 'T2 2026', '1,38', '0,57', '0,4', 'VA'],
    ],
  }

  it('produit une ligne par cellule de valeur, modalité lue dans l’en-tête, date en ligne', () => {
    const { lignes } = applyPlan({ plan, tableau })
    expect(lignes.map((ligne) => ligne.source)).toEqual([
      { ligne: 0, colonneValeur: 'TVA' },
      { ligne: 0, colonneValeur: 'IR' },
      { ligne: 0, colonneValeur: 'Autre' },
      { ligne: 1, colonneValeur: 'TVA' },
      { ligne: 1, colonneValeur: 'IR' },
      { ligne: 1, colonneValeur: 'Autre' },
    ])
    expect(lignes[1]).toEqual({
      source: { ligne: 0, colonneValeur: 'IR' },
      individu: { statut: 'VALIDE', brut: 'Ain', valeur: 'DEPT-01', par: 'EXACT' },
      modalites: [
        { statut: 'VALIDE', brut: 'Orange', valeur: 'OP-ORANGE', par: 'EXACT' },
        { statut: 'VALIDE', brut: 'IR', valeur: 'FR-IR', par: 'ALBERT' },
      ],
      date: { statut: 'VALIDE', brut: 'T2 2026', valeur: '2026-04-01', par: 'LECTURE' },
      valeur: { statut: 'VALIDE', brut: '1,00', valeur: 1, par: 'LECTURE' },
    })
  })

  it('ne produit pas de ligne pour une cellule de valeur vide', () => {
    const avecTrou: TableauSource = {
      ...tableau,
      lignes: [['Ain', 'Orange', 'T2 2026', '2,25', '', null, 'VA']],
    }
    const { lignes } = applyPlan({ plan, tableau: avecTrou })
    expect(lignes.map((ligne) => ligne.source.colonneValeur)).toEqual(['TVA'])
  })

  it('signale un en-tête sans modalité sur toutes les lignes de sa colonne', () => {
    const { lignes } = applyPlan({ plan, tableau })
    const colonneAutre = lignes.filter((ligne) => ligne.source.colonneValeur === 'Autre')
    expect(colonneAutre.map((ligne) => ligne.modalites[1])).toEqual([
      { statut: 'A_CORRIGER', brut: 'Autre', motif: { type: 'LIBELLE_INCONNU' } },
      { statut: 'A_CORRIGER', brut: 'Autre', motif: { type: 'LIBELLE_INCONNU' } },
    ])
    expect(lignes.filter(isImportable)).toHaveLength(4)
  })

  it('corrige toute la colonne quand le rapprochement de son en-tête change', () => {
    const corrige = setRapprochement({
      plan,
      cible: { type: 'AXE', axe: 'AXE-FRAUDE' },
      libelle: 'Autre',
      publicId: 'FR-IS',
    })
    const { lignes } = applyPlan({ plan: corrige, tableau })
    expect(lignes.filter(isImportable)).toHaveLength(6)
  })

  it('applique le filtre de lignes', () => {
    const filtre = { colonne: 'Type', valeursRetenues: ['VA'] }
    const tableauFiltre: TableauSource = {
      ...tableau,
      lignes: [...tableau.lignes, ['Ain', 'Orange', 'T3 2026', '1', '2', '3', 'VC']],
    }
    const { lignes, lignesEcartees } = applyPlan({
      plan: { ...plan, filtre },
      tableau: tableauFiltre,
    })
    expect(lignes).toHaveLength(6)
    expect(lignesEcartees).toBe(1)
  })

  it('laisse à corriger une modalité lue en en-tête quand les valeurs sont en lignes', () => {
    const planLignesEntete: PlanTransformation = {
      ...plan,
      valeurs: { disposition: 'LIGNES', colonneDate: 'Trimestre', colonneValeur: 'TVA' },
    }
    const { lignes } = applyPlan({ plan: planLignesEntete, tableau })
    expect(lignes[0]?.modalites[1]).toEqual({
      statut: 'A_CORRIGER',
      brut: '',
      motif: { type: 'CELLULE_VIDE' },
    })
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
            lecture: 'CELLULE',
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
