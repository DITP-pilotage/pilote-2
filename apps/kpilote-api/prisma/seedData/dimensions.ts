import { type PeriodeMiseAJour, type UniteIndicateurCode } from '@pilote/kpilote-shared/indicateur'

import { type FonctionAgregation } from '../../src/generated/prisma/enums.js'

import { individusSeed } from './geo.js'

// Jeux de démonstration multi-dimension (POC dimensions, cf.
// docs/architecture/dimensions-design.md). Tout est déclaré en base par le seed :
// dimensions, niveaux, membres, configuration par indicateur. L'API ne lit aucun
// registre TS à l'exécution.
//
// Comme pour seedData/geo.ts, les valeurs sont déterministes (aucun random) :
// les clés produites sont identiques d'un seed à l'autre.

// Une dimension est rattachée à un référentiel « ancre ». Si l'ancre existe déjà
// (base migrée), c'est sa dimension qui est renommée : la migration a pu créer
// la dimension sous un nom automatique (ex. DIM-NAT), et des coordonnées de
// cellules la référencent déjà — on ne réaffecte jamais un référentiel.
export const dimensionsSeed: ReadonlyArray<{
  publicId: string
  nom: string
  description: string
  referentielAncre: string
}> = [
  {
    publicId: 'DIM-TERRITOIRE',
    nom: 'Territoire',
    description: 'Découpage administratif : national, régions, départements.',
    referentielAncre: 'REF-DEPT',
  },
  {
    publicId: 'DIM-EMPTY',
    nom: 'Dimension sans population',
    description: 'Dimension du référentiel vide (cas « aucun individu disponible »).',
    referentielAncre: 'REF-EMPTY',
  },
  {
    publicId: 'DIM-OPERATEUR',
    nom: 'Opérateur',
    description: 'Opérateurs de réseau fibre (sans hiérarchie).',
    referentielAncre: 'REF-OPERATEUR',
  },
  {
    publicId: 'DIM-FRAUDE',
    nom: 'Type de fraude',
    description: 'Familles de fraude fiscale et leurs types.',
    referentielAncre: 'REF-FRAUDE-TYPE',
  },
]

export const referentielsDimensionsSeed: ReadonlyArray<{
  publicId: string
  nom: string
  description: string
  dimension: string
}> = [
  {
    publicId: 'REF-OPERATEUR',
    nom: 'Opérateurs fibre',
    description: 'Opérateurs commerciaux de réseau fibre (FttH).',
    dimension: 'DIM-OPERATEUR',
  },
  {
    publicId: 'REF-FRAUDE-FAMILLE',
    nom: 'Familles de fraude',
    description: 'Familles de fraude fiscale (TVA, impôt sur les sociétés, impôt sur le revenu).',
    dimension: 'DIM-FRAUDE',
  },
  {
    publicId: 'REF-FRAUDE-TYPE',
    nom: 'Types de fraude',
    description: 'Types de fraude fiscale, rattachés à leur famille.',
    dimension: 'DIM-FRAUDE',
  },
]

// `part` : part de marché indicative ; `croissance` : progression mensuelle
// relative ; `ambition` : objectif rapporté à la tendance (< 1 : l'opérateur
// dépasse ses objectifs, ce qui exerce le plafond à 100 % du taux).
const operateurs = [
  {
    publicId: 'OP-ORANGE',
    nom: 'Orange',
    indicateur: 'IND-111',
    part: 0.36,
    croissance: 0.009,
    ambition: 1.12,
  },
  {
    publicId: 'OP-SFR',
    nom: 'SFR',
    indicateur: 'IND-112',
    part: 0.24,
    croissance: 0.007,
    ambition: 1.2,
  },
  {
    publicId: 'OP-FREE',
    nom: 'Free',
    indicateur: 'IND-113',
    part: 0.2,
    croissance: 0.014,
    ambition: 0.9,
  },
  {
    publicId: 'OP-BOUYGUES',
    nom: 'Bouygues Telecom',
    indicateur: 'IND-114',
    part: 0.16,
    croissance: 0.01,
    ambition: 1.25,
  },
  {
    publicId: 'OP-REGIONAL',
    nom: 'Opérateur régional',
    indicateur: 'IND-115',
    part: 0.1,
    croissance: 0.018,
    ambition: 1.05,
  },
] as const

const famillesFraude = [
  { publicId: 'FRAUDE-TVA', nom: 'Fraude à la TVA' },
  { publicId: 'FRAUDE-IS', nom: "Fraude à l'impôt sur les sociétés" },
  { publicId: 'FRAUDE-IR', nom: "Fraude à l'impôt sur le revenu" },
] as const

// IS-NON-VENTILE : membre feuille explicite pour le « non ventilé » (cf.
// dimensions-design.md §5.5), plutôt qu'une saisie sur la famille.
const typesFraude = [
  { publicId: 'TVA-CARROUSEL', nom: 'Carrousel de TVA', famille: 'FRAUDE-TVA', montant: 420_000 },
  { publicId: 'TVA-FACTURES', nom: 'Fausses factures', famille: 'FRAUDE-TVA', montant: 85_000 },
  {
    publicId: 'IS-MINORATION',
    nom: 'Minoration du résultat imposable',
    famille: 'FRAUDE-IS',
    montant: 160_000,
  },
  { publicId: 'IS-NON-VENTILE', nom: 'IS — non ventilé', famille: 'FRAUDE-IS', montant: 60_000 },
  { publicId: 'IR-REVENUS', nom: 'Revenus dissimulés', famille: 'FRAUDE-IR', montant: 35_000 },
] as const

export const individusDimensionsSeed: ReadonlyArray<{
  publicId: string
  nom: string
  referentiel: string
}> = [
  ...operateurs.map((o) => ({ publicId: o.publicId, nom: o.nom, referentiel: 'REF-OPERATEUR' })),
  ...famillesFraude.map((f) => ({ ...f, referentiel: 'REF-FRAUDE-FAMILLE' })),
  ...typesFraude.map((t) => ({
    publicId: t.publicId,
    nom: t.nom,
    referentiel: 'REF-FRAUDE-TYPE',
  })),
]

// Hiérarchie famille → type, au sein de la même dimension (Type de fraude).
export const relationsDimensionsSeed: ReadonlyArray<{ parent: string; child: string }> =
  typesFraude.map((t) => ({ parent: t.famille, child: t.publicId }))

export type IndicateurDimensionsSeed = {
  publicId: string
  nom: string
  visibilite: 'PUBLIC' | 'PRIVE'
  unite: UniteIndicateurCode
  description: string
  methodeCalcul?: string
  periodeMiseAJour: PeriodeMiseAJour
  jourMiseAJour?: number
  // Niveaux déclarés (fonction de remontée par référentiel).
  referentiels: ReadonlyArray<{ id: string; fonctionAgregation: FonctionAgregation }>
  // Configuration par dimension : ordre d'éclatement, fonction de la marginale,
  // sous-cube des objectifs.
  dimensions: ReadonlyArray<{
    dimension: string
    ordre: number
    fonctionAgregation: FonctionAgregation
    porteObjectifs: boolean
  }>
}

const NIVEAUX_TERRITOIRE_SUM = [
  { id: 'REF-DEPT', fonctionAgregation: 'NONE' },
  { id: 'REF-REG', fonctionAgregation: 'SUM' },
  { id: 'REF-NAT', fonctionAgregation: 'SUM' },
] as const

export const indicateursDimensionsSeed: ReadonlyArray<IndicateurDimensionsSeed> = [
  // Territoire × Opérateur, tout en SUM. Objectifs au grain territoire seul :
  // taux(DEPT-xx) = Σ opérateurs / objectif(DEPT-xx).
  {
    publicId: 'IND-101',
    nom: 'Lignes fibre raccordées',
    visibilite: 'PUBLIC',
    unite: 'VALEUR_UNITAIRE',
    description:
      'Nombre de lignes FttH raccordées, ventilé par territoire et par opérateur commercial.',
    methodeCalcul: 'Cumul des raccordements déclarés par les opérateurs',
    periodeMiseAJour: 'MENSUELLE',
    jourMiseAJour: 10,
    referentiels: [...NIVEAUX_TERRITOIRE_SUM, { id: 'REF-OPERATEUR', fonctionAgregation: 'NONE' }],
    dimensions: [
      { dimension: 'DIM-TERRITOIRE', ordre: 0, fonctionAgregation: 'SUM', porteObjectifs: true },
      { dimension: 'DIM-OPERATEUR', ordre: 1, fonctionAgregation: 'SUM', porteObjectifs: false },
    ],
  },
  // Cas piégeux : fonctions différentes selon la dimension. Territoire en AVG
  // (niveaux et marginale), Type en SUM (famille et marginale). L'ordre
  // (Territoire 0, Type 1) fixe le chemin : la marginale nationale est la
  // moyenne des régions, chacune moyenne de ses départements, chacun somme de
  // ses types. Pas d'objectif : un montant moyen ne se pilote pas par une cible
  // additive, et la combinaison AVG/SUM rendrait la cible nationale illisible.
  {
    publicId: 'IND-102',
    nom: 'Montant moyen redressé par dossier',
    visibilite: 'PUBLIC',
    unite: 'EURO',
    description:
      'Montant moyen redressé par dossier de contrôle fiscal, par type de fraude et par territoire.',
    methodeCalcul: 'Montants redressés / nombre de dossiers clos sur le mois',
    periodeMiseAJour: 'MENSUELLE',
    jourMiseAJour: 20,
    referentiels: [
      { id: 'REF-DEPT', fonctionAgregation: 'NONE' },
      { id: 'REF-REG', fonctionAgregation: 'AVG' },
      { id: 'REF-NAT', fonctionAgregation: 'AVG' },
      { id: 'REF-FRAUDE-TYPE', fonctionAgregation: 'NONE' },
      { id: 'REF-FRAUDE-FAMILLE', fonctionAgregation: 'SUM' },
    ],
    dimensions: [
      { dimension: 'DIM-TERRITOIRE', ordre: 0, fonctionAgregation: 'AVG', porteObjectifs: true },
      { dimension: 'DIM-FRAUDE', ordre: 1, fonctionAgregation: 'SUM', porteObjectifs: false },
    ],
  },
  // Contournement historique : un indicateur mono-territoire par opérateur, aux
  // valeurs exactement égales à IND-101 restreint à l'opérateur.
  ...operateurs.map((o): IndicateurDimensionsSeed => ({
    publicId: o.indicateur,
    nom: `Lignes fibre raccordées — ${o.nom}`,
    visibilite: 'PUBLIC',
    unite: 'VALEUR_UNITAIRE',
    description: `Lignes FttH raccordées par ${o.nom} (contournement historique : un indicateur par opérateur).`,
    periodeMiseAJour: 'MENSUELLE',
    jourMiseAJour: 10,
    referentiels: NIVEAUX_TERRITOIRE_SUM,
    dimensions: [
      { dimension: 'DIM-TERRITOIRE', ordre: 0, fonctionAgregation: 'SUM', porteObjectifs: true },
    ],
  })),
]

export const collectionsDimensionsSeed: ReadonlyArray<{
  publicId: string
  nom: string
  description: string
  visibilite: 'PUBLIC' | 'PRIVE'
  indicateurPublicIds: ReadonlyArray<string>
}> = [
  {
    publicId: 'COL-010',
    nom: 'Fibre par opérateur (contournement historique)',
    description:
      'Un indicateur par opérateur, regroupés en collection : la collection moyenne les taux, sans additionner les valeurs. Remplacé par IND-101 (dimension Opérateur).',
    visibilite: 'PUBLIC',
    indicateurPublicIds: operateurs.map((o) => o.indicateur),
  },
  {
    publicId: 'COL-011',
    nom: 'Numérique — mixte',
    description:
      'Collection mixte : un indicateur multi-dimension (IND-101) et un indicateur mono-territoire (IND-003).',
    visibilite: 'PUBLIC',
    indicateurPublicIds: ['IND-101', 'IND-003'],
  },
]

// Cloisonnement : un contributeur d'opérateur ne saisit que sur son opérateur.
export const permissionsCloisonneesSeed: ReadonlyArray<{
  email: string
  indicateurPublicId: string
  action: 'READ' | 'WRITE_DATA'
  perimetre: ReadonlyArray<string> | null
}> = [
  {
    email: 'operateur.orange@example.com',
    indicateurPublicId: 'IND-101',
    action: 'READ',
    perimetre: null,
  },
  {
    email: 'operateur.orange@example.com',
    indicateurPublicId: 'IND-101',
    action: 'WRITE_DATA',
    perimetre: ['OP-ORANGE'],
  },
]

// ── Faits ────────────────────────────────────────────────────────────────────

// 30 mois (2024-01 → 2026-06), plus que les 24 demandés.
const PREMIER_MOIS = '2024-01-01'
const NB_MOIS = 30

const mois = Array.from({ length: NB_MOIS }, (_, i) => {
  const date = new Date(`${PREMIER_MOIS}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + i)
  return date.toISOString().slice(0, 10)
})

// Objectifs annuels de fin d'année. `moisIndex` situe l'échéance sur la même
// échelle que les valeurs (35 = décembre 2026, au-delà de la dernière valeur :
// la tendance est simplement prolongée).
const OBJECTIFS_ANNUELS = [
  { dateCible: '2024-12-31', moisIndex: 11 },
  { dateCible: '2025-12-31', moisIndex: 23 },
  { dateCible: '2026-12-31', moisIndex: 35 },
] as const

const departements = individusSeed
  .filter((i) => i.referentiel === 'REF-DEPT')
  .map((i) => i.publicId)

const DROM = new Set(['DEPT-971', 'DEPT-972', 'DEPT-973', 'DEPT-974', 'DEPT-976'])

// Cube creux : l'opérateur régional n'est présent que dans une dizaine de
// départements, Free est absent des DROM ; les autres opérateurs sont partout.
const DEPARTEMENTS_OPERATEUR_REGIONAL = new Set([
  'DEPT-22',
  'DEPT-29',
  'DEPT-35',
  'DEPT-56',
  'DEPT-57',
  'DEPT-67',
  'DEPT-68',
  'DEPT-31',
  'DEPT-34',
  'DEPT-2A',
])

const operateurPresent = ({
  operateur,
  departement,
}: {
  operateur: string
  departement: string
}): boolean => {
  if (operateur === 'OP-REGIONAL') return DEPARTEMENTS_OPERATEUR_REGIONAL.has(departement)
  if (operateur === 'OP-FREE') return !DROM.has(departement)
  return true
}

// Taille du parc d'un département (≈ 4 000 à 40 000 lignes), déterministe.
const tailleDepartement = (departementIndex: number): number =>
  4000 +
  36_000 * (0.5 + 0.5 * Math.sin(departementIndex * 1.91 + 0.7) * Math.cos(departementIndex * 0.37))

// Croissance linéaire + légère oscillation (bornée sous la pente : la série
// reste croissante, comme un cumul de raccordements).
const lignesFibre = ({
  departementIndex,
  operateurIndex,
  moisIndex,
}: {
  departementIndex: number
  operateurIndex: number
  moisIndex: number
}): number => {
  const operateur = operateurs[operateurIndex]!
  const oscillation = 0.003 * Math.sin((moisIndex + departementIndex * 0.5 + operateurIndex) * 0.8)
  return Math.round(
    tailleDepartement(departementIndex) *
      operateur.part *
      (1 + operateur.croissance * moisIndex + oscillation),
  )
}

const ambition = ({
  departementIndex,
  operateurIndex,
}: {
  departementIndex: number
  operateurIndex: number
}): number =>
  operateurs[operateurIndex]!.ambition + 0.04 * Math.sin(departementIndex * 1.3 + operateurIndex)

// Fraude : TVA-CARROUSEL absent des DROM et de la Corse, IS-NON-VENTILE absent
// d'un département sur quatre (cube creux léger).
const typeFraudePresent = ({
  type,
  departement,
  departementIndex,
}: {
  type: string
  departement: string
  departementIndex: number
}): boolean => {
  if (type === 'TVA-CARROUSEL') {
    return !DROM.has(departement) && departement !== 'DEPT-2A' && departement !== 'DEPT-2B'
  }
  if (type === 'IS-NON-VENTILE') return departementIndex % 4 !== 0
  return true
}

const montantMoyenRedresse = ({
  departementIndex,
  typeIndex,
  moisIndex,
}: {
  departementIndex: number
  typeIndex: number
  moisIndex: number
}): number => {
  const type = typesFraude[typeIndex]!
  const facteurDepartement = 0.75 + 0.5 * (0.5 + 0.5 * Math.sin(departementIndex * 2.3 + typeIndex))
  const evolution =
    1 + 0.08 * Math.sin((moisIndex + departementIndex) * 0.6 + typeIndex) + 0.004 * moisIndex
  return Math.round(type.montant * facteurDepartement * evolution)
}

export type FaitSeed = {
  indicateurPublicId: string
  // publicIds des membres (au plus un par dimension) — la cellule.
  membres: ReadonlyArray<string>
  date: string
  valeur: number
}

export const buildFaitsDimensions = (): {
  valeurs: ReadonlyArray<FaitSeed>
  objectifs: ReadonlyArray<FaitSeed>
} => {
  const valeurs: FaitSeed[] = []
  const objectifs: FaitSeed[] = []

  for (const [departementIndex, departement] of departements.entries()) {
    // Fibre : IND-101 au grain (DEPT, opérateur), et la même valeur sur
    // l'indicateur de contournement de l'opérateur (IND-111..115).
    const objectifDepartement = new Map<string, number>()
    for (const [operateurIndex, operateur] of operateurs.entries()) {
      if (!operateurPresent({ operateur: operateur.publicId, departement })) continue
      for (const [moisIndex, date] of mois.entries()) {
        const valeur = lignesFibre({ departementIndex, operateurIndex, moisIndex })
        valeurs.push(
          {
            indicateurPublicId: 'IND-101',
            membres: [departement, operateur.publicId],
            date,
            valeur,
          },
          { indicateurPublicId: operateur.indicateur, membres: [departement], date, valeur },
        )
      }
      // Objectif par opérateur (contournement) ; l'objectif IND-101 du
      // département en est la somme, au grain territoire seul.
      for (const { dateCible, moisIndex } of OBJECTIFS_ANNUELS) {
        const valeur = Math.round(
          lignesFibre({ departementIndex, operateurIndex, moisIndex }) *
            ambition({ departementIndex, operateurIndex }),
        )
        objectifs.push({
          indicateurPublicId: operateur.indicateur,
          membres: [departement],
          date: dateCible,
          valeur,
        })
        objectifDepartement.set(dateCible, (objectifDepartement.get(dateCible) ?? 0) + valeur)
      }
    }
    for (const [dateCible, valeur] of objectifDepartement) {
      objectifs.push({
        indicateurPublicId: 'IND-101',
        membres: [departement],
        date: dateCible,
        valeur,
      })
    }

    // Fraude : IND-102 au grain (DEPT, type feuille).
    for (const [typeIndex, type] of typesFraude.entries()) {
      if (!typeFraudePresent({ type: type.publicId, departement, departementIndex })) continue
      for (const [moisIndex, date] of mois.entries()) {
        valeurs.push({
          indicateurPublicId: 'IND-102',
          membres: [departement, type.publicId],
          date,
          valeur: montantMoyenRedresse({ departementIndex, typeIndex, moisIndex }),
        })
      }
    }
  }
  return { valeurs, objectifs }
}
