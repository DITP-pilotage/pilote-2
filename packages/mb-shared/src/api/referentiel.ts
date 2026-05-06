import { z } from 'zod'

import { createPaginatedApiListSchema } from './pagination'

export const referentielPublicIdSchema = z
  .string()
  .regex(/^REF-[a-z0-9-]+$/, 'Identifiant public attendu au format REF-<slug>')
  .describe('Identifiant public du référentiel (format REF-<slug>, ex. REF-departements).')

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

export const listReferentielsQuerySchema = z.object({
  recherche: z.string().optional().describe('Filtre case-insensitive sur le nom du référentiel.'),
  cursor: referentielPublicIdSchema
    .optional()
    .describe(
      'Cursor de pagination (renvoyé par la réponse précédente). Vide pour la première page.',
    ),
})
export type ListReferentielsQuery = z.infer<typeof listReferentielsQuerySchema>
