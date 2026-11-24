import { type TableauSource } from '@pilote/kpilote-shared/valeurImport'
import { describe, expect, it } from 'vitest'

import { buildProfilColonnes } from '@/valeurImport/profilColonnes'
import {
  checkAxesCouverts,
  checkRapprochements,
  checkStructure,
  type StructureProposee,
} from '@/valeurImport/rules'

const tableau: TableauSource = {
  entetes: ['Dpt', 'Opérateur', 'Type', 'Période', 'Taux', '2022', '2023', 'T1 relevé'],
  lignes: [
    ['Ain', 'Orange', 'va', '2023', '96,4', 1, 2, 3],
    ['Paris', 'SFR', 'vi', '2023', '93,2', 4, 5, 6],
  ],
}
const axes = ['AXE-OPERATEUR']

const lignes = (override: Partial<StructureProposee> = {}): StructureProposee => ({
  colonneIndividu: 'Dpt',
  colonnesAxes: [{ axe: 'AXE-OPERATEUR', colonne: 'Opérateur' }],
  disposition: 'LIGNES',
  colonneDate: 'Période',
  colonneValeur: 'Taux',
  ...override,
})

const erreursOf = (proposition: StructureProposee) =>
  checkStructure({ proposition, tableau, axes })._unsafeUnwrapErr().erreurs

describe.concurrent('checkStructure', () => {
  it('accepte une structure en lignes et ignore un filtre vide ou nul', () => {
    const result = checkStructure({
      proposition: lignes({ colonneFiltre: null, valeursFiltre: null, colonnesDates: null }),
      tableau,
      axes,
    })
    expect(result._unsafeUnwrap()).toEqual({
      colonneIndividu: 'Dpt',
      colonnesAxes: [{ axe: 'AXE-OPERATEUR', colonne: 'Opérateur' }],
      valeurs: { disposition: 'LIGNES', colonneDate: 'Période', colonneValeur: 'Taux' },
    })
  })

  it('lit elle-même la date d’un en-tête de colonne, sans celle d’Albert', () => {
    const result = checkStructure({
      proposition: lignes({
        disposition: 'COLONNES',
        colonneDate: null,
        colonneValeur: null,
        colonnesDates: [{ colonne: '2022' }, { colonne: '2023', date: '1999-01-01' }],
      }),
      tableau,
      axes,
    })
    expect(result._unsafeUnwrap().valeurs).toEqual({
      disposition: 'COLONNES',
      colonnes: [
        { colonne: '2022', date: '2022-01-01' },
        { colonne: '2023', date: '2023-01-01' },
      ],
    })
  })

  it('garde la date d’Albert pour un en-tête que le code ne sait pas lire', () => {
    const proposition = lignes({
      disposition: 'COLONNES',
      colonnesDates: [{ colonne: 'T1 relevé', date: '2024-01-01' }],
    })
    expect(checkStructure({ proposition, tableau, axes })._unsafeUnwrap().valeurs).toEqual({
      disposition: 'COLONNES',
      colonnes: [{ colonne: 'T1 relevé', date: '2024-01-01' }],
    })
  })

  it('rejette un en-tête illisible sans date', () => {
    const proposition = lignes({
      disposition: 'COLONNES',
      colonnesDates: [{ colonne: 'T1 relevé' }],
    })
    expect(erreursOf(proposition)).toEqual([{ type: 'DATE_INVALIDE', colonne: 'T1 relevé' }])
  })

  it('accepte un filtre dont les valeurs existent dans la colonne', () => {
    const proposition = lignes({ colonneFiltre: 'Type', valeursFiltre: ['va'] })
    expect(checkStructure({ proposition, tableau, axes })._unsafeUnwrap().filtre).toEqual({
      colonne: 'Type',
      valeursRetenues: ['va'],
    })
  })

  it('rejette une colonne absente du fichier', () => {
    expect(erreursOf(lignes({ colonneValeur: 'Valeur' }))).toEqual([
      { type: 'COLONNE_INCONNUE', colonne: 'Valeur' },
    ])
  })

  it('rejette une colonne qui a deux rôles', () => {
    expect(erreursOf(lignes({ colonneValeur: 'Période' }))).toEqual([
      { type: 'COLONNE_A_DEUX_ROLES', colonne: 'Période' },
    ])
  })

  it('rejette un axe inconnu et un axe cité deux fois', () => {
    const proposition = lignes({
      colonnesAxes: [
        { axe: 'AXE-OPERATEUR', colonne: 'Opérateur' },
        { axe: 'AXE-OPERATEUR', colonne: 'Type' },
        { axe: 'AXE-INVENTE', colonne: '2022' },
      ],
    })
    expect(erreursOf(proposition)).toEqual([
      { type: 'AXE_INCONNU', axe: 'AXE-INVENTE' },
      { type: 'AXE_EN_DOUBLE', axe: 'AXE-OPERATEUR' },
    ])
  })

  it('rejette une disposition incomplète', () => {
    expect(erreursOf(lignes({ colonneDate: '', colonneValeur: null }))).toEqual([
      { type: 'CHAMP_MANQUANT', champ: 'colonneDate' },
      { type: 'CHAMP_MANQUANT', champ: 'colonneValeur' },
    ])
    expect(erreursOf(lignes({ disposition: 'COLONNES', colonnesDates: [] }))).toEqual([
      { type: 'CHAMP_MANQUANT', champ: 'colonnesDates' },
    ])
  })

  it('rejette un filtre sans valeur ou dont une valeur n’existe pas', () => {
    expect(erreursOf(lignes({ colonneFiltre: 'Type', valeursFiltre: [] }))).toEqual([
      { type: 'FILTRE_SANS_VALEUR', colonne: 'Type' },
    ])
    expect(erreursOf(lignes({ colonneFiltre: 'Type', valeursFiltre: ['VA'] }))).toEqual([
      { type: 'VALEUR_DE_FILTRE_INCONNUE', valeur: 'VA' },
    ])
  })
})

describe.concurrent('checkAxesCouverts', () => {
  it('accepte quand chaque axe de l’indicateur a une colonne', () => {
    expect(checkAxesCouverts({ colonnesAxes: [{ axe: 'AXE-A' }], axes: ['AXE-A'] }).isOk()).toBe(
      true,
    )
  })

  it('liste tous les axes sans colonne', () => {
    const result = checkAxesCouverts({ colonnesAxes: [], axes: ['AXE-A', 'AXE-B'] })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'AXE_SANS_COLONNE',
      axes: ['AXE-A', 'AXE-B'],
    })
  })
})

describe.concurrent('checkRapprochements', () => {
  const libelles = ['Bdr', 'Corse', 'Total']
  const publicIdsConnus = new Set(['DEPT-13', 'DEPT-2A', 'DEPT-2B'])

  it('accepte un rapprochement par libellé et marque les résolus comme venant d’Albert', () => {
    const result = checkRapprochements({
      proposition: [
        { libelle: 'Bdr', statut: 'RESOLU', publicId: 'DEPT-13', candidats: null },
        { libelle: 'Corse', statut: 'AMBIGU', candidats: ['DEPT-2A', 'DEPT-2B'] },
        { libelle: 'Total', statut: 'INCONNU', publicId: null },
      ],
      libelles,
      publicIdsConnus,
    })
    expect(result._unsafeUnwrap()).toEqual({
      Bdr: { statut: 'RESOLU', publicId: 'DEPT-13', par: 'ALBERT' },
      Corse: { statut: 'AMBIGU', candidats: ['DEPT-2A', 'DEPT-2B'] },
      Total: { statut: 'INCONNU' },
    })
  })

  it('rejette un libellé oublié, un libellé en double et un libellé inventé', () => {
    const result = checkRapprochements({
      proposition: [
        { libelle: 'Bdr', statut: 'INCONNU' },
        { libelle: 'Bdr', statut: 'INCONNU' },
        { libelle: 'Corse', statut: 'INCONNU' },
        { libelle: 'Lune', statut: 'INCONNU' },
      ],
      libelles,
      publicIdsConnus,
    })
    expect(result._unsafeUnwrapErr().erreurs).toEqual([
      { type: 'LIBELLE_MANQUANT', libelle: 'Total' },
      { type: 'LIBELLE_EN_DOUBLE', libelle: 'Bdr' },
      { type: 'LIBELLE_INVENTE', libelle: 'Lune' },
    ])
  })

  it('rejette un identifiant absent des candidats ou manquant', () => {
    const result = checkRapprochements({
      proposition: [
        { libelle: 'Bdr', statut: 'RESOLU', publicId: 'DEPT-99' },
        { libelle: 'Corse', statut: 'AMBIGU', candidats: [] },
        { libelle: 'Total', statut: 'RESOLU' },
      ],
      libelles,
      publicIdsConnus,
    })
    expect(result._unsafeUnwrapErr().erreurs).toEqual([
      { type: 'PUBLIC_ID_INCONNU', libelle: 'Bdr', publicId: 'DEPT-99' },
      { type: 'PUBLIC_ID_MANQUANT', libelle: 'Corse' },
      { type: 'PUBLIC_ID_MANQUANT', libelle: 'Total' },
    ])
  })
})

describe.concurrent('buildProfilColonnes', () => {
  it('donne la nature dominante, le nombre de valeurs distinctes et des exemples', () => {
    const profil = buildProfilColonnes({
      tableau: {
        entetes: ['Dpt', 'Taux', 'Jour', 'Vide'],
        lignes: [
          ['Ain', '96,4', '15/03/2024', null],
          ['Ain', 93.2, '16/03/2024', ''],
          ['Paris', 'n.d.', '17/03/2024', null],
        ],
      },
    })
    expect(profil).toEqual([
      { entete: 'Dpt', nature: 'TEXTE', valeursDistinctes: 2, exemples: ['Ain', 'Paris'] },
      {
        entete: 'Taux',
        nature: 'NOMBRE',
        valeursDistinctes: 3,
        exemples: ['96,4', '93.2', 'n.d.'],
      },
      {
        entete: 'Jour',
        nature: 'DATE',
        valeursDistinctes: 3,
        exemples: ['15/03/2024', '16/03/2024', '17/03/2024'],
      },
      { entete: 'Vide', nature: 'VIDE', valeursDistinctes: 0, exemples: [] },
    ])
  })
})
