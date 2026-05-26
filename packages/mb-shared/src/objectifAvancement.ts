import { z } from 'zod'

import { indicateurPublicIdSchema } from './indicateur'
import { individuPublicIdSchema } from './individu'
import { dateSchema } from './valeurAvancement'

export { dateSchema }

const MAX_INDIVIDUS_PAR_REQUETE = 100

const individusCsvSchema = z
  .string()
  .min(1, "Au moins un identifiant d'individu est requis")
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(
    z
      .array(individuPublicIdSchema)
      .min(1)
      .max(MAX_INDIVIDUS_PAR_REQUETE, `Au plus ${MAX_INDIVIDUS_PAR_REQUETE} individus par requête`),
  )

export const upsertObjectifAvancementBodySchema = z.object({
  individu: individuPublicIdSchema,
  date: dateSchema,
  valeur: z.number(),
})
export type UpsertObjectifAvancementBody = z.infer<typeof upsertObjectifAvancementBodySchema>

export const deleteObjectifAvancementBodySchema = z.object({
  individu: individuPublicIdSchema,
  date: dateSchema,
})
export type DeleteObjectifAvancementBody = z.infer<typeof deleteObjectifAvancementBodySchema>

export const listObjectifsForIndicateurQuerySchema = z.object({
  individus: individusCsvSchema.describe(
    `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
  ),
})
export type ListObjectifsForIndicateurQuery = z.infer<typeof listObjectifsForIndicateurQuerySchema>

export const objectifAvancementApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  date: dateSchema,
  valeur: z.number(),
})
export type ObjectifAvancementApiModel = z.infer<typeof objectifAvancementApiModelSchema>

export const objectifAvancementListApiModelSchema = z.object({
  items: z.array(objectifAvancementApiModelSchema),
})
export type ObjectifAvancementListApiModel = z.infer<typeof objectifAvancementListApiModelSchema>
