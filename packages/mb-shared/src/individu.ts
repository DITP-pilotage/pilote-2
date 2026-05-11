import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { individuPublicIdSchema, referentielPublicIdSchema } from './publicIds'

export { individuPublicIdSchema } from './publicIds'

export const individuApiModelSchema = z.object({
  id: individuPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'individu."),
  referentiels: z
    .array(referentielPublicIdSchema)
    .describe("Référentiels auxquels l'individu appartient."),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type IndividuApiModel = z.infer<typeof individuApiModelSchema>

export const individuListApiModelSchema = createPaginatedApiListSchema(individuApiModelSchema)
export type IndividuListApiModel = z.infer<typeof individuListApiModelSchema>

export const listIndividusForReferentielQuerySchema = listQuerySchema
export type ListIndividusForReferentielQuery = z.infer<typeof listIndividusForReferentielQuerySchema>
