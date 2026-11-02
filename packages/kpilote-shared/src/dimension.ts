import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { referentielPublicIdSchema } from './publicIds'

export const dimensionPublicIdSchema = z
  .string()
  .regex(
    /^DIM-[A-Z0-9-]{1,16}$/,
    'Identifiant public attendu au format DIM-<SLUG> (max 20 caractères)',
  )
  .describe('Identifiant public de la dimension (format DIM-<SLUG>, ex. DIM-TERRITOIRE).')

export const dimensionApiModelSchema = z.object({
  id: dimensionPublicIdSchema,
  nom: z.string().describe('Nom lisible de la dimension (ex. Territoire, Opérateur).'),
  description: z.string().nullable(),
  referentiels: z
    .array(referentielPublicIdSchema)
    .describe('Niveaux de la dimension : référentiels qui lui sont rattachés.'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type DimensionApiModel = z.infer<typeof dimensionApiModelSchema>

export const dimensionListApiModelSchema = createPaginatedApiListSchema(dimensionApiModelSchema)
export type DimensionListApiModel = z.infer<typeof dimensionListApiModelSchema>

export const listDimensionsQuerySchema = listQuerySchema
export type ListDimensionsQuery = z.infer<typeof listDimensionsQuerySchema>

export const upsertDimensionBodySchema = z.object({
  nom: z.string().min(1),
  description: z.string().nullable().optional(),
})
export type UpsertDimensionBody = z.infer<typeof upsertDimensionBodySchema>
