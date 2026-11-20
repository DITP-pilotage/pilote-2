import {
  type CiblesSaisieApiModel,
  type PlanTransformation,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'
import { applyPlan } from '@pilote/kpilote-shared/valeurImport/applyPlan'
import { describe, expect, it } from 'vitest'

import {
  buildLignesGrille,
  buildNomById,
  describeEdition,
  describeProvenance,
  filterLignes,
  listColonnesGrille,
  summarizeLignes,
} from '@/components/import-valeurs/grille'
import { movePosition } from '@/lib/grilleValeurs'

const cibles: CiblesSaisieApiModel = {
  individus: [
    { id: 'DEPT-01', nom: 'Ain', referentiel: 'REF-DEPT' },
    { id: 'DEPT-13', nom: 'Bouches-du-Rhône', referentiel: 'REF-DEPT' },
    { id: 'DEPT-2A', nom: 'Corse-du-Sud', referentiel: 'REF-DEPT' },
    { id: 'DEPT-2B', nom: 'Haute-Corse', referentiel: 'REF-DEPT' },
  ],
  axes: [
    {
      id: 'AXE-OPERATEUR',
      nom: 'Opérateur',
      modalites: [
        { id: 'OP-ORANGE', nom: 'Orange' },
        { id: 'OP-SFR', nom: 'SFR' },
      ],
    },
  ],
}

const plan: PlanTransformation = {
  individu: {
    colonne: 'Département',
    rapprochements: {
      Ain: { statut: 'RESOLU', publicId: 'DEPT-01', par: 'EXACT' },
      Bdr: { statut: 'RESOLU', publicId: 'DEPT-13', par: 'ALBERT' },
      Corse: { statut: 'AMBIGU', candidats: ['DEPT-2B', 'DEPT-2A'] },
    },
  },
  axes: [
    {
      axe: 'AXE-OPERATEUR',
      colonne: 'Opérateur',
      rapprochements: {
        Orange: { statut: 'RESOLU', publicId: 'OP-ORANGE', par: 'EXACT' },
        MVNO: { statut: 'INCONNU' },
      },
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
  entetes: ['Département', 'Opérateur', '2022', '2023'],
  lignes: [
    ['Ain', 'Orange', 96.4, 'n.d.'],
    ['Bdr', 'MVNO', 1234.5, null],
    ['Corse', 'Orange', 88.7, null],
  ],
}

const { lignes } = applyPlan({ plan, tableau })
const nomById = buildNomById(cibles)
const colonnes = listColonnesGrille({ plan, cibles })
const grille = buildLignesGrille({ lignes, nomById })

describe('listColonnesGrille', () => {
  it('place une colonne par axe, nommée par son nom, entre l’individu et la date', () => {
    expect(colonnes.map((colonne) => colonne.label)).toEqual([
      'Individu',
      'Opérateur',
      'Date',
      'Valeur',
    ])
  })
})

describe('buildLignesGrille', () => {
  it('affiche le nom et l’identifiant d’une entité reconnue, la date et la valeur formatées', () => {
    expect(grille[0]?.cellules).toEqual([
      {
        text: 'Ain',
        identifiant: 'DEPT-01',
        isAlbert: false,
        isWarning: false,
        alignRight: false,
        isCalculee: false,
      },
      {
        text: 'Orange',
        identifiant: 'OP-ORANGE',
        isAlbert: false,
        isWarning: false,
        alignRight: false,
        isCalculee: false,
      },
      {
        text: '01/01/2022',
        identifiant: null,
        isAlbert: false,
        isWarning: false,
        alignRight: false,
        isCalculee: false,
      },
      {
        text: '96,4',
        identifiant: null,
        isAlbert: false,
        isWarning: false,
        alignRight: true,
        isCalculee: false,
      },
    ])
  })

  it('marque ce qu’Albert a rapproché et ce qui reste à corriger', () => {
    expect(grille[2]?.cellules[0]).toMatchObject({ text: 'Bouches-du-Rhône', isAlbert: true })
    expect(grille[2]?.cellules[1]).toMatchObject({ text: 'MVNO', isWarning: true })
    expect(grille[1]?.cellules[3]).toMatchObject({ text: 'n.d.', isWarning: true })
    expect(grille[3]?.cellules[0]).toMatchObject({ text: 'Corse', isWarning: true })
  })

  it('compte les valeurs prêtes et filtre les lignes à corriger', () => {
    expect(summarizeLignes(grille)).toEqual({ pretes: 1, aCorriger: 3 })
    expect(
      filterLignes({ lignes: grille, filtre: 'A_CORRIGER' }).map((ligne) => ligne.numero),
    ).toEqual([2, 3, 4])
    expect(filterLignes({ lignes: grille, filtre: 'TOUTES' })).toHaveLength(4)
  })

  it('signale un doublon sur sa date', () => {
    const doublons = applyPlan({
      plan,
      tableau: {
        entetes: tableau.entetes,
        lignes: [
          ['Ain', 'Orange', 1, null],
          ['Ain', 'Orange', 2, null],
        ],
      },
    }).lignes
    const [premiere, seconde] = buildLignesGrille({ lignes: doublons, nomById })
    expect(premiere?.isImportable).toBe(true)
    expect(seconde?.isImportable).toBe(false)
    expect(seconde?.cellules[2]?.isWarning).toBe(true)
  })
})

describe('describeProvenance', () => {
  const provenance = (ligne: number, colonne: number) =>
    describeProvenance({
      ligne: lignes[ligne]!,
      numero: ligne + 1,
      colonne: colonnes[colonne]!,
      plan,
      nomById,
    })

  it('dit d’où vient un individu et comment il a été rapproché', () => {
    expect(provenance(0, 0)).toEqual({
      reference: 'Individu · ligne 1',
      texte:
        'Fichier, ligne 2, colonne « Département » : « Ain ». Correspondance exacte avec Ain (DEPT-01).',
    })
    expect(provenance(2, 0).texte).toBe(
      'Fichier, ligne 3, colonne « Département » : « Bdr ». Rapproché par l’assistant IA de Bouches-du-Rhône (DEPT-13).',
    )
  })

  it('liste les candidats d’un libellé ambigu et nomme l’axe d’une modalité inconnue', () => {
    expect(provenance(3, 0).texte).toBe(
      'Fichier, ligne 4, colonne « Département » : « Corse ». Plusieurs correspondances possibles : Haute-Corse (DEPT-2B), Corse-du-Sud (DEPT-2A).',
    )
    expect(provenance(2, 1).texte).toBe(
      'Fichier, ligne 3, colonne « Opérateur » : « MVNO ». Aucune modalité de l’axe « Opérateur » ne correspond.',
    )
  })

  it('décrit une date lue d’un en-tête et une valeur non numérique', () => {
    expect(provenance(0, 2).texte).toBe(
      'Fichier, en-tête de colonne « 2022 ». Lu comme le 01/01/2022.',
    )
    expect(provenance(1, 3).texte).toBe(
      'Fichier, ligne 2, colonne « 2023 » : « n.d. ». Ce n’est pas un nombre.',
    )
  })
})

describe('describeEdition', () => {
  const edition = (ligne: number, colonne: number) =>
    describeEdition({ ligne: lignes[ligne]!, colonne: colonnes[colonne]!, cibles })

  it('propose les candidats d’un libellé ambigu en tête', () => {
    const corse = edition(3, 0)
    expect(corse).toMatchObject({
      type: 'RAPPROCHEMENT',
      cible: { type: 'INDIVIDU' },
      libelle: 'Corse',
      selected: null,
      action: 'Choisir un individu',
    })
    expect(
      corse?.type === 'RAPPROCHEMENT' ? corse.candidats.map((candidat) => candidat.id) : [],
    ).toEqual(['DEPT-2A', 'DEPT-2B', 'DEPT-01', 'DEPT-13'])
  })

  it('propose les modalités de l’axe de la colonne, et de changer un choix valide', () => {
    expect(edition(2, 1)).toMatchObject({
      cible: { type: 'AXE', axe: 'AXE-OPERATEUR' },
      action: 'Choisir une modalité',
      candidats: cibles.axes[0]?.modalites,
    })
    expect(edition(0, 0)).toMatchObject({ selected: 'DEPT-01', action: 'Changer' })
  })

  it('propose de saisir une valeur ou de modifier une date', () => {
    expect(edition(1, 3)).toEqual({ type: 'VALEUR', value: null, action: 'Saisir une valeur' })
    expect(edition(0, 2)).toEqual({ type: 'DATE', value: '2022-01-01', action: 'Modifier' })
  })
})

describe('movePosition', () => {
  it('se déplace dans les lignes affichées, sans sortir de la grille', () => {
    const visibles = filterLignes({ lignes: grille, filtre: 'A_CORRIGER' })
    const move = (ligne: number, colonne: number, delta: { ligne: number; colonne: number }) =>
      movePosition({ position: { ligne, colonne }, delta, lignes: visibles, nombreColonnes: 4 })
    expect(move(1, 0, { ligne: 1, colonne: 0 })).toEqual({ ligne: 2, colonne: 0 })
    expect(move(3, 3, { ligne: 1, colonne: 1 })).toEqual({ ligne: 3, colonne: 3 })
    expect(move(1, 0, { ligne: -1, colonne: -1 })).toEqual({ ligne: 1, colonne: 0 })
  })
})
