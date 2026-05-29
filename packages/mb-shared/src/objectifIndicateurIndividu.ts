import { z } from 'zod'

import { indicateurPublicIdSchema } from './publicIds'
import { individuPublicIdSchema } from './individu'
import { individusCsvSchema, MAX_INDIVIDUS_PAR_REQUETE } from './individusCsv'
import { dateSchema } from './valeurAvancement'

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
})
export type ListObjectifsForIndicateurQuery = z.infer<typeof listObjectifsForIndicateurQuerySchema>

export const objectifIndicateurIndividuApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  dateCible: dateSchema,
  valeurCible: z.number(),
})
export type ObjectifIndicateurIndividuApiModel = z.infer<typeof objectifIndicateurIndividuApiModelSchema>

export const objectifIndicateurIndividuListApiModelSchema = z.object({
  items: z.array(objectifIndicateurIndividuApiModelSchema),
})
export type ObjectifIndicateurIndividuListApiModel = z.infer<typeof objectifIndicateurIndividuListApiModelSchema>
