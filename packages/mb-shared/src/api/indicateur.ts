import { z } from 'zod'

import { createPaginatedApiListSchema } from './pagination'

export const indicateurPublicIdSchema = z
  .string()
  .regex(/^IND-\d+$/, 'Identifiant public attendu au format IND-XXX')
  .describe('Identifiant public de l\'indicateur (format IND-XXX).')
export const indicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  nom: z.string().describe('Nom lisible de l\'indicateur.'),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type IndicateurApiModel = z.infer<typeof indicateurApiModelSchema>

export const indicateurListApiModelSchema = createPaginatedApiListSchema(indicateurApiModelSchema)
export type IndicateurListApiModel = z.infer<typeof indicateurListApiModelSchema>
