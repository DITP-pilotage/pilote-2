export const referentielsSeed = [
  {
    publicId: 'REF-NAT',
    nom: 'France (national)',
    description: "Référentiel national contenant l'unique individu FR.",
  },
  {
    publicId: 'REF-REG',
    nom: 'Régions de France',
    description: 'Toutes les régions administratives françaises (métropole + DROM).',
  },
  {
    publicId: 'REF-DEPT',
    nom: 'Départements de France',
    description: 'Tous les départements français (métropole + DROM).',
  },
  {
    publicId: 'REF-EMPTY',
    nom: 'Référentiel sans population',
    description: 'Référentiel créé pour exercer le cas "aucun individu disponible".',
  },
] as const

// Régions INSEE : 13 métropole + 5 DROM = 18 régions.
const regions = [
  { code: '01', nom: 'Guadeloupe' },
  { code: '02', nom: 'Martinique' },
  { code: '03', nom: 'Guyane' },
  { code: '04', nom: 'La Réunion' },
  { code: '06', nom: 'Mayotte' },
  { code: '11', nom: 'Île-de-France' },
  { code: '24', nom: 'Centre-Val de Loire' },
  { code: '27', nom: 'Bourgogne-Franche-Comté' },
  { code: '28', nom: 'Normandie' },
  { code: '32', nom: 'Hauts-de-France' },
  { code: '44', nom: 'Grand Est' },
  { code: '52', nom: 'Pays de la Loire' },
  { code: '53', nom: 'Bretagne' },
  { code: '75', nom: 'Nouvelle-Aquitaine' },
  { code: '76', nom: 'Occitanie' },
  { code: '84', nom: 'Auvergne-Rhône-Alpes' },
  { code: '93', nom: "Provence-Alpes-Côte d'Azur" },
  { code: '94', nom: 'Corse' },
] as const

// Départements INSEE : 96 métropole + 5 DROM = 101 départements.
// Codes : 2A/2B pour la Corse, 971-976 pour les DROM, le reste numérique simple.
const departements = [
  { code: '01', nom: 'Ain', region: '84' },
  { code: '02', nom: 'Aisne', region: '32' },
  { code: '03', nom: 'Allier', region: '84' },
  { code: '04', nom: 'Alpes-de-Haute-Provence', region: '93' },
  { code: '05', nom: 'Hautes-Alpes', region: '93' },
  { code: '06', nom: 'Alpes-Maritimes', region: '93' },
  { code: '07', nom: 'Ardèche', region: '84' },
  { code: '08', nom: 'Ardennes', region: '44' },
  { code: '09', nom: 'Ariège', region: '76' },
  { code: '10', nom: 'Aube', region: '44' },
  { code: '11', nom: 'Aude', region: '76' },
  { code: '12', nom: 'Aveyron', region: '76' },
  { code: '13', nom: 'Bouches-du-Rhône', region: '93' },
  { code: '14', nom: 'Calvados', region: '28' },
  { code: '15', nom: 'Cantal', region: '84' },
  { code: '16', nom: 'Charente', region: '75' },
  { code: '17', nom: 'Charente-Maritime', region: '75' },
  { code: '18', nom: 'Cher', region: '24' },
  { code: '19', nom: 'Corrèze', region: '75' },
  { code: '21', nom: "Côte-d'Or", region: '27' },
  { code: '22', nom: "Côtes-d'Armor", region: '53' },
  { code: '23', nom: 'Creuse', region: '75' },
  { code: '24', nom: 'Dordogne', region: '75' },
  { code: '25', nom: 'Doubs', region: '27' },
  { code: '26', nom: 'Drôme', region: '84' },
  { code: '27', nom: 'Eure', region: '28' },
  { code: '28', nom: 'Eure-et-Loir', region: '24' },
  { code: '29', nom: 'Finistère', region: '53' },
  { code: '2A', nom: 'Corse-du-Sud', region: '94' },
  { code: '2B', nom: 'Haute-Corse', region: '94' },
  { code: '30', nom: 'Gard', region: '76' },
  { code: '31', nom: 'Haute-Garonne', region: '76' },
  { code: '32', nom: 'Gers', region: '76' },
  { code: '33', nom: 'Gironde', region: '75' },
  { code: '34', nom: 'Hérault', region: '76' },
  { code: '35', nom: 'Ille-et-Vilaine', region: '53' },
  { code: '36', nom: 'Indre', region: '24' },
  { code: '37', nom: 'Indre-et-Loire', region: '24' },
  { code: '38', nom: 'Isère', region: '84' },
  { code: '39', nom: 'Jura', region: '27' },
  { code: '40', nom: 'Landes', region: '75' },
  { code: '41', nom: 'Loir-et-Cher', region: '24' },
  { code: '42', nom: 'Loire', region: '84' },
  { code: '43', nom: 'Haute-Loire', region: '84' },
  { code: '44', nom: 'Loire-Atlantique', region: '52' },
  { code: '45', nom: 'Loiret', region: '24' },
  { code: '46', nom: 'Lot', region: '76' },
  { code: '47', nom: 'Lot-et-Garonne', region: '75' },
  { code: '48', nom: 'Lozère', region: '76' },
  { code: '49', nom: 'Maine-et-Loire', region: '52' },
  { code: '50', nom: 'Manche', region: '28' },
  { code: '51', nom: 'Marne', region: '44' },
  { code: '52', nom: 'Haute-Marne', region: '44' },
  { code: '53', nom: 'Mayenne', region: '52' },
  { code: '54', nom: 'Meurthe-et-Moselle', region: '44' },
  { code: '55', nom: 'Meuse', region: '44' },
  { code: '56', nom: 'Morbihan', region: '53' },
  { code: '57', nom: 'Moselle', region: '44' },
  { code: '58', nom: 'Nièvre', region: '27' },
  { code: '59', nom: 'Nord', region: '32' },
  { code: '60', nom: 'Oise', region: '32' },
  { code: '61', nom: 'Orne', region: '28' },
  { code: '62', nom: 'Pas-de-Calais', region: '32' },
  { code: '63', nom: 'Puy-de-Dôme', region: '84' },
  { code: '64', nom: 'Pyrénées-Atlantiques', region: '75' },
  { code: '65', nom: 'Hautes-Pyrénées', region: '76' },
  { code: '66', nom: 'Pyrénées-Orientales', region: '76' },
  { code: '67', nom: 'Bas-Rhin', region: '44' },
  { code: '68', nom: 'Haut-Rhin', region: '44' },
  { code: '69', nom: 'Rhône', region: '84' },
  { code: '70', nom: 'Haute-Saône', region: '27' },
  { code: '71', nom: 'Saône-et-Loire', region: '27' },
  { code: '72', nom: 'Sarthe', region: '52' },
  { code: '73', nom: 'Savoie', region: '84' },
  { code: '74', nom: 'Haute-Savoie', region: '84' },
  { code: '75', nom: 'Paris', region: '11' },
  { code: '76', nom: 'Seine-Maritime', region: '28' },
  { code: '77', nom: 'Seine-et-Marne', region: '11' },
  { code: '78', nom: 'Yvelines', region: '11' },
  { code: '79', nom: 'Deux-Sèvres', region: '75' },
  { code: '80', nom: 'Somme', region: '32' },
  { code: '81', nom: 'Tarn', region: '76' },
  { code: '82', nom: 'Tarn-et-Garonne', region: '76' },
  { code: '83', nom: 'Var', region: '93' },
  { code: '84', nom: 'Vaucluse', region: '93' },
  { code: '85', nom: 'Vendée', region: '52' },
  { code: '86', nom: 'Vienne', region: '75' },
  { code: '87', nom: 'Haute-Vienne', region: '75' },
  { code: '88', nom: 'Vosges', region: '44' },
  { code: '89', nom: 'Yonne', region: '27' },
  { code: '90', nom: 'Territoire de Belfort', region: '27' },
  { code: '91', nom: 'Essonne', region: '11' },
  { code: '92', nom: 'Hauts-de-Seine', region: '11' },
  { code: '93', nom: 'Seine-Saint-Denis', region: '11' },
  { code: '94', nom: 'Val-de-Marne', region: '11' },
  { code: '95', nom: "Val-d'Oise", region: '11' },
  { code: '971', nom: 'Guadeloupe', region: '01' },
  { code: '972', nom: 'Martinique', region: '02' },
  { code: '973', nom: 'Guyane', region: '03' },
  { code: '974', nom: 'La Réunion', region: '04' },
  { code: '976', nom: 'Mayotte', region: '06' },
] as const

export const individusSeed: ReadonlyArray<{
  publicId: string
  nom: string
  referentiel: 'REF-NAT' | 'REF-REG' | 'REF-DEPT'
  metadata: Record<string, unknown> | null
}> = [
  { publicId: 'FR', nom: 'France', referentiel: 'REF-NAT', metadata: null },
  ...regions.map((r) => ({
    publicId: `REG-${r.code}`,
    nom: r.nom,
    referentiel: 'REF-REG' as const,
    metadata: { codeInsee: r.code },
  })),
  ...departements.map((d) => ({
    publicId: `DEPT-${d.code}`,
    nom: d.nom,
    referentiel: 'REF-DEPT' as const,
    metadata: { codeInsee: d.code },
  })),
]

export const relationsSeed = [
  ...regions.map((r) => ({ parent: 'FR', child: `REG-${r.code}` })),
  ...departements.map((d) => ({ parent: `REG-${d.region}`, child: `DEPT-${d.code}` })),
]

// Plage temporelle des séries simulées. 36 mois = 3 années couvertes.
const PREMIERE_DATE = '2023-01-01'
const NB_MOIS = 36

const mois = Array.from({ length: NB_MOIS }, (_, i) => {
  const date = new Date(`${PREMIERE_DATE}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + i)
  return date.toISOString().slice(0, 10)
})
const annees = mois.filter((d) => d.endsWith('-01-01'))

// Politique de fréquence demandée : "max tous les mois, min tous les ans".
// Donc chaque indicateur est soit mensuel, soit annuel. Alternance déterministe
// basée sur le rang de son publicId (IND-001 mensuel, IND-002 annuel, ...).
export type FrequenceSeed = 'mensuelle' | 'annuelle'
export const frequencePourIndicateur = (indicateurPublicId: string): FrequenceSeed => {
  const match = /(\d+)$/.exec(indicateurPublicId)
  const rang = match ? parseInt(match[1]!, 10) : 0
  return rang % 2 === 1 ? 'mensuelle' : 'annuelle'
}

const datesPourFrequence = (frequence: FrequenceSeed) => (frequence === 'mensuelle' ? mois : annees)

// Valeur déterministe combinant baseValeur, tendance (linéaire sur la plage),
// oscillation sinusoïdale et offset par individu. Reproductible (aucun random)
// pour garantir un seed stable.
const computeValeur = ({
  baseValeur,
  amplitude,
  trend,
  ratio,
  individuIndex,
  dateIndex,
  decimals,
}: {
  baseValeur: number
  amplitude: number
  trend: number
  ratio: number
  individuIndex: number
  dateIndex: number
  decimals: number
}): number => {
  const offsetIndividu =
    Math.sin(individuIndex * 0.91 + 1.7) * amplitude * 0.45 +
    Math.cos(individuIndex * 2.13) * amplitude * 0.25
  const oscillation = Math.sin((dateIndex + individuIndex * 0.3) * 0.9) * amplitude * 0.4
  const valeur = baseValeur + offsetIndividu + trend * ratio + oscillation
  const facteur = 10 ** decimals
  return Math.round(valeur * facteur) / facteur
}

// Profils variés (base/amplitude/trend/decimals) par modulo : 5 profils tournent
// sur les 50 indicateurs pour que les graphes ne soient pas tous identiques.
const profils = [
  { baseValeur: 7.5, amplitude: 1.2, trend: 0.4, decimals: 2 },
  { baseValeur: 720_000, amplitude: 120_000, trend: 90_000, decimals: 0 },
  { baseValeur: 82.5, amplitude: 1.8, trend: 0.9, decimals: 2 },
  { baseValeur: 13.5, amplitude: 3.5, trend: -1.4, decimals: 2 },
  { baseValeur: 1200, amplitude: 60, trend: 25, decimals: 0 },
] as const

// Profil dédié pour les indicateurs en pourcentage : borné par construction
// dans [0, 100] (base 70, amplitudes choisies pour ne pas déborder).
const PROFIL_TAUX_POURCENTAGE = {
  baseValeur: 70,
  amplitude: 12,
  trend: 4,
  decimals: 1,
} as const

// Indicateurs dont la valeur représente un pourcentage : on force un profil
// borné 0-100 plutôt qu'un profil cyclique générique (où IND-001 / IND-049
// auraient hérité de bases à 720k / 1200 — non sensé pour un taux).
const INDICATEURS_TAUX_POURCENTAGE = new Set<string>([
  'IND-001', // Taux de chômage
  'IND-010', // Taux de vaccination infantile
  'IND-011', // Accès aux soins de proximité
  'IND-012', // Couverture des services France Santé
  'IND-014', // Amélioration de l'orientation des élèves (indice 0-100)
  'IND-015', // Taux de réussite au baccalauréat
  'IND-020', // Qualité de l'air en zones urbaines (indice 0-100)
  'IND-026', // Présence postale en zone rurale (couverture %)
  'IND-028', // Désertification médicale
  'IND-030', // Élucidation des cambriolages
  'IND-038', // Taux d'emploi des seniors
  'IND-039', // Taux d'emploi des jeunes
  'IND-043', // Couverture 5G du territoire
  'IND-044', // Dématérialisation des démarches
  'IND-048', // Pauvreté
  'IND-049', // Taux d'alphabétisation
  'IND-050', // Accès à internet haut débit
])

const profilPourIndicateur = (indicateurPublicId: string) => {
  if (INDICATEURS_TAUX_POURCENTAGE.has(indicateurPublicId)) return PROFIL_TAUX_POURCENTAGE
  const match = /(\d+)$/.exec(indicateurPublicId)
  const rang = match ? parseInt(match[1]!, 10) : 0
  return profils[rang % profils.length]!
}

const clamp = (valeur: number, min: number, max: number): number =>
  Math.min(Math.max(valeur, min), max)

// Génère la série d'un indicateur sur la maille fournie. La maille = liste de
// publicIds d'individus sur lesquels on saisit (typiquement les 101 dépts, ou
// les 18 régions pour les indicateurs sans lien départemental).
export const buildValeursPourIndicateur = ({
  indicateurPublicId,
  individuPublicIds,
}: {
  indicateurPublicId: string
  individuPublicIds: ReadonlyArray<string>
}): ReadonlyArray<{
  indicateurPublicId: string
  individuPublicId: string
  date: string
  valeur: number
}> => {
  const frequence = frequencePourIndicateur(indicateurPublicId)
  const dates = datesPourFrequence(frequence)
  const profil = profilPourIndicateur(indicateurPublicId)
  const estTauxPourcentage = INDICATEURS_TAUX_POURCENTAGE.has(indicateurPublicId)
  const lastIndex = Math.max(dates.length - 1, 1)
  return individuPublicIds.flatMap((individuPublicId, individuIndex) =>
    dates.map((date, dateIndex) => {
      const valeurBrute = computeValeur({
        ...profil,
        ratio: dateIndex / lastIndex,
        individuIndex,
        dateIndex,
      })
      // Filet de sécurité : la combinaison oscillation+offset+trend pourrait
      // théoriquement déborder pour les taux ; on garantit [0, 100].
      const valeur = estTauxPourcentage ? clamp(valeurBrute, 0, 100) : valeurBrute
      return { indicateurPublicId, individuPublicId, date, valeur }
    }),
  )
}

// Dates-cibles annuelles pour les objectifs d'avancement.
const OBJECTIF_DATES = ['2024-01-01', '2025-01-01', '2026-01-01'] as const

// Génère 3 objectifs annuels (2024, 2025, 2026) pour un indicateur et une liste
// d'individus. La cible est calculée avec la même mécanique que les valeurs mais
// une tendance amplifiée (+50 %) pour représenter une ambition réaliste.
export const buildObjectifsPourIndicateur = ({
  indicateurPublicId,
  individuPublicIds,
}: {
  indicateurPublicId: string
  individuPublicIds: ReadonlyArray<string>
}): ReadonlyArray<{
  indicateurPublicId: string
  individuPublicId: string
  dateCible: string
  valeurCible: number
}> => {
  const profil = profilPourIndicateur(indicateurPublicId)
  const estTauxPourcentage = INDICATEURS_TAUX_POURCENTAGE.has(indicateurPublicId)
  const lastIndex = Math.max(OBJECTIF_DATES.length - 1, 1)
  return individuPublicIds.flatMap((individuPublicId, individuIndex) =>
    OBJECTIF_DATES.map((dateCible, dateIndex) => {
      const valeurBrute = computeValeur({
        ...profil,
        trend: profil.trend * 1.5,
        ratio: dateIndex / lastIndex,
        individuIndex,
        dateIndex,
      })
      const valeurCible = estTauxPourcentage ? clamp(valeurBrute, 0, 100) : valeurBrute
      return { indicateurPublicId, individuPublicId, dateCible, valeurCible }
    }),
  )
}
