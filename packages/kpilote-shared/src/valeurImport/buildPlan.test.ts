import { describe, expect, it } from 'vitest'

import { type CiblesSaisie, type PlanTransformation, type TableauSource } from '../valeurImport'
import { buildPlanStandard, listLibelles, setRapprochement } from './buildPlan'

const individus: CiblesSaisie['individus'] = [
  { id: 'DEPT-13', nom: 'Bouches-du-Rhône', referentiel: 'REF-DEPT' },
  { id: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' },
]

const ciblesSansAxe: CiblesSaisie = { individus, axes: [] }

const ciblesAvecAxe: CiblesSaisie = {
  individus,
  axes: [
    {
      id: 'AXE-SEXE',
      nom: 'Sexe',
      modalites: [
        { id: 'MOD-FEMME', nom: 'Femme' },
        { id: 'MOD-HOMME', nom: 'Homme' },
      ],
    },
  ],
}

describe('listLibelles', () => {
  it('liste les libellés distincts dans l’ordre du fichier, sans les cellules vides', () => {
    const tableau: TableauSource = {
      entetes: ['individu', 'valeur'],
      lignes: [
        ['Vaucluse', 1],
        [null, 2],
        ['DEPT-13', 3],
        ['  ', 4],
        ['Vaucluse', 5],
      ],
    }
    expect(listLibelles({ tableau, colonne: 'individu' })).toEqual(['Vaucluse', 'DEPT-13'])
  })
})

describe('buildPlanStandard', () => {
  it('décrit un fichier individu, date, valeur sans axe par des valeurs en lignes', () => {
    const tableau: TableauSource = {
      entetes: ['individu', 'date', 'valeur'],
      lignes: [['DEPT-13', '2024-01-01', 12]],
    }
    expect(buildPlanStandard({ tableau, cibles: ciblesSansAxe })).toEqual({
      ok: true,
      plan: {
        individu: {
          colonne: 'individu',
          rapprochements: { 'DEPT-13': { statut: 'RESOLU', publicId: 'DEPT-13', par: 'EXACT' } },
        },
        axes: [],
        valeurs: { disposition: 'LIGNES', colonneDate: 'date', colonneValeur: 'valeur' },
      },
    })
  })

  it('reconnaît des en-têtes en casse différente et les garde tels qu’écrits', () => {
    const tableau: TableauSource = {
      entetes: ['Individu', 'DATE', 'Valeur'],
      lignes: [['Vaucluse', '2024-01-01', 12]],
    }
    const resultat = buildPlanStandard({ tableau, cibles: ciblesSansAxe })
    expect(resultat).toMatchObject({
      ok: true,
      plan: {
        individu: { colonne: 'Individu' },
        valeurs: { disposition: 'LIGNES', colonneDate: 'DATE', colonneValeur: 'Valeur' },
      },
    })
  })

  it('signale la colonne d’un axe absente du fichier', () => {
    const tableau: TableauSource = {
      entetes: ['individu', 'date', 'valeur'],
      lignes: [['DEPT-13', '2024-01-01', 12]],
    }
    expect(buildPlanStandard({ tableau, cibles: ciblesAvecAxe })).toEqual({
      ok: false,
      colonnesManquantes: ['AXE-SEXE'],
    })
  })

  it('rapproche un libellé exact et laisse inconnu un libellé sans correspondance', () => {
    const tableau: TableauSource = {
      entetes: ['individu', 'AXE-SEXE', 'date', 'valeur'],
      lignes: [
        ['Vaucluse', 'Femme', '2024-01-01', 12],
        ['Atlantide', 'Autre', '2024-01-01', 8],
      ],
    }
    const resultat = buildPlanStandard({ tableau, cibles: ciblesAvecAxe })
    expect(resultat).toMatchObject({
      ok: true,
      plan: {
        individu: {
          rapprochements: {
            Vaucluse: { statut: 'RESOLU', publicId: 'DEPT-84', par: 'EXACT' },
            Atlantide: { statut: 'INCONNU' },
          },
        },
        axes: [
          {
            axe: 'AXE-SEXE',
            rapprochements: {
              Femme: { statut: 'RESOLU', publicId: 'MOD-FEMME', par: 'EXACT' },
              Autre: { statut: 'INCONNU' },
            },
          },
        ],
      },
    })
  })
})

describe('setRapprochement', () => {
  const plan: PlanTransformation = {
    individu: {
      colonne: 'Département',
      rapprochements: { Bdr: { statut: 'INCONNU' }, Vaucluse: { statut: 'INCONNU' } },
    },
    axes: [
      { axe: 'AXE-SEXE', colonne: 'Sexe', rapprochements: { F: { statut: 'INCONNU' } } },
      { axe: 'AXE-AGE', colonne: 'Âge', rapprochements: { F: { statut: 'INCONNU' } } },
    ],
    valeurs: { disposition: 'LIGNES', colonneDate: 'Date', colonneValeur: 'Valeur' },
  }

  it('résout le libellé corrigé d’un individu, et lui seul', () => {
    const corrige = setRapprochement({
      plan,
      cible: { type: 'INDIVIDU' },
      libelle: 'Bdr',
      publicId: 'DEPT-13',
    })
    expect(corrige.individu.rapprochements).toEqual({
      Bdr: { statut: 'RESOLU', publicId: 'DEPT-13', par: 'UTILISATEUR' },
      Vaucluse: { statut: 'INCONNU' },
    })
    expect(corrige.axes).toEqual(plan.axes)
  })

  it('ne touche que la colonne de l’axe corrigé', () => {
    const corrige = setRapprochement({
      plan,
      cible: { type: 'AXE', axe: 'AXE-SEXE' },
      libelle: 'F',
      publicId: 'MOD-FEMME',
    })
    expect(corrige.axes).toEqual([
      {
        axe: 'AXE-SEXE',
        colonne: 'Sexe',
        rapprochements: { F: { statut: 'RESOLU', publicId: 'MOD-FEMME', par: 'UTILISATEUR' } },
      },
      { axe: 'AXE-AGE', colonne: 'Âge', rapprochements: { F: { statut: 'INCONNU' } } },
    ])
    expect(corrige.individu).toEqual(plan.individu)
  })
})
