import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { referentielPublicIdSchema } from './referentiel'

export const individuPublicIdSchema = z
  .string()
  .regex(
    /^[A-Z][A-Z0-9-]{0,19}$/,
    'Identifiant public d\'individu attendu (lettre majuscule suivie de lettres/chiffres/tirets, max 20 caractères)',
  )
  .describe(
    "Identifiant public d'individu, format humain-friendly (ex. DEPT-84, REG-93, FR). Lettre majuscule puis lettres/chiffres/tirets, max 20 caractères.",
  )

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
