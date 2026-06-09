import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { individuPublicIdSchema, referentielPublicIdSchema } from './publicIds'

export { individuPublicIdSchema } from './publicIds'

export const individuMetadataSchema = z.record(z.string(), z.string().or(z.number())).nullable()
export type IndividuMetadata = z.infer<typeof individuMetadataSchema>

export const individuApiModelSchema = z.object({
  id: individuPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'individu."),
  referentiel: referentielPublicIdSchema.describe("Référentiel auquel l'individu appartient."),
  parents: z
    .array(individuPublicIdSchema)
    .describe(
      "Public IDs des individus parents (hiérarchie). Vide si l'individu est racine. Plusieurs entrées possibles : un individu peut être rattaché à plusieurs parents (ex. commune appartenant à plusieurs EPCI).",
    ),
  metadata: individuMetadataSchema.describe(
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
