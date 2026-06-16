import { z } from 'zod'

import { dateSchema } from './dates'
import { individuPublicIdSchema } from './individu'
import { indicateurPublicIdSchema, panierPublicIdSchema } from './publicIds'

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
      "Dernier taux de progression connu pour cet indicateur et cet individu. " +
        "null si l'indicateur n'a aucun point calculable (pas d'objectif, pas de valeur, " +
        'ou dernier point avec valeurCible = 0).',
    ),
  date: dateSchema.nullable().describe(
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
      "Moyenne pondérée des taux de progression des indicateurs du panier, tronquée à 2 décimales. " +
        "null si au moins un indicateur du panier n'est pas calculable (règle tout-ou-rien) ou si " +
        'le panier est vide.',
    ),
  contributions: z
    .array(panierTauxProgressionContributionApiModelSchema)
    .describe(
      "Détail par indicateur du panier (dernier taux connu pour l'individu, date, pondération). " +
        "Toujours renseigné même si la moyenne globale est null — utile pour expliciter au client " +
        'quels indicateurs bloquent le calcul.',
    ),
})
export type PanierTauxProgressionApiModel = z.infer<typeof panierTauxProgressionApiModelSchema>
