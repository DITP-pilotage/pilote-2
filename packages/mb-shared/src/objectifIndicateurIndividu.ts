import { z } from 'zod'

import { indicateurPublicIdSchema } from './indicateur'
import { individuPublicIdSchema } from './individu'
import { individusCsvSchema, MAX_INDIVIDUS_PAR_REQUETE } from './individusCsv'
import { dateTruncSchema, dateSchema } from './valeurAvancement'

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
      "Granularité de troncature des dates cibles. Par défaut `year`. Si plusieurs objectifs " +
        "d'un même individu tombent dans le même bucket, la dateCible la plus récente est retenue.",
    ),
})
export type ListObjectifsForIndicateurQuery = z.infer<typeof listObjectifsForIndicateurQuerySchema>

export const objectifIndicateurIndividuApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  dateCible: dateSchema,
  valeurCible: z.number(),
  type: z.enum(['saisie', 'derivee']).describe(
    "`saisie` : objectif saisi directement pour cet individu. `derivee` : objectif calculé par " +
      "agrégation des objectifs des enfants directs (récursivement). Les individus parents avec " +
      "une fonction d'agrégation active n'exposent jamais leurs saisies directes.",
  ),
})
export type ObjectifIndicateurIndividuApiModel = z.infer<typeof objectifIndicateurIndividuApiModelSchema>

export const objectifIndicateurIndividuListApiModelSchema = z.object({
  items: z.array(objectifIndicateurIndividuApiModelSchema),
})
export type ObjectifIndicateurIndividuListApiModel = z.infer<typeof objectifIndicateurIndividuListApiModelSchema>
