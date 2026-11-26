import { z } from 'zod'

import { dateSchema } from './dates'
import { sensSouhaiteSchema } from './indicateur'
import { individuPublicIdSchema } from './individu'
import { individusCsvSchema } from './individusCsv'
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

export const listCollectionTauxProgressionQuerySchema = z.object({
  collections: collectionsCsvSchema.describe(
    `Liste d'identifiants de collections séparés par une virgule (ex. COL-1,COL-2). 1..${MAX_COLLECTIONS_PAR_REQUETE} identifiants.`,
  ),
  individus: individusCsvSchema
    .optional()
    .describe(
      'Individus sélectionnés, séparés par une virgule (ex. DEPT-84,BV-05). Chaque indicateur de la ' +
        'collection contribue sur le premier individu sélectionné dont le référentiel lui est lié ; ' +
        "sans individu lié, il n'est pas calculable. Sans ce paramètre, chaque indicateur contribue " +
        "sur son individu racine : l'individu de ses référentiels liés qui n'a pas de parent dans " +
        "ces référentiels (le premier par nom s'il y en a plusieurs).",
    ),
})
export type ListCollectionTauxProgressionQuery = z.infer<
  typeof listCollectionTauxProgressionQuerySchema
>

export const raisonSansTauxSchema = z
  .enum([
    'COLLECTION_VIDE',
    'AUCUN_INDICATEUR_PONDERE',
    'INDICATEUR_A_LA_BAISSE',
    'INDICATEUR_NON_CALCULABLE',
  ])
  .nullable()
  .describe(
    'Pourquoi `tauxProgression` vaut null, ou null quand il est calculé. ' +
      'COLLECTION_VIDE : aucun indicateur. AUCUN_INDICATEUR_PONDERE : toutes les pondérations valent 0. ' +
      'INDICATEUR_A_LA_BAISSE : au moins un indicateur pondéré est à la baisse, son taux ne se calcule pas ' +
      '(prioritaire sur la raison suivante). INDICATEUR_NON_CALCULABLE : au moins un indicateur pondéré ' +
      "n'a pas de taux (pas d'objectif, pas de valeur, dernier objectif à 0).",
  )
export type RaisonSansTaux = z.infer<typeof raisonSansTauxSchema>

export const collectionTauxProgressionSummaryApiModelSchema = z.object({
  collection: collectionPublicIdSchema,
  tauxProgression: z
    .number()
    .nullable()
    .describe(
      'Moyenne pondérée des taux de progression des indicateurs de la collection, tronquée à 2 décimales. ' +
        "null si au moins un indicateur pondéré de la collection n'est pas calculable (règle tout-ou-rien, " +
        'y compris un indicateur à la baisse) ou si la collection est vide.',
    ),
  raisonSansTaux: raisonSansTauxSchema,
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
        'dernier point avec valeurCible = 0, ou indicateur à la baisse).',
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
  sensSouhaite: sensSouhaiteSchema,
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
        "null si au moins un indicateur pondéré de la collection n'est pas calculable (règle tout-ou-rien, " +
        'y compris un indicateur à la baisse) ou si la collection est vide.',
    ),
  raisonSansTaux: raisonSansTauxSchema,
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
