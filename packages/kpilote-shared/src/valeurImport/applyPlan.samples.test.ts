import { describe, expect, it } from 'vitest'

import {
  type CiblesSaisie,
  type PlanTransformation,
  type Rapprochement,
  type TableauSource,
} from '../valeurImport'
import { applyPlan, isImportable, type LigneImport, toItemsImport } from './applyPlan'
import { buildPlanStandard } from './buildPlan'

// Les fichiers d'exemple de `apps/kpilote-webapp/samples` se décrivent par un
// plan de transformation, sans Albert : le plan de `buildPlanStandard` pour un
// fichier au format standard, un plan écrit à la main pour les autres. Les
// cellules sont des chaînes, comme la webapp lit un CSV.
// Deux fichiers n'ont pas de plan : le 04, inexploitable, et le IND-103_10, dont
// les types de fraude sont en colonnes. Le plan ne lit une modalité que dans une
// cellule, pas dans un en-tête.

const resolu = (publicId: string): Rapprochement => ({ statut: 'RESOLU', publicId, par: 'EXACT' })
const inconnu: Rapprochement = { statut: 'INCONNU' }

const countImportables = (lignes: ReadonlyArray<LigneImport>): number =>
  lignes.filter(isImportable).length

const buildPlan = ({
  tableau,
  cibles,
}: {
  tableau: TableauSource
  cibles: CiblesSaisie
}): PlanTransformation => {
  const resultat = buildPlanStandard({ tableau, cibles })
  if (!resultat.ok) {
    throw new Error(`Colonnes manquantes : ${resultat.colonnesManquantes.join(', ')}`)
  }
  return resultat.plan
}

const ciblesInd019: CiblesSaisie = {
  individus: [
    { id: 'DEPT-01', nom: 'Ain', referentiel: 'REF-DEPT' },
    { id: 'DEPT-06', nom: 'Alpes-Maritimes', referentiel: 'REF-DEPT' },
    { id: 'DEPT-13', nom: 'Bouches-du-Rhône', referentiel: 'REF-DEPT' },
    { id: 'DEPT-2A', nom: 'Corse-du-Sud', referentiel: 'REF-DEPT' },
    { id: 'DEPT-33', nom: 'Gironde', referentiel: 'REF-DEPT' },
    { id: 'DEPT-35', nom: 'Ille-et-Vilaine', referentiel: 'REF-DEPT' },
    { id: 'DEPT-38', nom: 'Isère', referentiel: 'REF-DEPT' },
    { id: 'DEPT-44', nom: 'Loire-Atlantique', referentiel: 'REF-DEPT' },
    { id: 'DEPT-59', nom: 'Nord', referentiel: 'REF-DEPT' },
    { id: 'DEPT-69', nom: 'Rhône', referentiel: 'REF-DEPT' },
    { id: 'DEPT-75', nom: 'Paris', referentiel: 'REF-DEPT' },
    { id: 'DEPT-971', nom: 'Guadeloupe', referentiel: 'REF-DEPT' },
  ],
  axes: [],
}

// Les modalités feuilles de l'indicateur IND-103 : `FR-FISCALE` et
// `FR-SOCIALE` regroupent des types de fraude, on ne saisit pas dessus.
const ciblesInd103: CiblesSaisie = {
  individus: [
    { id: 'DEPT-01', nom: 'Ain', referentiel: 'REF-DEPT' },
    { id: 'DEPT-13', nom: 'Bouches-du-Rhône', referentiel: 'REF-DEPT' },
    { id: 'DEPT-38', nom: 'Isère', referentiel: 'REF-DEPT' },
    { id: 'DEPT-75', nom: 'Paris', referentiel: 'REF-DEPT' },
  ],
  axes: [
    {
      id: 'AXE-OPERATEUR',
      nom: 'Opérateur',
      modalites: [
        { id: 'OP-ORANGE', nom: 'Orange' },
        { id: 'OP-SFR', nom: 'SFR' },
        { id: 'OP-FREE', nom: 'Free' },
        { id: 'OP-BOUYGUES', nom: 'Bouygues Telecom' },
      ],
    },
    {
      id: 'AXE-FRAUDE',
      nom: 'Type de fraude',
      modalites: [
        { id: 'FR-TVA', nom: 'Fraude à la TVA' },
        { id: 'FR-IR', nom: "Fraude à l'impôt sur le revenu" },
        { id: 'FR-IS', nom: "Fraude à l'impôt sur les sociétés" },
        { id: 'FR-COTISATIONS', nom: 'Fraude aux cotisations' },
        { id: 'FR-PRESTATIONS', nom: 'Fraude aux prestations' },
      ],
    },
  ],
}

describe('applyPlan sur les fichiers d’exemple', () => {
  it('01_import_normal : format standard, sans axe', () => {
    const tableau: TableauSource = {
      entetes: ['individu', 'date', 'valeur'],
      lignes: [
        ['DEPT-01', '2021-01-01', '867'],
        ['DEPT-01', '2022-01-01', '828'],
        ['DEPT-01', '2023-01-01', '823'],
        ['DEPT-06', '2021-01-01', '1000'],
        ['DEPT-06', '2022-01-01', '986'],
        ['DEPT-06', '2023-01-01', '990'],
        ['DEPT-13', '2021-01-01', '1152'],
        ['DEPT-13', '2022-01-01', '1154'],
        ['DEPT-13', '2023-01-01', '1147'],
        ['DEPT-2A', '2021-01-01', '1317'],
        ['DEPT-2A', '2022-01-01', '1317'],
        ['DEPT-2A', '2023-01-01', '1288'],
        ['DEPT-33', '2021-01-01', '1483'],
        ['DEPT-33', '2022-01-01', '1465'],
        ['DEPT-33', '2023-01-01', '1410'],
        ['DEPT-35', '2021-01-01', '1639'],
        ['DEPT-35', '2022-01-01', '1594'],
        ['DEPT-35', '2023-01-01', '1523'],
        ['DEPT-38', '2021-01-01', '1776'],
        ['DEPT-38', '2022-01-01', '1710'],
        ['DEPT-38', '2023-01-01', '1639'],
        ['DEPT-44', '2021-01-01', '1897'],
        ['DEPT-44', '2022-01-01', '1823'],
        ['DEPT-44', '2023-01-01', '1770'],
        ['DEPT-59', '2021-01-01', '2009'],
        ['DEPT-59', '2022-01-01', '1947'],
        ['DEPT-59', '2023-01-01', '1919'],
        ['DEPT-69', '2021-01-01', '2127'],
        ['DEPT-69', '2022-01-01', '2088'],
        ['DEPT-69', '2023-01-01', '2083'],
        ['DEPT-75', '2021-01-01', '2260'],
        ['DEPT-75', '2022-01-01', '2247'],
        ['DEPT-75', '2023-01-01', '2250'],
        ['DEPT-971', '2021-01-01', '2412'],
        ['DEPT-971', '2022-01-01', '2414'],
        ['DEPT-971', '2023-01-01', '2408'],
      ],
    }
    const plan = buildPlan({ tableau, cibles: ciblesInd019 })

    const { lignes } = applyPlan({ plan, tableau })

    expect(lignes).toHaveLength(36)
    expect(countImportables(lignes)).toBe(36)
    expect(toItemsImport(lignes.slice(0, 1))).toEqual([
      { individu: 'DEPT-01', date: '2021-01-01', valeur: 867 },
    ])
  })

  it('02_import_albert_long : valeurs en lignes, dates en toutes lettres', () => {
    const tableau: TableauSource = {
      entetes: ['Département', 'Période', 'Émissions (kt CO2e)'],
      lignes: [
        ['Ain', '1er janvier 2021', '867'],
        ['Ain', 'janvier 2022', '828'],
        ['Ain', '2023', '823'],
        ['Alpes-Maritimes', '1er janvier 2021', '1000'],
        ['Alpes-Maritimes', 'janvier 2022', '986'],
        ['Alpes-Maritimes', '2023', '990'],
        ['Bouches-du-Rhône', '1er janvier 2021', '1152'],
        ['Bouches-du-Rhône', 'janvier 2022', '1154'],
        ['Bouches-du-Rhône', '2023', '1147'],
        ['Corse-du-Sud', '1er janvier 2021', '1317'],
        ['Corse-du-Sud', 'janvier 2022', '1317'],
        ['Corse-du-Sud', '2023', '1288'],
        ['Gironde', '1er janvier 2021', '1483'],
        ['Gironde', 'janvier 2022', '1465'],
        ['Gironde', '2023', '1410'],
        ['Ille-et-Vilaine', '1er janvier 2021', '1639'],
        ['Ille-et-Vilaine', 'janvier 2022', '1594'],
        ['Ille-et-Vilaine', '2023', '1523'],
        ['Isère', '1er janvier 2021', '1776'],
        ['Isère', 'janvier 2022', '1710'],
        ['Isère', '2023', '1639'],
        ['Loire-Atlantique', '1er janvier 2021', '1897'],
        ['Loire-Atlantique', 'janvier 2022', '1823'],
        ['Loire-Atlantique', '2023', '1770'],
        ['Nord', '1er janvier 2021', '2009'],
        ['Nord', 'janvier 2022', '1947'],
        ['Nord', '2023', '1919'],
        ['Rhône', '1er janvier 2021', '2127'],
        ['Rhône', 'janvier 2022', '2088'],
        ['Rhône', '2023', '2083'],
        ['Paris', '1er janvier 2021', '2260'],
        ['Paris', 'janvier 2022', '2247'],
        ['Paris', '2023', '2250'],
        ['Guadeloupe', '1er janvier 2021', '2412'],
        ['Guadeloupe', 'janvier 2022', '2414'],
        ['Guadeloupe', '2023', '2408'],
      ],
    }
    const plan: PlanTransformation = {
      individu: {
        colonne: 'Département',
        rapprochements: {
          Ain: resolu('DEPT-01'),
          'Alpes-Maritimes': resolu('DEPT-06'),
          'Bouches-du-Rhône': resolu('DEPT-13'),
          'Corse-du-Sud': resolu('DEPT-2A'),
          Gironde: resolu('DEPT-33'),
          'Ille-et-Vilaine': resolu('DEPT-35'),
          Isère: resolu('DEPT-38'),
          'Loire-Atlantique': resolu('DEPT-44'),
          Nord: resolu('DEPT-59'),
          Rhône: resolu('DEPT-69'),
          Paris: resolu('DEPT-75'),
          Guadeloupe: resolu('DEPT-971'),
        },
      },
      axes: [],
      valeurs: {
        disposition: 'LIGNES',
        colonneDate: 'Période',
        colonneValeur: 'Émissions (kt CO2e)',
      },
    }

    const { lignes } = applyPlan({ plan, tableau })

    expect(lignes).toHaveLength(36)
    expect(countImportables(lignes)).toBe(36)
    expect(toItemsImport(lignes.slice(0, 3))).toEqual([
      { individu: 'DEPT-01', date: '2021-01-01', valeur: 867 },
      { individu: 'DEPT-01', date: '2022-01-01', valeur: 828 },
      { individu: 'DEPT-01', date: '2023-01-01', valeur: 823 },
    ])
  })

  it('03_import_albert_pivot : années en colonnes', () => {
    const tableau: TableauSource = {
      entetes: ['Territoire', '2021', '2022', '2023'],
      lignes: [
        ['Ain', '867', '828', '823'],
        ['Alpes-Maritimes', '1000', '986', '990'],
        ['Bouches-du-Rhône', '1152', '1154', '1147'],
        ['Corse-du-Sud', '1317', '1317', '1288'],
        ['Gironde', '1483', '1465', '1410'],
        ['Ille-et-Vilaine', '1639', '1594', '1523'],
        ['Isère', '1776', '1710', '1639'],
        ['Loire-Atlantique', '1897', '1823', '1770'],
        ['Nord', '2009', '1947', '1919'],
        ['Rhône', '2127', '2088', '2083'],
        ['Paris', '2260', '2247', '2250'],
        ['Guadeloupe', '2412', '2414', '2408'],
      ],
    }
    const plan: PlanTransformation = {
      individu: {
        colonne: 'Territoire',
        rapprochements: {
          Ain: resolu('DEPT-01'),
          'Alpes-Maritimes': resolu('DEPT-06'),
          'Bouches-du-Rhône': resolu('DEPT-13'),
          'Corse-du-Sud': resolu('DEPT-2A'),
          Gironde: resolu('DEPT-33'),
          'Ille-et-Vilaine': resolu('DEPT-35'),
          Isère: resolu('DEPT-38'),
          'Loire-Atlantique': resolu('DEPT-44'),
          Nord: resolu('DEPT-59'),
          Rhône: resolu('DEPT-69'),
          Paris: resolu('DEPT-75'),
          Guadeloupe: resolu('DEPT-971'),
        },
      },
      axes: [],
      valeurs: {
        disposition: 'COLONNES',
        colonnes: [
          { colonne: '2021', date: '2021-01-01' },
          { colonne: '2022', date: '2022-01-01' },
          { colonne: '2023', date: '2023-01-01' },
        ],
      },
    }

    const { lignes } = applyPlan({ plan, tableau })

    expect(lignes).toHaveLength(36)
    expect(countImportables(lignes)).toBe(36)
    expect(toItemsImport(lignes.slice(0, 1))).toEqual([
      { individu: 'DEPT-01', date: '2021-01-01', valeur: 867 },
    ])
  })

  it('05_import_albert_axes : deux axes, trimestres en colonnes, abréviations', () => {
    const tableau: TableauSource = {
      entetes: ['Département', 'Opérateur', 'Type de fraude', 'T1 2019', 'T2 2019'],
      lignes: [
        ['Ain', 'Orange', 'TVA', '12,4', '13,1'],
        ['Ain', 'SFR', "Fraude à l'IR", '3,2', 'n.d.'],
        ['Bdr', 'Bouygues', 'Cotisations', '8,8', '9,4'],
        ['Corse', 'Free Mobile', 'Prestations', '1,1', '1,3'],
        ['Paris', 'MVNO', 'TVA', '20,5', '21,0'],
        ['Cotes d Armor', 'Orange', 'Impôt sur les sociétés', '4,4', '4,9'],
        ['Vaucluse', 'SFR', 'Cotisations', '2,7', ''],
      ],
    }
    const plan: PlanTransformation = {
      individu: {
        colonne: 'Département',
        rapprochements: {
          Ain: resolu('DEPT-01'),
          Bdr: resolu('DEPT-13'),
          // La Corse est en deux départements.
          Corse: { statut: 'AMBIGU', candidats: ['DEPT-2A', 'DEPT-2B'] },
          Paris: resolu('DEPT-75'),
          'Cotes d Armor': resolu('DEPT-22'),
          Vaucluse: resolu('DEPT-84'),
        },
      },
      axes: [
        {
          axe: 'AXE-OPERATEUR',
          colonne: 'Opérateur',
          rapprochements: {
            Orange: resolu('OP-ORANGE'),
            SFR: resolu('OP-SFR'),
            Bouygues: resolu('OP-BOUYGUES'),
            'Free Mobile': resolu('OP-FREE'),
            MVNO: inconnu,
          },
        },
        {
          axe: 'AXE-FRAUDE',
          colonne: 'Type de fraude',
          rapprochements: {
            TVA: resolu('FR-TVA'),
            "Fraude à l'IR": resolu('FR-IR'),
            Cotisations: resolu('FR-COTISATIONS'),
            Prestations: resolu('FR-PRESTATIONS'),
            'Impôt sur les sociétés': resolu('FR-IS'),
          },
        },
      ],
      valeurs: {
        disposition: 'COLONNES',
        colonnes: [
          { colonne: 'T1 2019', date: '2019-01-01' },
          { colonne: 'T2 2019', date: '2019-04-01' },
        ],
      },
    }

    const { lignes } = applyPlan({ plan, tableau })

    // Sept lignes, deux trimestres, une cellule vide (Vaucluse, T2 2019).
    expect(lignes).toHaveLength(13)
    // À corriger : la valeur `n.d.`, les deux lignes de la Corse et les deux de `MVNO`.
    expect(countImportables(lignes)).toBe(8)
    expect(toItemsImport(lignes.slice(0, 1))).toEqual([
      {
        individu: 'DEPT-01',
        modalites: ['OP-ORANGE', 'FR-TVA'],
        date: '2019-01-01',
        valeur: 12.4,
      },
    ])
  })

  it('06_import_standard_axes : format standard avec axes, libellés à corriger', () => {
    const tableau: TableauSource = {
      entetes: ['individu', 'AXE-OPERATEUR', 'AXE-FRAUDE', 'date', 'valeur'],
      lignes: [
        ['DEPT-01', 'OP-ORANGE', 'FR-TVA', '2018-01-01', '10,5'],
        ['DEPT-01', 'OP-SFR', 'FR-IR', '2018-01-01', '2,1'],
        ['Paris', 'Orange', 'Fraude à la TVA', '2018-01-01', '18,2'],
        ['DEPT-13', 'OP-INCONNU', 'FR-TVA', '2018-01-01', '7'],
        ['DEPT-75', 'OP-FREE', 'FR-FISCALE', '01/04/2018', 'abc'],
      ],
    }
    const plan = buildPlan({ tableau, cibles: ciblesInd103 })

    const { lignes } = applyPlan({ plan, tableau })

    expect(lignes).toHaveLength(5)
    // À corriger : `OP-INCONNU`, et `FR-FISCALE` (non feuille) sur une ligne dont la valeur est `abc`.
    expect(countImportables(lignes)).toBe(3)
    expect(toItemsImport(lignes.slice(0, 1))).toEqual([
      {
        individu: 'DEPT-01',
        modalites: ['OP-ORANGE', 'FR-TVA'],
        date: '2018-01-01',
        valeur: 10.5,
      },
    ])
  })

  it('07_import_albert_lignes_axes : deux axes, valeurs en lignes, dates de plusieurs formes', () => {
    const tableau: TableauSource = {
      entetes: [
        'Territoire',
        'Opérateur télécom',
        'Nature de la fraude',
        'Mois',
        'Montant détecté (M€)',
      ],
      lignes: [
        ['Ain', 'Orange', 'TVA', 'janvier 2018', '1,2'],
        ['Ain', 'Orange', 'TVA', 'février 2018', '1,4'],
        ['Ain', 'SFR', 'Impôt sur le revenu', 'janvier 2018', '0,6'],
        ['Bouches du Rhone', 'Bouygues', 'Cotisations sociales', 'janvier 2018', '3,8'],
        ['Bouches du Rhone', 'Free Mobile', 'Prestations', 'févr. 2018', '2,1'],
        ['Paris', 'Orange', 'Impôt sur les sociétés', '01/03/2018', '7,5'],
        ['Paris', 'SFR', 'TVA', 'T1 2018', 'non communiqué'],
        ['Vaucluse', 'Orange', 'TVA', 'mars 2018', '0,9'],
      ],
    }
    const plan: PlanTransformation = {
      individu: {
        colonne: 'Territoire',
        rapprochements: {
          Ain: resolu('DEPT-01'),
          'Bouches du Rhone': resolu('DEPT-13'),
          Paris: resolu('DEPT-75'),
          Vaucluse: resolu('DEPT-84'),
        },
      },
      axes: [
        {
          axe: 'AXE-OPERATEUR',
          colonne: 'Opérateur télécom',
          rapprochements: {
            Orange: resolu('OP-ORANGE'),
            SFR: resolu('OP-SFR'),
            Bouygues: resolu('OP-BOUYGUES'),
            'Free Mobile': resolu('OP-FREE'),
          },
        },
        {
          axe: 'AXE-FRAUDE',
          colonne: 'Nature de la fraude',
          rapprochements: {
            TVA: resolu('FR-TVA'),
            'Impôt sur le revenu': resolu('FR-IR'),
            'Cotisations sociales': resolu('FR-COTISATIONS'),
            Prestations: resolu('FR-PRESTATIONS'),
            'Impôt sur les sociétés': resolu('FR-IS'),
          },
        },
      ],
      valeurs: {
        disposition: 'LIGNES',
        colonneDate: 'Mois',
        colonneValeur: 'Montant détecté (M€)',
      },
    }

    const { lignes } = applyPlan({ plan, tableau })

    expect(lignes).toHaveLength(8)
    // À corriger : la valeur `non communiqué`.
    expect(countImportables(lignes)).toBe(7)
    expect(lignes.map((ligne) => ligne.date)).toMatchObject([
      { valeur: '2018-01-01' },
      { valeur: '2018-02-01' },
      { valeur: '2018-01-01' },
      { valeur: '2018-01-01' },
      { valeur: '2018-02-01' },
      { valeur: '2018-03-01' },
      { valeur: '2018-01-01' },
      { valeur: '2018-03-01' },
    ])
    expect(toItemsImport(lignes.slice(0, 1))).toEqual([
      {
        individu: 'DEPT-01',
        modalites: ['OP-ORANGE', 'FR-TVA'],
        date: '2018-01-01',
        valeur: 1.2,
      },
    ])
  })

  it('08_import_albert_type_valeur : seules les valeurs d’avancement sont gardées', () => {
    const tableau: TableauSource = {
      entetes: ['territoire', 'operateur', 'type_fraude', 'date_valeur', 'type_valeur', 'valeur'],
      lignes: [
        ['DEPT-01', 'OP-ORANGE', 'FR-TVA', '2017-12-31', 'vi', '8'],
        ['DEPT-01', 'OP-ORANGE', 'FR-TVA', '2018-06-30', 'va', '9,5'],
        ['DEPT-01', 'OP-ORANGE', 'FR-TVA', '2020-12-31', 'vc', '15'],
        ['DEPT-75', 'OP-SFR', 'FR-IR', '2017-12-31', 'vi', '4'],
        ['DEPT-75', 'OP-SFR', 'FR-IR', '2018-06-30', 'va', '4,8'],
        ['DEPT-75', 'OP-SFR', 'FR-IR', '2020-12-31', 'vc', '9'],
      ],
    }
    const plan: PlanTransformation = {
      individu: {
        colonne: 'territoire',
        rapprochements: { 'DEPT-01': resolu('DEPT-01'), 'DEPT-75': resolu('DEPT-75') },
      },
      axes: [
        {
          axe: 'AXE-OPERATEUR',
          colonne: 'operateur',
          rapprochements: { 'OP-ORANGE': resolu('OP-ORANGE'), 'OP-SFR': resolu('OP-SFR') },
        },
        {
          axe: 'AXE-FRAUDE',
          colonne: 'type_fraude',
          rapprochements: { 'FR-TVA': resolu('FR-TVA'), 'FR-IR': resolu('FR-IR') },
        },
      ],
      valeurs: { disposition: 'LIGNES', colonneDate: 'date_valeur', colonneValeur: 'valeur' },
      filtre: { colonne: 'type_valeur', valeursRetenues: ['va'] },
    }

    const { lignes, lignesEcartees } = applyPlan({ plan, tableau })

    expect(lignes).toHaveLength(2)
    expect(countImportables(lignes)).toBe(2)
    // Les valeurs initiales (`vi`) et cibles (`vc`).
    expect(lignesEcartees).toBe(4)
    expect(toItemsImport(lignes.slice(0, 1))).toEqual([
      {
        individu: 'DEPT-01',
        modalites: ['OP-ORANGE', 'FR-TVA'],
        date: '2018-06-30',
        valeur: 9.5,
      },
    ])
  })

  it('IND-103_09_import_standard_axes_complet : format standard avec axes, rien à corriger', () => {
    const tableau: TableauSource = {
      entetes: ['individu', 'AXE-OPERATEUR', 'AXE-FRAUDE', 'date', 'valeur'],
      lignes: [
        ['DEPT-01', 'OP-ORANGE', 'FR-TVA', '2026-01-01', '2,45'],
        ['DEPT-01', 'OP-ORANGE', 'FR-IR', '2026-01-01', '0,95'],
        ['DEPT-01', 'OP-ORANGE', 'FR-IS', '2026-01-01', '1,34'],
        ['DEPT-01', 'OP-ORANGE', 'FR-COTISATIONS', '2026-01-01', '1,34'],
        ['DEPT-01', 'OP-ORANGE', 'FR-PRESTATIONS', '2026-01-01', '0,60'],
        ['DEPT-01', 'OP-SFR', 'FR-TVA', '2026-01-01', '1,28'],
        ['DEPT-01', 'OP-SFR', 'FR-IR', '2026-01-01', '0,61'],
        ['DEPT-01', 'OP-SFR', 'FR-IS', '2026-01-01', '0,74'],
        ['DEPT-01', 'OP-SFR', 'FR-COTISATIONS', '2026-01-01', '0,78'],
        ['DEPT-01', 'OP-SFR', 'FR-PRESTATIONS', '2026-01-01', '0,43'],
        ['DEPT-01', 'OP-FREE', 'FR-TVA', '2026-01-01', '1,20'],
        ['DEPT-01', 'OP-FREE', 'FR-IR', '2026-01-01', '0,44'],
        ['DEPT-01', 'OP-FREE', 'FR-IS', '2026-01-01', '0,59'],
        ['DEPT-01', 'OP-FREE', 'FR-COTISATIONS', '2026-01-01', '0,60'],
        ['DEPT-01', 'OP-FREE', 'FR-PRESTATIONS', '2026-01-01', '0,34'],
        ['DEPT-01', 'OP-BOUYGUES', 'FR-TVA', '2026-01-01', '0,76'],
        ['DEPT-01', 'OP-BOUYGUES', 'FR-IR', '2026-01-01', '0,34'],
        ['DEPT-01', 'OP-BOUYGUES', 'FR-IS', '2026-01-01', '0,44'],
        ['DEPT-01', 'OP-BOUYGUES', 'FR-COTISATIONS', '2026-01-01', '0,44'],
        ['DEPT-01', 'OP-BOUYGUES', 'FR-PRESTATIONS', '2026-01-01', '0,24'],
        ['DEPT-38', 'OP-ORANGE', 'FR-TVA', '2026-01-01', '3,93'],
        ['DEPT-38', 'OP-ORANGE', 'FR-IR', '2026-01-01', '1,77'],
        ['DEPT-38', 'OP-ORANGE', 'FR-IS', '2026-01-01', '2,51'],
        ['DEPT-38', 'OP-ORANGE', 'FR-COTISATIONS', '2026-01-01', '2,51'],
        ['DEPT-38', 'OP-ORANGE', 'FR-PRESTATIONS', '2026-01-01', '1,18'],
        ['DEPT-38', 'OP-SFR', 'FR-TVA', '2026-01-01', '2,78'],
        ['DEPT-38', 'OP-SFR', 'FR-IR', '2026-01-01', '1,14'],
        ['DEPT-38', 'OP-SFR', 'FR-IS', '2026-01-01', '1,60'],
        ['DEPT-38', 'OP-SFR', 'FR-COTISATIONS', '2026-01-01', '1,42'],
        ['DEPT-38', 'OP-SFR', 'FR-PRESTATIONS', '2026-01-01', '0,73'],
        ['DEPT-38', 'OP-FREE', 'FR-TVA', '2026-01-01', '2,13'],
        ['DEPT-38', 'OP-FREE', 'FR-IR', '2026-01-01', '0,98'],
        ['DEPT-38', 'OP-FREE', 'FR-IS', '2026-01-01', '1,23'],
        ['DEPT-38', 'OP-FREE', 'FR-COTISATIONS', '2026-01-01', '1,19'],
        ['DEPT-38', 'OP-FREE', 'FR-PRESTATIONS', '2026-01-01', '0,57'],
        ['DEPT-38', 'OP-BOUYGUES', 'FR-TVA', '2026-01-01', '1,51'],
        ['DEPT-38', 'OP-BOUYGUES', 'FR-IR', '2026-01-01', '0,64'],
        ['DEPT-38', 'OP-BOUYGUES', 'FR-IS', '2026-01-01', '0,99'],
        ['DEPT-38', 'OP-BOUYGUES', 'FR-COTISATIONS', '2026-01-01', '0,97'],
        ['DEPT-38', 'OP-BOUYGUES', 'FR-PRESTATIONS', '2026-01-01', '0,49'],
      ],
    }
    const plan = buildPlan({ tableau, cibles: ciblesInd103 })

    const { lignes } = applyPlan({ plan, tableau })

    expect(lignes).toHaveLength(40)
    expect(countImportables(lignes)).toBe(40)
    expect(toItemsImport(lignes.slice(0, 1))).toEqual([
      {
        individu: 'DEPT-01',
        modalites: ['OP-ORANGE', 'FR-TVA'],
        date: '2026-01-01',
        valeur: 2.45,
      },
    ])
  })

  it('IND-103_11_import_albert_pieges : doublon, modalités non feuilles, région, date impossible', () => {
    const tableau: TableauSource = {
      entetes: ['Territoire', 'Opérateur', 'Type de fraude', 'Date', 'Montant (M€)'],
      lignes: [
        ['Ain', 'Orange', 'Fraude à la TVA', '01/07/2026', '0,58'],
        ['Ain', 'Orange', 'Fraude à la TVA', 'juillet 2026', '0,61'],
        ['Ain', 'SFR', 'Fraude fiscale', '01/07/2026', '0,72'],
        ['Isère', 'Tous opérateurs', 'Fraude à la TVA', '01/07/2026', '2,95'],
        ['Isère', 'Free', 'Toutes fraudes', '01/07/2026', '1,48'],
        ['Auvergne-Rhône-Alpes', 'Orange', 'Fraude aux cotisations', '01/07/2026', '3,10'],
        ['Rhône', 'Bouygues Telecom', 'Fraude aux prestations', '01/07/2026', '0,14'],
        ['Rhône', 'Bouygues Telecom', 'Fraude aux cotisations', '01/07/2026', '-0,20'],
        ['Savoie', 'SFR', "Fraude à l'impôt sur les sociétés", '31/06/2026', '0,33'],
      ],
    }
    const plan: PlanTransformation = {
      individu: {
        colonne: 'Territoire',
        rapprochements: {
          Ain: resolu('DEPT-01'),
          Isère: resolu('DEPT-38'),
          // Une région, pas un département de l'indicateur.
          'Auvergne-Rhône-Alpes': inconnu,
          Rhône: resolu('DEPT-69'),
          Savoie: resolu('DEPT-73'),
        },
      },
      axes: [
        {
          axe: 'AXE-OPERATEUR',
          colonne: 'Opérateur',
          rapprochements: {
            Orange: resolu('OP-ORANGE'),
            SFR: resolu('OP-SFR'),
            'Tous opérateurs': inconnu,
            Free: resolu('OP-FREE'),
            'Bouygues Telecom': resolu('OP-BOUYGUES'),
          },
        },
        {
          axe: 'AXE-FRAUDE',
          colonne: 'Type de fraude',
          rapprochements: {
            'Fraude à la TVA': resolu('FR-TVA'),
            'Fraude fiscale': inconnu,
            'Toutes fraudes': inconnu,
            'Fraude aux cotisations': resolu('FR-COTISATIONS'),
            'Fraude aux prestations': resolu('FR-PRESTATIONS'),
            "Fraude à l'impôt sur les sociétés": resolu('FR-IS'),
          },
        },
      ],
      valeurs: { disposition: 'LIGNES', colonneDate: 'Date', colonneValeur: 'Montant (M€)' },
    }

    const { lignes } = applyPlan({ plan, tableau })

    expect(lignes).toHaveLength(9)
    // Importables : la première ligne de l'Ain et les deux du Rhône, valeur négative comprise.
    expect(countImportables(lignes)).toBe(3)
    // `juillet 2026` répète la valeur de l'Ain au `01/07/2026`.
    expect(lignes[1]?.doublonDe).toBe(0)
    expect(lignes[8]?.date).toEqual({
      statut: 'A_CORRIGER',
      brut: '31/06/2026',
      motif: { type: 'DATE_ILLISIBLE' },
    })
    expect(toItemsImport(lignes.slice(0, 1))).toEqual([
      {
        individu: 'DEPT-01',
        modalites: ['OP-ORANGE', 'FR-TVA'],
        date: '2026-07-01',
        valeur: 0.58,
      },
    ])
  })

  it('IND-103_12_import_albert_virgule_mois_en_colonnes : décimales à point, mois en colonnes', () => {
    const tableau: TableauSource = {
      entetes: [
        'Code département',
        'Opérateur',
        'Nature de la fraude',
        'janv. 2027',
        'févr. 2027',
        'mars 2027',
      ],
      lignes: [
        ['01', 'OP-ORANGE', "Fraude à l'impôt sur le revenu, IR", '0.985', '1.005', '1.025'],
        ['01', 'OP-ORANGE', 'TVA (fraude carrousel incluse)', '2.046', '2.087', '2.128'],
        ['01', 'OP-SFR', "Fraude à l'impôt sur le revenu, IR", '0.543', '0.554', '0.565'],
        ['01', 'OP-SFR', 'TVA (fraude carrousel incluse)', '1.507', '1.537', '1.567'],
        ['38', 'OP-ORANGE', "Fraude à l'impôt sur le revenu, IR", '1.846', '1.883', '1.920'],
        ['38', 'OP-ORANGE', 'TVA (fraude carrousel incluse)', '3.917', '3.995', '4.073'],
        ['38', 'OP-SFR', "Fraude à l'impôt sur le revenu, IR", '1.109', '1.131', '1.153'],
        ['38', 'OP-SFR', 'TVA (fraude carrousel incluse)', '2.514', '2.565', '2.615'],
      ],
    }
    const plan: PlanTransformation = {
      individu: {
        colonne: 'Code département',
        rapprochements: { '01': resolu('DEPT-01'), '38': resolu('DEPT-38') },
      },
      axes: [
        {
          axe: 'AXE-OPERATEUR',
          colonne: 'Opérateur',
          rapprochements: { 'OP-ORANGE': resolu('OP-ORANGE'), 'OP-SFR': resolu('OP-SFR') },
        },
        {
          axe: 'AXE-FRAUDE',
          colonne: 'Nature de la fraude',
          rapprochements: {
            "Fraude à l'impôt sur le revenu, IR": resolu('FR-IR'),
            'TVA (fraude carrousel incluse)': resolu('FR-TVA'),
          },
        },
      ],
      valeurs: {
        disposition: 'COLONNES',
        colonnes: [
          { colonne: 'janv. 2027', date: '2027-01-01' },
          { colonne: 'févr. 2027', date: '2027-02-01' },
          { colonne: 'mars 2027', date: '2027-03-01' },
        ],
      },
    }

    const { lignes } = applyPlan({ plan, tableau })

    expect(lignes).toHaveLength(24)
    expect(countImportables(lignes)).toBe(24)
    expect(toItemsImport(lignes.slice(0, 1))).toEqual([
      {
        individu: 'DEPT-01',
        modalites: ['OP-ORANGE', 'FR-IR'],
        date: '2027-01-01',
        valeur: 0.985,
      },
    ])
  })
})
