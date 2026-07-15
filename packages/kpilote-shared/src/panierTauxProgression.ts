import { z } from 'zod'

import { dateSchema } from './dates'
import { individuPublicIdSchema } from './individu'
import { indicateurPublicIdSchema, panierPublicIdSchema } from './publicIds'

export const MAX_PANIERS_PAR_REQUETE = 50

const paniersCsvSchema = z
  .string()
  .min(1, 'Au moins un identifiant de panier est requis')
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(
    z
      .array(panierPublicIdSchema)
      .min(1)
      .max(MAX_PANIERS_PAR_REQUETE, `Au plus ${MAX_PANIERS_PAR_REQUETE} paniers par requête`),
  )

export const listPanierTauxProgressionForIndividuQuerySchema = z.object({
  paniers: paniersCsvSchema.describe(
    `Liste d'identifiants de paniers séparés par une virgule (ex. PAN-1,PAN-2). 1..${MAX_PANIERS_PAR_REQUETE} identifiants.`,
  ),
})
export type ListPanierTauxProgressionForIndividuQuery = z.infer<
  typeof listPanierTauxProgressionForIndividuQuerySchema
>

export const panierTauxProgressionSummaryApiModelSchema = z.object({
  panier: panierPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Moyenne pondérée des taux de progression des indicateurs du panier, tronquée à 2 décimales. ' +
        "null si au moins un indicateur du panier n'est pas calculable (règle tout-ou-rien) ou si " +
        'le panier est vide.',
    ),
})
export type PanierTauxProgressionSummaryApiModel = z.infer<
  typeof panierTauxProgressionSummaryApiModelSchema
>

export const panierTauxProgressionSummaryListApiModelSchema = z.object({
  items: z.array(panierTauxProgressionSummaryApiModelSchema).describe(
    'Taux de progression pour chaque panier demandé accessible en lecture. ' +
      'Les paniers inaccessibles ou inexistants sont omis.',
  ),
})
export type PanierTauxProgressionSummaryListApiModel = z.infer<
  typeof panierTauxProgressionSummaryListApiModelSchema
>

export const getPanierTauxProgressionQuerySchema = z.object({
  individu: individuPublicIdSchema.describe(
    "Identifiant public de l'individu pour lequel calculer le taux de progression du panier.",
  ),
})
export type GetPanierTauxProgressionQuery = z.infer<typeof getPanierTauxProgressionQuerySchema>

export const panierTauxProgressionContributionApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Dernier taux de progression connu pour cet indicateur et cet individu. ' +
        "null si l'indicateur n'a aucun point calculable (pas d'objectif, pas de valeur, " +
        'ou dernier point avec valeurCible = 0).',
    ),
  date: dateSchema
    .nullable()
    .describe(
      'Bucket (YYYY-MM-DD) du dernier point retenu pour cet indicateur. null si aucun point.',
    ),
  ponderation: z
    .number()
    .describe(
      'Pondération appliquée à cet indicateur dans la moyenne pondérée du panier. Fixé à 1 en v0.',
    ),
})
export type PanierTauxProgressionContributionApiModel = z.infer<
  typeof panierTauxProgressionContributionApiModelSchema
>

export const panierTauxProgressionApiModelSchema = z.object({
  panier: panierPublicIdSchema,
  individu: individuPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Moyenne pondérée des taux de progression des indicateurs du panier, tronquée à 2 décimales. ' +
        "null si au moins un indicateur du panier n'est pas calculable (règle tout-ou-rien) ou si " +
        'le panier est vide.',
    ),
  contributions: z
    .array(panierTauxProgressionContributionApiModelSchema)
    .describe(
      "Détail par indicateur du panier (dernier taux connu pour l'individu, date, pondération). " +
        'Toujours renseigné même si la moyenne globale est null — utile pour expliciter au client ' +
        'quels indicateurs bloquent le calcul.',
    ),
})
export type PanierTauxProgressionApiModel = z.infer<typeof panierTauxProgressionApiModelSchema>
