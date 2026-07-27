import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { individuPublicIdSchema, referentielPublicIdSchema } from './publicIds'

const relationIndividuSchema = z.object({
  id: individuPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'individu."),
  referentiel: referentielPublicIdSchema.describe("Référentiel auquel l'individu appartient."),
})

export const relationApiModelSchema = z.object({
  enfant: relationIndividuSchema.describe(
    "Individu enfant. Il identifie la relation : un individu a au plus un parent.",
  ),
  parent: relationIndividuSchema.describe('Individu parent.'),
})
export type RelationApiModel = z.infer<typeof relationApiModelSchema>

export const relationListApiModelSchema = createPaginatedApiListSchema(relationApiModelSchema)
export type RelationListApiModel = z.infer<typeof relationListApiModelSchema>

export const listRelationsQuerySchema = listQuerySchema
export type ListRelationsQuery = z.infer<typeof listRelationsQuerySchema>

export const upsertRelationBodySchema = z.object({
  parent: individuPublicIdSchema.describe("Identifiant public de l'individu parent."),
})
export type UpsertRelationBody = z.infer<typeof upsertRelationBodySchema>
