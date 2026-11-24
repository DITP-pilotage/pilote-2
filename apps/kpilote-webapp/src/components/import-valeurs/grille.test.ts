import {
  type CiblesSaisie,
  type PlanTransformation,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'
import { applyPlan } from '@pilote/kpilote-shared/valeurImport/applyPlan'
import { describe, expect, it } from 'vitest'

import {
  buildLignesGrille,
  buildNomById,
  describeProvenance,
  filterLignes,
  listColonnesGrille,
  summarizeLignes,
} from '@/components/import-valeurs/grille'

const cibles: CiblesSaisie = {
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
      { text: 'Ain', identifiant: 'DEPT-01', tone: 'DEFAULT', marker: null, alignRight: false },
      {
        text: 'Orange',
        identifiant: 'OP-ORANGE',
        tone: 'DEFAULT',
        marker: null,
        alignRight: false,
      },
      { text: '01/01/2022', identifiant: null, tone: 'DEFAULT', marker: null, alignRight: false },
      { text: '96,4', identifiant: null, tone: 'DEFAULT', marker: null, alignRight: true },
    ])
  })

  it('marque ce qu’Albert a rapproché et ce qui reste à corriger', () => {
    expect(grille[2]?.cellules[0]).toMatchObject({ text: 'Bouches-du-Rhône', tone: 'DEFAULT' })
    expect(grille[2]?.cellules[0]?.marker?.label).toBe('Rapproché par l’assistant IA')
    expect(grille[2]?.cellules[1]).toMatchObject({ text: 'MVNO', tone: 'WARNING' })
    expect(grille[2]?.cellules[1]?.marker?.label).toBe('À corriger')
    expect(grille[1]?.cellules[3]).toMatchObject({ text: 'n.d.', tone: 'WARNING' })
    expect(grille[1]?.cellules[3]?.marker?.label).toBe('À corriger')
    expect(grille[3]?.cellules[0]).toMatchObject({ text: 'Corse', tone: 'WARNING' })
    expect(grille[3]?.cellules[0]?.marker?.label).toBe('À corriger')
  })

  it('compte les valeurs prêtes et filtre les lignes à corriger', () => {
    expect(summarizeLignes(lignes)).toEqual({ pretes: 1, aCorriger: 3 })
    expect(
      filterLignes({ lignesGrille: grille, lignes, filtre: 'A_CORRIGER' }).map(
        (ligne) => ligne.numero,
      ),
    ).toEqual([2, 3, 4])
    expect(filterLignes({ lignesGrille: grille, lignes, filtre: 'TOUTES' })).toHaveLength(4)
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
    expect(premiere?.cellules[2]).toMatchObject({ tone: 'DEFAULT', marker: null })
    expect(seconde?.cellules[2]?.tone).toBe('WARNING')
    expect(seconde?.cellules[2]?.marker?.label).toBe('À corriger')
  })

  it('filterLignes en A_CORRIGER ne garde que les lignes non importables, doublons compris', () => {
    const doublons = applyPlan({
      plan,
      tableau: {
        entetes: tableau.entetes,
        lignes: [
          ['Ain', 'Orange', 1, 2],
          ['Ain', 'Orange', 3, null],
        ],
      },
    }).lignes
    const lignesGrille = buildLignesGrille({ lignes: doublons, nomById })
    expect(summarizeLignes(doublons)).toEqual({ pretes: 2, aCorriger: 1 })
    expect(
      filterLignes({ lignesGrille, lignes: doublons, filtre: 'A_CORRIGER' }).map(
        (ligne) => ligne.numero,
      ),
    ).toEqual([3])
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
