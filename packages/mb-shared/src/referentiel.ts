import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { individuPublicIdSchema, referentielPublicIdSchema } from './publicIds'

export { referentielPublicIdSchema } from './publicIds'

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

export const upsertReferentielIndividuItemSchema = z.object({
  publicId: individuPublicIdSchema,
  nom: z.string().min(1).describe("Nom lisible de l'individu."),
})
export type UpsertReferentielIndividuItem = z.infer<typeof upsertReferentielIndividuItemSchema>

export const upsertReferentielBodySchema = z.object({
  nom: z.string().min(1).describe('Nom lisible du référentiel.'),
  description: z.string().nullable().describe('Description du référentiel (peut être null).'),
  individus: z
    .array(upsertReferentielIndividuItemSchema)
    .optional()
    .describe(
      "Individus à upsert et lier au référentiel. Sémantique merge : les individus déjà liés mais absents du body ne sont pas retirés.",
    ),
})
export type UpsertReferentielBody = z.infer<typeof upsertReferentielBodySchema>
