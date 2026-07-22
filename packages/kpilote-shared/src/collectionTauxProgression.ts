import { z } from 'zod'

import { dateSchema } from './dates'
import { individuPublicIdSchema } from './individu'
import { collectionPublicIdSchema, indicateurPublicIdSchema } from './publicIds'

export const MAX_COLLECTIONS_PAR_REQUETE = 50

const collectionsCsvSchema = z
  .string()
  .min(1, 'Au moins un identifiant de collection est requis')
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(
    z
      .array(collectionPublicIdSchema)
      .min(1)
      .max(
        MAX_COLLECTIONS_PAR_REQUETE,
        `Au plus ${MAX_COLLECTIONS_PAR_REQUETE} collections par requête`,
      ),
  )

export const listCollectionTauxProgressionForIndividuQuerySchema = z.object({
  collections: collectionsCsvSchema.describe(
    `Liste d'identifiants de collections séparés par une virgule (ex. COL-1,COL-2). 1..${MAX_COLLECTIONS_PAR_REQUETE} identifiants.`,
  ),
})
export type ListCollectionTauxProgressionForIndividuQuery = z.infer<
  typeof listCollectionTauxProgressionForIndividuQuerySchema
>

export const collectionTauxProgressionSummaryApiModelSchema = z.object({
  collection: collectionPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Moyenne pondérée des taux de progression des indicateurs de la collection, tronquée à 2 décimales. ' +
        "null si au moins un indicateur de la collection n'est pas calculable (règle tout-ou-rien) ou si " +
        'la collection est vide.',
    ),
})
export type CollectionTauxProgressionSummaryApiModel = z.infer<
  typeof collectionTauxProgressionSummaryApiModelSchema
>

export const collectionTauxProgressionSummaryListApiModelSchema = z.object({
  items: z
    .array(collectionTauxProgressionSummaryApiModelSchema)
    .describe(
      'Taux de progression pour chaque collection demandé accessible en lecture. ' +
        'Les collections inaccessibles ou inexistants sont omis.',
    ),
})
export type CollectionTauxProgressionSummaryListApiModel = z.infer<
  typeof collectionTauxProgressionSummaryListApiModelSchema
>

export const getCollectionTauxProgressionQuerySchema = z.object({
  individu: individuPublicIdSchema.describe(
    "Identifiant public de l'individu pour lequel calculer le taux de progression de la collection.",
  ),
})
export type GetCollectionTauxProgressionQuery = z.infer<
  typeof getCollectionTauxProgressionQuerySchema
>

export const collectionTauxProgressionContributionApiModelSchema = z.object({
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
      'Pondération appliquée à cet indicateur dans la moyenne pondérée de la collection. Fixé à 1 en v0.',
    ),
})
export type CollectionTauxProgressionContributionApiModel = z.infer<
  typeof collectionTauxProgressionContributionApiModelSchema
>

export const collectionTauxProgressionApiModelSchema = z.object({
  collection: collectionPublicIdSchema,
  individu: individuPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Moyenne pondérée des taux de progression des indicateurs de la collection, tronquée à 2 décimales. ' +
        "null si au moins un indicateur de la collection n'est pas calculable (règle tout-ou-rien) ou si " +
        'la collection est vide.',
    ),
  contributions: z
    .array(collectionTauxProgressionContributionApiModelSchema)
    .describe(
      "Détail par indicateur de la collection (dernier taux connu pour l'individu, date, pondération). " +
        'Toujours renseigné même si la moyenne globale est null — utile pour expliciter au client ' +
        'quels indicateurs bloquent le calcul.',
    ),
})
export type CollectionTauxProgressionApiModel = z.infer<
  typeof collectionTauxProgressionApiModelSchema
>
