import {
  type MotifPlanImpossible,
  type PlanTransformation,
  type Rapprochement,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'

import { type ImportContext } from '@/valeurImport/queries/getImportContext'

// Corpus des tests qui appellent Albert : pour chaque fichier, le plan de
// transformation attendu. Ajouter un cas ici dès qu'un fichier réel est mal lu.

export type CasCorpus = {
  nom: string
  nomFichier: string
  context: ImportContext
  tableau: TableauSource
  attendu: { plan: PlanTransformation } | { echec: MotifPlanImpossible[] }
}

const exact = (publicId: string): Rapprochement => ({ statut: 'RESOLU', publicId, par: 'EXACT' })
const llm = (publicId: string): Rapprochement => ({ statut: 'RESOLU', publicId, par: 'LLM' })
const INCONNU: Rapprochement = { statut: 'INCONNU' }

const departements = [
  { id: 'DEPT-01', nom: 'Ain' },
  { id: 'DEPT-02', nom: 'Aisne' },
  { id: 'DEPT-13', nom: 'Bouches-du-Rhône' },
  { id: 'DEPT-22', nom: "Côtes-d'Armor" },
  { id: 'DEPT-2A', nom: 'Corse-du-Sud' },
  { id: 'DEPT-2B', nom: 'Haute-Corse' },
  { id: 'DEPT-75', nom: 'Paris' },
  { id: 'DEPT-84', nom: 'Vaucluse' },
].map((departement) => ({ ...departement, referentiel: 'REF-DEPT' }))

// Une commune homonyme d'un opérateur : la colonne d'axe ne doit pas s'y tromper.
const individusAvecHomonyme = [
  ...departements,
  { id: 'COM-84087', nom: 'Orange', referentiel: 'REF-COM' },
]

const axeOperateur = {
  id: 'AXE-OPERATEUR',
  nom: 'Opérateur',
  modalites: [
    { id: 'OP-BOUYGUES', nom: 'Bouygues Telecom' },
    { id: 'OP-FREE', nom: 'Free' },
    { id: 'OP-ORANGE', nom: 'Orange' },
    { id: 'OP-SFR', nom: 'SFR' },
  ],
}

const axeTechnologie = {
  id: 'AXE-TECHNO',
  nom: 'Technologie',
  modalites: [
    { id: 'TECH-4G', nom: '4G' },
    { id: 'TECH-5G', nom: '5G' },
  ],
}

const emissions = { nom: 'Émissions de gaz à effet de serre', unite: null }
const couverture = { nom: 'Couverture mobile du territoire', unite: 'POURCENTAGE' }

export const corpus: CasCorpus[] = [
  {
    nom: 'valeurs en lignes, abréviations et libellé ambigu',
    nomFichier: 'emissions_departements.csv',
    context: { indicateur: emissions, cibles: { individus: departements, axes: [] } },
    tableau: {
      entetes: ['Département', 'Période', 'Émissions (kt CO2)'],
      lignes: [
        ['Ain', '2022', '1 250,5'],
        ['Ain', '2023', '1 198,0'],
        ['Bdr', '2022', '9 840,2'],
        ['Bdr', '2023', '9 512,7'],
        ['Cotes d Armor', '2023', '2 104,3'],
        ['Corse', '2023', '880,1'],
        ['Total France', '2023', '401 000'],
      ],
    },
    attendu: {
      plan: {
        individu: {
          colonne: 'Département',
          rapprochements: {
            Ain: exact('DEPT-01'),
            Bdr: llm('DEPT-13'),
            'Cotes d Armor': exact('DEPT-22'),
            Corse: { statut: 'AMBIGU', candidats: ['DEPT-2A', 'DEPT-2B'] },
            'Total France': INCONNU,
          },
        },
        axes: [],
        valeurs: {
          disposition: 'LIGNES',
          colonneDate: 'Période',
          colonneValeur: 'Émissions (kt CO2)',
        },
      },
    },
  },
  {
    nom: 'dates en colonnes',
    nomFichier: 'emissions_par_annee.xlsx',
    context: { indicateur: emissions, cibles: { individus: departements, axes: [] } },
    tableau: {
      entetes: ['Département', '2021', '2022', '2023'],
      lignes: [
        ['Ain', 1301.2, 1250.5, 1198],
        ['Aisne', 2210, 2188.4, 2101.9],
        ['Paris', 5400.1, 5210, 5033.6],
        ['Vaucluse', 1820, 1795.5, null],
      ],
    },
    attendu: {
      plan: {
        individu: {
          colonne: 'Département',
          rapprochements: {
            Ain: exact('DEPT-01'),
            Aisne: exact('DEPT-02'),
            Paris: exact('DEPT-75'),
            Vaucluse: exact('DEPT-84'),
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
      },
    },
  },
  {
    nom: 'export PPG avec un type de valeur',
    nomFichier: 'export_ppg_indicateur.csv',
    context: { indicateur: emissions, cibles: { individus: departements, axes: [] } },
    tableau: {
      entetes: ['territoire_code', 'date_valeur', 'type_valeur', 'valeur'],
      lignes: [
        ['DEPT-01', '2020-12-31', 'vi', 1400],
        ['DEPT-01', '2023-12-31', 'va', 1198],
        ['DEPT-01', '2026-12-31', 'vc', 1000],
        ['DEPT-75', '2020-12-31', 'vi', 5600],
        ['DEPT-75', '2023-12-31', 'va', 5033.6],
        ['DEPT-75', '2026-12-31', 'vc', 4500],
      ],
    },
    attendu: {
      plan: {
        individu: {
          colonne: 'territoire_code',
          rapprochements: { 'DEPT-01': exact('DEPT-01'), 'DEPT-75': exact('DEPT-75') },
        },
        axes: [],
        valeurs: { disposition: 'LIGNES', colonneDate: 'date_valeur', colonneValeur: 'valeur' },
        filtre: { colonne: 'type_valeur', valeursRetenues: ['va'] },
      },
    },
  },
  {
    nom: 'deux axes, dates en colonnes, homonyme entre axe et individu',
    nomFichier: 'couverture_mobile_arcep.xlsx',
    context: {
      indicateur: couverture,
      cibles: { individus: individusAvecHomonyme, axes: [axeOperateur, axeTechnologie] },
    },
    tableau: {
      entetes: ['Dpt', 'Opérateur', 'Techno', '2022', '2023', '2024'],
      lignes: [
        ['Ain', 'Orange', '4G', 96.4, 97.1, 98],
        ['Ain', 'SFR', '4G', 93.2, 94.8, 95.6],
        ['Ain', 'Bouygues', '5G', 22.1, 37.5, 51.3],
        ['Vaucluse', 'Free Mobile', '4G', 89.5, 91.2, 92.7],
        ['Vaucluse', 'MVNO', '4G', 60.1, 62.5, 64],
      ],
    },
    attendu: {
      plan: {
        individu: {
          colonne: 'Dpt',
          rapprochements: { Ain: exact('DEPT-01'), Vaucluse: exact('DEPT-84') },
        },
        axes: [
          {
            axe: 'AXE-OPERATEUR',
            colonne: 'Opérateur',
            rapprochements: {
              Orange: exact('OP-ORANGE'),
              SFR: exact('OP-SFR'),
              Bouygues: llm('OP-BOUYGUES'),
              'Free Mobile': llm('OP-FREE'),
              MVNO: INCONNU,
            },
          },
          {
            axe: 'AXE-TECHNO',
            colonne: 'Techno',
            rapprochements: { '4G': exact('TECH-4G'), '5G': exact('TECH-5G') },
          },
        ],
        valeurs: {
          disposition: 'COLONNES',
          colonnes: [
            { colonne: '2022', date: '2022-01-01' },
            { colonne: '2023', date: '2023-01-01' },
            { colonne: '2024', date: '2024-01-01' },
          ],
        },
      },
    },
  },
  {
    nom: 'axe de l’indicateur absent du fichier',
    nomFichier: 'couverture_sans_operateur.csv',
    context: {
      indicateur: couverture,
      cibles: { individus: departements, axes: [axeOperateur] },
    },
    tableau: {
      entetes: ['Département', 'Année', 'Taux de couverture'],
      lignes: [
        ['Ain', '2023', '97,1'],
        ['Paris', '2023', '99,8'],
      ],
    },
    attendu: { echec: ['AXE_SANS_COLONNE'] },
  },
  {
    nom: 'fichier sans valeur exploitable',
    nomFichier: 'annuaire_referents.csv',
    context: { indicateur: emissions, cibles: { individus: departements, axes: [] } },
    tableau: {
      entetes: ['Nom du référent', 'Courriel', 'Commentaire'],
      lignes: [
        ['Camille Martin', 'camille.martin@example.gouv.fr', 'À relancer en septembre'],
        ['Sacha Durand', 'sacha.durand@example.gouv.fr', 'Dossier complet'],
      ],
    },
    attendu: {
      echec: ['PAS_D_INDIVIDU', 'PAS_DE_DATE', 'PAS_DE_VALEUR', 'STRUCTURE_NON_RECONNUE'],
    },
  },
]
