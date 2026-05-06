export type ReferentielSeed = {
  publicId: string
  nom: string
  description: string | null
}

export type IndividuSeed = {
  publicId: string
  nom: string
  metadata: Record<string, unknown> | null
  referentiels: ReadonlyArray<string>
}

export type RelationSeed = {
  type: string
  parent: string
  child: string
}

export type ValeurAvancementSeed = {
  indicateurPublicId: string
  individuPublicId: string
  dateObservation: string
  valeur: string
}

export const referentielsSeed: ReadonlyArray<ReferentielSeed> = [
  {
    publicId: 'REF-national',
    nom: 'France (national)',
    description: "Référentiel national contenant l'unique individu FR.",
  },
  {
    publicId: 'REF-regions',
    nom: 'Régions de France',
    description: 'Régions administratives métropolitaines.',
  },
  {
    publicId: 'REF-departements',
    nom: 'Départements de France',
    description: 'Départements métropolitains (échantillon de seed).',
  },
]

export const individusSeed: ReadonlyArray<IndividuSeed> = [
  {
    publicId: 'FR',
    nom: 'France',
    metadata: { codeInsee: 'FR' },
    referentiels: ['REF-national'],
  },
  {
    publicId: 'Reg-11',
    nom: 'Île-de-France',
    metadata: { codeInsee: '11' },
    referentiels: ['REF-regions'],
  },
  {
    publicId: 'Reg-93',
    nom: 'Provence-Alpes-Côte d\'Azur',
    metadata: { codeInsee: '93' },
    referentiels: ['REF-regions'],
  },
  {
    publicId: 'Reg-84',
    nom: 'Auvergne-Rhône-Alpes',
    metadata: { codeInsee: '84' },
    referentiels: ['REF-regions'],
  },
  {
    publicId: 'Dept-75',
    nom: 'Paris',
    metadata: { codeInsee: '75' },
    referentiels: ['REF-departements'],
  },
  {
    publicId: 'Dept-77',
    nom: 'Seine-et-Marne',
    metadata: { codeInsee: '77' },
    referentiels: ['REF-departements'],
  },
  {
    publicId: 'Dept-78',
    nom: 'Yvelines',
    metadata: { codeInsee: '78' },
    referentiels: ['REF-departements'],
  },
  {
    publicId: 'Dept-13',
    nom: 'Bouches-du-Rhône',
    metadata: { codeInsee: '13' },
    referentiels: ['REF-departements'],
  },
  {
    publicId: 'Dept-83',
    nom: 'Var',
    metadata: { codeInsee: '83' },
    referentiels: ['REF-departements'],
  },
  {
    publicId: 'Dept-84',
    nom: 'Vaucluse',
    metadata: { codeInsee: '84' },
    referentiels: ['REF-departements'],
  },
  {
    publicId: 'Dept-06',
    nom: 'Alpes-Maritimes',
    metadata: { codeInsee: '06' },
    referentiels: ['REF-departements'],
  },
  {
    publicId: 'Dept-69',
    nom: 'Rhône',
    metadata: { codeInsee: '69' },
    referentiels: ['REF-departements'],
  },
  {
    publicId: 'Dept-38',
    nom: 'Isère',
    metadata: { codeInsee: '38' },
    referentiels: ['REF-departements'],
  },
  {
    publicId: 'Dept-73',
    nom: 'Savoie',
    metadata: { codeInsee: '73' },
    referentiels: ['REF-departements'],
  },
]

export const relationsSeed: ReadonlyArray<RelationSeed> = [
  { type: 'dept-in-region', parent: 'Reg-11', child: 'Dept-75' },
  { type: 'dept-in-region', parent: 'Reg-11', child: 'Dept-77' },
  { type: 'dept-in-region', parent: 'Reg-11', child: 'Dept-78' },
  { type: 'dept-in-region', parent: 'Reg-93', child: 'Dept-13' },
  { type: 'dept-in-region', parent: 'Reg-93', child: 'Dept-83' },
  { type: 'dept-in-region', parent: 'Reg-93', child: 'Dept-84' },
  { type: 'dept-in-region', parent: 'Reg-93', child: 'Dept-06' },
  { type: 'dept-in-region', parent: 'Reg-84', child: 'Dept-69' },
  { type: 'dept-in-region', parent: 'Reg-84', child: 'Dept-38' },
  { type: 'dept-in-region', parent: 'Reg-84', child: 'Dept-73' },
  { type: 'region-in-national', parent: 'FR', child: 'Reg-11' },
  { type: 'region-in-national', parent: 'FR', child: 'Reg-93' },
  { type: 'region-in-national', parent: 'FR', child: 'Reg-84' },
]

const departementsObserves = [
  'Dept-75',
  'Dept-77',
  'Dept-78',
  'Dept-13',
  'Dept-83',
  'Dept-84',
  'Dept-06',
  'Dept-69',
  'Dept-38',
  'Dept-73',
]

const datesObservation = ['2024-01-01', '2024-06-01', '2025-01-01']

const buildDeptValeurs = (
  indicateurPublicId: string,
  baseValeur: number,
  step: number,
): ReadonlyArray<ValeurAvancementSeed> =>
  departementsObserves.flatMap((individuPublicId, departementIndex) =>
    datesObservation.map((dateObservation, dateIndex) => ({
      indicateurPublicId,
      individuPublicId,
      dateObservation,
      valeur: (baseValeur + departementIndex * step + dateIndex * (step / 2)).toFixed(6),
    })),
  )

const ind008Regions: ReadonlyArray<ValeurAvancementSeed> = [
  { indicateurPublicId: 'IND-008', individuPublicId: 'Reg-11', dateObservation: '2024-06-01', valeur: '72.500000' },
  { indicateurPublicId: 'IND-008', individuPublicId: 'Reg-93', dateObservation: '2024-06-01', valeur: '68.300000' },
  { indicateurPublicId: 'IND-008', individuPublicId: 'Reg-84', dateObservation: '2024-06-01', valeur: '70.100000' },
  { indicateurPublicId: 'IND-008', individuPublicId: 'Reg-11', dateObservation: '2025-01-01', valeur: '74.000000' },
  { indicateurPublicId: 'IND-008', individuPublicId: 'Reg-93', dateObservation: '2025-01-01', valeur: '69.000000' },
  { indicateurPublicId: 'IND-008', individuPublicId: 'Reg-84', dateObservation: '2025-01-01', valeur: '71.500000' },
]

export const valeursAvancementSeed: ReadonlyArray<ValeurAvancementSeed> = [
  ...buildDeptValeurs('IND-001', 7.5, 0.3),
  ...buildDeptValeurs('IND-002', 4.2, 0.1),
  ...buildDeptValeurs('IND-003', 65.0, 1.5),
  ...buildDeptValeurs('IND-004', 21.0, 0.8),
  ...buildDeptValeurs('IND-005', 1200.0, 30.0),
  ...ind008Regions,
]
