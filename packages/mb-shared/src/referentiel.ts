import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'

export const referentielPublicIdSchema = z
  .string()
  .regex(
    /^REF-[A-Z0-9-]{1,16}$/,
    'Identifiant public attendu au format REF-<SLUG> (max 20 caractères)',
  )
  .describe('Identifiant public du référentiel (format REF-<SLUG>, ex. REF-DEPT). Max 20 caractères.')

export const referentielApiModelSchema = z.object({
  id: referentielPublicIdSchema,
  nom: z.string().describe('Nom lisible du référentiel.'),
  description: z.string().nullable().describe('Description optionnelle du référentiel.'),
  nombreIndividus: z
    .number()
    .int()
    .nonnegative()
    .describe("Nombre d'individus appartenant à la population du référentiel."),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type ReferentielApiModel = z.infer<typeof referentielApiModelSchema>

export const referentielListApiModelSchema = createPaginatedApiListSchema(referentielApiModelSchema)
export type ReferentielListApiModel = z.infer<typeof referentielListApiModelSchema>

export const listReferentielsQuerySchema = listQuerySchema
export type ListReferentielsQuery = z.infer<typeof listReferentielsQuerySchema>
