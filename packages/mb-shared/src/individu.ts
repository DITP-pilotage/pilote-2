import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { individuPublicIdSchema, referentielPublicIdSchema } from './publicIds'

export { individuPublicIdSchema } from './publicIds'

export const individuApiModelSchema = z.object({
  id: individuPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'individu."),
  referentiel: referentielPublicIdSchema.describe("Référentiel auquel l'individu appartient."),
  metadata: z
    .record(z.string(), z.unknown())
    .nullable()
    .describe(
      "Métadonnées libres portées par l'individu (ex. { codeInsee } pour un département). Les widgets s'en servent comme clé de jointure ; le schéma exact est validé côté consommateur.",
    ),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type IndividuApiModel = z.infer<typeof individuApiModelSchema>

export const individuListApiModelSchema = createPaginatedApiListSchema(individuApiModelSchema)
export type IndividuListApiModel = z.infer<typeof individuListApiModelSchema>

export const listIndividusForReferentielQuerySchema = listQuerySchema
export type ListIndividusForReferentielQuery = z.infer<typeof listIndividusForReferentielQuerySchema>
