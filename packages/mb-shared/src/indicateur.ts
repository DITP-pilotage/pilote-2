import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { indicateurPublicIdSchema, referentielPublicIdSchema } from './publicIds'
import { responsableApiModelSchema } from './responsable'

export const indicateurVisibiliteSchema = z
  .enum(['PUBLIC', 'PRIVE'])
  .describe(
    "Visibilité de l'indicateur. PUBLIC : accessible en lecture à tout principal authentifié. PRIVE : accessible uniquement aux principals disposant d'une permission explicite.",
  )
export type IndicateurVisibilite = z.infer<typeof indicateurVisibiliteSchema>

export const fonctionAgregationSchema = z
  .enum(['SUM', 'AVG', 'NONE'])
  .describe(
    "Fonction d'agrégation appliquée pour calculer la valeur d'un parent à partir des valeurs " +
      'de ses enfants. `SUM` = somme des contributions des enfants. `AVG` = moyenne arithmétique ' +
      "simple (non pondérée) des contributions connues. `NONE` = pas d'agrégation : la valeur doit " +
      "être saisie directement pour ce référentiel, elle n'est jamais dérivée depuis les enfants.",
  )
export type FonctionAgregation = z.infer<typeof fonctionAgregationSchema>

// Catalogue plateforme des unités, ordonné par famille (numéraires, durée,
// spatiales, taux, monétaires, autres) pour un affichage groupé dans les
// sélecteurs. Catalogue fermé, étendu par déploiement.
export const UNITES_INDICATEUR = [
  // Numéraires
  'VALEUR_UNITAIRE',
  'MILLIONS',
  'ETP',
  'ETPT',
  // Durée
  'HEURES',
  'MINUTES',
  'JOURS',
  'MOIS',
  'ANNEES',
  // Spatiales
  'HECTARES',
  'METRE',
  'KILOMETRE',
  'METRE_CARRE',
  'KILOMETRE_CARRE',
  // Taux
  'POINTS',
  'POURCENTAGE',
  // Monétaires
  'EURO',
  'MILLIONS_EUROS',
  'MILLIARDS_EUROS',
  // Autres
  'MEGAWATT',
  'GIGAWATT',
  'TONNES',
  'TONNES_CO2',
  'TERAWATT',
  'LITRES',
  'ELEVES',
  'CLASSES',
  'REPAS',
] as const
export type UniteIndicateurCode = (typeof UNITES_INDICATEUR)[number]

export const uniteIndicateurCodeSchema = z
  .enum(UNITES_INDICATEUR)
  .describe(
    "Code de l'unité de mesure de l'indicateur. Catalogue plateforme, fermé, étendu par déploiement.",
  )

// `abbreviation: null` = unité sans symbole à suffixer (compte brut, ex.
// « Valeur unitaire »). Les unités « mots » (élèves, classes, repas) portent le
// mot en abréviation pour rester lisibles suffixées à une valeur.
export const UNITES_INDICATEUR_CONFIG = {
  // Numéraires
  VALEUR_UNITAIRE: { libelle: 'Valeur unitaire', abbreviation: null },
  MILLIONS: { libelle: 'Millions', abbreviation: 'M' },
  ETP: { libelle: 'ETP', abbreviation: 'ETP' },
  ETPT: { libelle: 'ETPT', abbreviation: 'ETPT' },
  // Durée
  HEURES: { libelle: 'Heures', abbreviation: 'h' },
  MINUTES: { libelle: 'Minutes', abbreviation: 'min' },
  JOURS: { libelle: 'Jours', abbreviation: 'j' },
  MOIS: { libelle: 'Mois', abbreviation: 'mois' },
  ANNEES: { libelle: 'Années', abbreviation: 'ans' },
  // Spatiales
  HECTARES: { libelle: 'Hectares', abbreviation: 'ha' },
  METRE: { libelle: 'Mètre', abbreviation: 'm' },
  KILOMETRE: { libelle: 'Kilomètre', abbreviation: 'km' },
  METRE_CARRE: { libelle: 'Mètre carré', abbreviation: 'm²' },
  KILOMETRE_CARRE: { libelle: 'Kilomètre carré', abbreviation: 'km²' },
  // Taux
  POINTS: { libelle: 'Points', abbreviation: 'pts' },
  POURCENTAGE: { libelle: 'Pourcentage', abbreviation: '%' },
  // Monétaires
  EURO: { libelle: 'Euro', abbreviation: '€' },
  MILLIONS_EUROS: { libelle: "Millions d'€", abbreviation: 'M€' },
  MILLIARDS_EUROS: { libelle: "Milliards d'€", abbreviation: 'Md€' },
  // Autres
  MEGAWATT: { libelle: 'Megawatt', abbreviation: 'MW' },
  GIGAWATT: { libelle: 'Gigawatt', abbreviation: 'GW' },
  TONNES: { libelle: 'Tonnes', abbreviation: 't' },
  TONNES_CO2: { libelle: 'Tonnes équivalents CO2', abbreviation: 'tCO2e' },
  TERAWATT: { libelle: 'Térawatt', abbreviation: 'TW' },
  LITRES: { libelle: 'Litres', abbreviation: 'L' },
  ELEVES: { libelle: 'Élèves', abbreviation: 'élèves' },
  CLASSES: { libelle: 'Classes', abbreviation: 'classes' },
  REPAS: { libelle: 'Repas', abbreviation: 'repas' },
} satisfies Record<UniteIndicateurCode, { libelle: string; abbreviation: string | null }>

export const uniteIndicateurApiModelSchema = z
  .object({
    code: uniteIndicateurCodeSchema,
    libelle: z.string().describe("Libellé affichable de l'unité (français)."),
    abbreviation: z
      .string()
      .nullable()
      .describe(
        "Abréviation de l'unité à suffixer aux valeurs (ex. `%`, `ans`), ou `null` " +
          'pour une unité sans symbole (compte brut, ex. « Valeur unitaire »).',
      ),
  })
  .describe("Unité de mesure d'un indicateur, sérialisée enrichie pour les clients API.")
export type UniteIndicateurApiModel = z.infer<typeof uniteIndicateurApiModelSchema>

export const configurationIndicateurReferentielSchema = z
  .object({
    id: referentielPublicIdSchema,
    fonctionAgregation: fonctionAgregationSchema,
  })
  .describe("Configuration d'un indicateur sur un référentiel donné.")
export type ConfigurationIndicateurReferentiel = z.infer<
  typeof configurationIndicateurReferentielSchema
>

export const configurationIndicateurReferentielApiModelSchema =
  configurationIndicateurReferentielSchema.extend({
    nom: z.string().describe('Nom lisible du référentiel associé.'),
  })
export type ConfigurationIndicateurReferentielApiModel = z.infer<
  typeof configurationIndicateurReferentielApiModelSchema
>

export const PERIODES_MISE_A_JOUR = [
  'QUOTIDIENNE',
  'HEBDOMADAIRE',
  'BIMENSUELLE',
  'MENSUELLE',
  'TRIMESTRIELLE',
  'SEMESTRIELLE',
  'ANNUELLE',
  'AUCUNE',
] as const
export type PeriodeMiseAJour = (typeof PERIODES_MISE_A_JOUR)[number]

// Libellés d'affichage des périodes, partagés entre l'admin (formulaire) et la
// webapp (fiche indicateur) pour éviter la divergence.
export const PERIODE_MISE_A_JOUR_LABELS: Record<PeriodeMiseAJour, string> = {
  QUOTIDIENNE: 'Quotidienne',
  HEBDOMADAIRE: 'Hebdomadaire',
  BIMENSUELLE: 'Bimensuelle',
  MENSUELLE: 'Mensuelle',
  TRIMESTRIELLE: 'Trimestrielle',
  SEMESTRIELLE: 'Semestrielle',
  ANNUELLE: 'Annuelle',
  AUCUNE: 'Aucune',
}

export const periodeMiseAJourSchema = z
  .enum(PERIODES_MISE_A_JOUR)
  .describe('Période de mise à jour planifiée des valeurs de cet indicateur.')

export const indicateurSourceUrlSchema = z
  .url({ protocol: /^https$/, error: 'URL https invalide' })
  .describe('URL de la source des données. Doit utiliser le protocole https.')

export const indicateurMetadonneesSchema = z.object({
  description: z.string().nullable().describe("Description libre de l'indicateur."),
  methodeCalcul: z
    .string()
    .nullable()
    .describe('Méthode de calcul utilisée pour produire la valeur.'),
  sourceDonnees: z.string().nullable().describe('Nom de la source des données.'),
  sourceUrl: indicateurSourceUrlSchema
    .nullable()
    .describe('URL de la source des données. Doit utiliser le protocole https.'),
  periodeMiseAJour: periodeMiseAJourSchema.nullable().describe('Période de mise à jour.'),
  jourMiseAJour: z.int().min(1).max(31).nullable().describe('Jour de mise à jour entre 1 et 31.'),
})
export type IndicateurMetadonnees = z.infer<typeof indicateurMetadonneesSchema>

export const indicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'indicateur."),
  visibilite: indicateurVisibiliteSchema,
  unite: uniteIndicateurApiModelSchema
    .nullable()
    .describe(
      "Unité de mesure de l'indicateur, ou `null` si non renseignée (valeur brute, sans unité).",
    ),
  ...indicateurMetadonneesSchema.shape,
  referentiels: z
    .array(configurationIndicateurReferentielApiModelSchema)
    .describe(
      'Configurations de cet indicateur sur chaque référentiel associé, triées par `id` ASC. ' +
        'Tableau vide si aucun référentiel.',
    ),
  responsables: z
    .array(responsableApiModelSchema)
    .describe(
      "Utilisateurs désignés responsables de l'indicateur, triés par ordre d'assignation (createdAt ASC).",
    ),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type IndicateurApiModel = z.infer<typeof indicateurApiModelSchema>

export const indicateurListApiModelSchema = createPaginatedApiListSchema(indicateurApiModelSchema)
export type IndicateurListApiModel = z.infer<typeof indicateurListApiModelSchema>

export const listIndicateursQuerySchema = listQuerySchema.extend({
  rechercheIdentifiant: z
    .string()
    .optional()
    .describe("Filtre case-insensitive sur l'identifiant public (`publicId`, ex. `IND-01`)."),
  ids: z
    .preprocess((val) => {
      if (typeof val !== 'string') return val
      const parts = val
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      return parts.length === 0 ? undefined : parts
    }, z.array(indicateurPublicIdSchema).optional())
    .describe(
      'Filtre par identifiants publics (CSV, ex. `IND-001,IND-002`). Vide ou absent = aucun filtre.',
    ),
})
export type ListIndicateursQuery = z.infer<typeof listIndicateursQuerySchema>

export const upsertIndicateurBodySchema = z.object({
  nom: z.string().min(1).describe("Nom lisible de l'indicateur."),
  visibilite: indicateurVisibiliteSchema,
  unite: uniteIndicateurCodeSchema
    .nullable()
    .describe(
      "Code de l'unité de mesure de l'indicateur, ou `null` pour effacer / ne pas renseigner (valeur brute, sans unité).",
    ),
  ...indicateurMetadonneesSchema.partial().shape,
  referentiels: z
    .array(configurationIndicateurReferentielSchema)
    .describe(
      'Liste complète des référentiels configurés pour cet indicateur (replace-all à chaque PUT). ' +
        'Tableau vide pour aucun référentiel. Doublons silencieusement dédupliqués sur `id` ; ' +
        "en cas de fonctions différentes, la dernière occurrence l'emporte.",
    ),
})
export type UpsertIndicateurBody = z.infer<typeof upsertIndicateurBodySchema>
