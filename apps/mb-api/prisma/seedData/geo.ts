export const referentielsSeed = [
  {
    publicId: 'REF-NAT',
    nom: 'France (national)',
    description: "Référentiel national contenant l'unique individu FR.",
  },
  {
    publicId: 'REF-REG',
    nom: 'Régions de France',
    description: 'Régions administratives métropolitaines.',
  },
  {
    publicId: 'REF-DEPT',
    nom: 'Départements de France',
    description: 'Départements métropolitains (échantillon de seed).',
  },
] as const

export const individusSeed = [
  { publicId: 'FR', nom: 'France', referentiel: 'REF-NAT' },
  { publicId: 'REG-11', nom: 'Île-de-France', referentiel: 'REF-REG' },
  { publicId: 'REG-93', nom: "Provence-Alpes-Côte d'Azur", referentiel: 'REF-REG' },
  { publicId: 'REG-84', nom: 'Auvergne-Rhône-Alpes', referentiel: 'REF-REG' },
  { publicId: 'DEPT-75', nom: 'Paris', referentiel: 'REF-DEPT' },
  { publicId: 'DEPT-77', nom: 'Seine-et-Marne', referentiel: 'REF-DEPT' },
  { publicId: 'DEPT-78', nom: 'Yvelines', referentiel: 'REF-DEPT' },
  { publicId: 'DEPT-13', nom: 'Bouches-du-Rhône', referentiel: 'REF-DEPT' },
  { publicId: 'DEPT-83', nom: 'Var', referentiel: 'REF-DEPT' },
  { publicId: 'DEPT-84', nom: 'Vaucluse', referentiel: 'REF-DEPT' },
  { publicId: 'DEPT-06', nom: 'Alpes-Maritimes', referentiel: 'REF-DEPT' },
  { publicId: 'DEPT-69', nom: 'Rhône', referentiel: 'REF-DEPT' },
  { publicId: 'DEPT-38', nom: 'Isère', referentiel: 'REF-DEPT' },
  { publicId: 'DEPT-73', nom: 'Savoie', referentiel: 'REF-DEPT' },
] as const

export const relationsSeed = [
  { parent: 'REG-11', child: 'DEPT-75' },
  { parent: 'REG-11', child: 'DEPT-77' },
  { parent: 'REG-11', child: 'DEPT-78' },
  { parent: 'REG-93', child: 'DEPT-13' },
  { parent: 'REG-93', child: 'DEPT-83' },
  { parent: 'REG-93', child: 'DEPT-84' },
  { parent: 'REG-93', child: 'DEPT-06' },
  { parent: 'REG-84', child: 'DEPT-69' },
  { parent: 'REG-84', child: 'DEPT-38' },
  { parent: 'REG-84', child: 'DEPT-73' },
  { parent: 'FR', child: 'REG-11' },
  { parent: 'FR', child: 'REG-93' },
  { parent: 'FR', child: 'REG-84' },
] as const

const departementsObserves = [
  'DEPT-75',
  'DEPT-77',
  'DEPT-78',
  'DEPT-13',
  'DEPT-83',
  'DEPT-84',
  'DEPT-06',
  'DEPT-69',
  'DEPT-38',
  'DEPT-73',
]

// Familles de dates pour varier la temporalité des indicateurs (annuel,
// semestriel, trimestriel, mensuel, irrégulier).
const datesAnnuelles = ['2022-01-01', '2023-01-01', '2024-01-01', '2025-01-01']
const datesSemestrielles = ['2023-07-01', '2024-01-01', '2024-07-01', '2025-01-01', '2025-07-01']
const datesTrimestrielles = [
  '2024-03-31',
  '2024-06-30',
  '2024-09-30',
  '2024-12-31',
  '2025-03-31',
  '2025-06-30',
]
const datesMensuelles2025 = [
  '2025-01-15',
  '2025-02-15',
  '2025-03-15',
  '2025-04-15',
  '2025-05-15',
  '2025-06-15',
  '2025-07-15',
]
const datesIrregulieres = [
  '2023-11-08',
  '2024-02-12',
  '2024-05-30',
  '2024-08-22',
  '2024-11-05',
  '2025-03-10',
  '2025-09-18',
]

const buildDeptValeurs = (
  indicateurPublicId: string,
  baseValeur: number,
  step: number,
  dates: ReadonlyArray<string>,
) =>
  departementsObserves.flatMap((individuPublicId, departementIndex) =>
    dates.map((date, dateIndex) => ({
      indicateurPublicId,
      individuPublicId,
      date,
      valeur: baseValeur + departementIndex * step + dateIndex * (step / 2),
    })),
  )

const ind008Regions = [
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-11', date: '2024-06-01', valeur: 72.5 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-93', date: '2024-06-01', valeur: 68.3 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-84', date: '2024-06-01', valeur: 70.1 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-11', date: '2024-12-15', valeur: 73.2 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-93', date: '2024-12-15', valeur: 68.7 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-84', date: '2024-12-15', valeur: 70.8 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-11', date: '2025-01-01', valeur: 74.0 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-93', date: '2025-01-01', valeur: 69.0 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-84', date: '2025-01-01', valeur: 71.5 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-11', date: '2025-08-04', valeur: 75.1 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-93', date: '2025-08-04', valeur: 70.2 },
  { indicateurPublicId: 'IND-008', individuPublicId: 'REG-84', date: '2025-08-04', valeur: 72.6 },
] as const

export const valeursAvancementSeed = [
  ...buildDeptValeurs('IND-001', 7.5, 0.3, datesMensuelles2025),
  ...buildDeptValeurs('IND-002', 4.2, 0.1, datesAnnuelles),
  ...buildDeptValeurs('IND-003', 65.0, 1.5, datesTrimestrielles),
  ...buildDeptValeurs('IND-004', 21.0, 0.8, datesSemestrielles),
  ...buildDeptValeurs('IND-005', 1200.0, 30.0, datesIrregulieres),
  ...ind008Regions,
]
