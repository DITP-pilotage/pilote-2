import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { indicateurPublicIdSchema, referentielPublicIdSchema } from './publicIds'

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

export const UNITES_INDICATEUR = ['POURCENTAGE', 'ANNEES'] as const
export type UniteIndicateurCode = (typeof UNITES_INDICATEUR)[number]

export const uniteIndicateurCodeSchema = z
  .enum(UNITES_INDICATEUR)
  .describe(
    "Code de l'unité de mesure de l'indicateur. `null` signifie sans unité (valeur brute). " +
      'Catalogue plateforme, fermé, étendu par déploiement.',
  )

export const UNITES_INDICATEUR_CONFIG = {
  POURCENTAGE: { libelle: 'Pourcentage', abbreviation: '%' },
  ANNEES: { libelle: 'Années', abbreviation: 'ans' },
} satisfies Record<UniteIndicateurCode, { libelle: string; abbreviation: string }>

export const uniteIndicateurApiModelSchema = z
  .object({
    code: uniteIndicateurCodeSchema,
    libelle: z.string().describe("Libellé affichable de l'unité (français)."),
    abbreviation: z
      .string()
      .describe("Abréviation de l'unité, à suffixer aux valeurs (ex. `%`, `ans`)."),
  })
  .describe("Unité de mesure d'un indicateur, sérialisée enrichie pour les clients API.")
export type UniteIndicateurApiModel = z.infer<typeof uniteIndicateurApiModelSchema>

export const configurationIndicateurReferentielSchema = z
  .object({
    referentielPublicId: referentielPublicIdSchema,
    fonctionAgregation: fonctionAgregationSchema,
  })
  .describe("Configuration d'un indicateur sur un référentiel donné.")
export type ConfigurationIndicateurReferentiel = z.infer<
  typeof configurationIndicateurReferentielSchema
>

export const indicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'indicateur."),
  visibilite: indicateurVisibiliteSchema,
  unite: uniteIndicateurApiModelSchema
    .nullable()
    .describe("Unité de mesure de l'indicateur, ou `null` si non renseignée."),
  referentiels: z
    .array(configurationIndicateurReferentielSchema)
    .describe(
      'Configurations de cet indicateur sur chaque référentiel associé, triées par ' +
        '`referentielPublicId` ASC. Tableau vide si aucun référentiel.',
    ),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type IndicateurApiModel = z.infer<typeof indicateurApiModelSchema>

export const indicateurListApiModelSchema = createPaginatedApiListSchema(indicateurApiModelSchema)
export type IndicateurListApiModel = z.infer<typeof indicateurListApiModelSchema>

export const listIndicateursQuerySchema = listQuerySchema.extend({
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
      "Code de l'unité de mesure de l'indicateur, ou `null` pour effacer / ne pas renseigner.",
    ),
  referentiels: z
    .array(configurationIndicateurReferentielSchema)
    .describe(
      'Liste complète des référentiels configurés pour cet indicateur (replace-all à chaque PUT). ' +
        'Tableau vide pour aucun référentiel. Doublons silencieusement dédupliqués sur ' +
        "`referentielPublicId` ; en cas de fonctions différentes, la dernière occurrence l'emporte.",
    ),
})
export type UpsertIndicateurBody = z.infer<typeof upsertIndicateurBodySchema>
