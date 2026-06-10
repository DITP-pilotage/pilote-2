import { z } from 'zod'

import { indicateurPublicIdSchema } from './publicIds'
import { individuPublicIdSchema } from './individu'
import { individusCsvSchema, MAX_INDIVIDUS_PAR_REQUETE } from './individusCsv'
import { dateTruncSchema, dateSchema } from './dates'
import { fonctionAgregationSchema } from './indicateur'

export { dateSchema }

export const upsertObjectifIndicateurIndividuBodySchema = z.object({
  individu: individuPublicIdSchema,
  dateCible: dateSchema,
  valeurCible: z.number(),
})
export type UpsertObjectifIndicateurIndividuBody = z.infer<typeof upsertObjectifIndicateurIndividuBodySchema>

export const deleteObjectifIndicateurIndividuBodySchema = z.object({
  individu: individuPublicIdSchema,
  dateCible: dateSchema,
})
export type DeleteObjectifIndicateurIndividuBody = z.infer<typeof deleteObjectifIndicateurIndividuBodySchema>

export const listObjectifsForIndicateurQuerySchema = z.object({
  individus: individusCsvSchema.describe(
    `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
  ),
  dateTrunc: dateTruncSchema
    .optional()
    .describe(
      'Granularité de troncature des dates cibles. Par défaut `year`. Voir `DateTrunc` pour la ' +
        "sémantique des unités. Si plusieurs objectifs d'un même individu tombent dans le même " +
        'bucket, la dateCible la plus récente est retenue.',
    ),
})
export type ListObjectifsForIndicateurQuery = z.infer<typeof listObjectifsForIndicateurQuerySchema>

export const contributionObjectifApiModelSchema = z.object({
  individu: individuPublicIdSchema,
  valeurCible: z.number(),
  dateCible: dateSchema.describe(
    "Bucket de la valeur portée (carry-forward) retenue pour cet enfant au moment du bucket parent.",
  ),
  source: z
    .enum(['saisie', 'derivee'])
    .describe(
      "`saisie` : l'enfant est une feuille avec un objectif saisi. `derivee` : l'enfant est " +
        "lui-même agrégé depuis ses propres enfants.",
    ),
})
export type ContributionObjectifApiModel = z.infer<typeof contributionObjectifApiModelSchema>

export const objectifSaisieApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  dateCible: dateSchema,
  valeurCible: z.number(),
  type: z.literal('saisie'),
})
export type ObjectifSaisieApiModel = z.infer<typeof objectifSaisieApiModelSchema>

export const objectifDeriveeApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  dateCible: dateSchema,
  valeurCible: z.number(),
  type: z.literal('derivee'),
  fonctionAgregation: fonctionAgregationSchema.describe(
    "Fonction d'agrégation appliquée pour ce couple (indicateur, référentiel de l'individu).",
  ),
  contributions: z.array(contributionObjectifApiModelSchema).describe(
    "Une entrée par enfant direct, triée par publicId. Pour chaque enfant on porte sa dernière " +
      "valeur connue ≤ dateCible du bucket (carry-forward). Permet le drill-down et l'audit.",
  ),
})
export type ObjectifDeriveeApiModel = z.infer<typeof objectifDeriveeApiModelSchema>

export const objectifIndicateurIndividuApiModelSchema = z.discriminatedUnion('type', [
  objectifSaisieApiModelSchema,
  objectifDeriveeApiModelSchema,
])
export type ObjectifIndicateurIndividuApiModel = z.infer<typeof objectifIndicateurIndividuApiModelSchema>

export const objectifIndicateurIndividuListApiModelSchema = z.object({
  items: z.array(objectifIndicateurIndividuApiModelSchema),
})
export type ObjectifIndicateurIndividuListApiModel = z.infer<typeof objectifIndicateurIndividuListApiModelSchema>

export const MAX_OBJECTIFS_PAR_BATCH = 1000

export const upsertObjectifsIndicateurBatchBodySchema = z.object({
  items: z
    .array(upsertObjectifIndicateurIndividuBodySchema)
    .min(1, 'Au moins une entrée est requise')
    .max(MAX_OBJECTIFS_PAR_BATCH, `Au plus ${MAX_OBJECTIFS_PAR_BATCH} entrées par requête`)
    .describe(
      `Entrées à upserter sur l'indicateur (clé unique \`(individu, dateCible)\`). 1..${MAX_OBJECTIFS_PAR_BATCH} entrées.`,
    ),
})
export type UpsertObjectifsIndicateurBatchBody = z.infer<typeof upsertObjectifsIndicateurBatchBodySchema>

export const upsertObjectifsIndicateurBatchResultApiModelSchema = z.object({
  total: z.number().int().nonnegative().describe("Nombre total d'entrées traitées."),
  created: z.number().int().nonnegative().describe("Nombre d'entrées nouvellement créées dans la base."),
  updated: z.number().int().nonnegative().describe("Nombre d'entrées mises à jour dans la base."),
})
export type UpsertObjectifsIndicateurBatchResultApiModel = z.infer<typeof upsertObjectifsIndicateurBatchResultApiModelSchema>
