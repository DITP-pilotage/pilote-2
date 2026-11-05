import { z } from 'zod'

export const DIMENSION_KEY_PATTERN = /^[a-z][a-z0-9_]{0,49}$/

export const MAX_DIMENSION_SLOT = 999

export const analyticsDimensionKeySchema = z
  .string()
  .regex(
    DIMENSION_KEY_PATTERN,
    'Clé en minuscules : lettres, chiffres et `_`, 50 caractères au plus.',
  )
  .describe('Clé de contexte des événements et pages vues (ex. `conversation_id`).')

export const upsertAnalyticsDimensionBodySchema = z.object({
  slot: z
    .number()
    .int()
    .min(1)
    .max(MAX_DIMENSION_SLOT)
    .describe('Numéro de la dimension personnalisée dans Matomo.'),
  nom: z.string().trim().min(1).max(100).describe('Libellé lisible.'),
})
export type UpsertAnalyticsDimensionBody = z.infer<typeof upsertAnalyticsDimensionBodySchema>

export const analyticsDimensionSchema = upsertAnalyticsDimensionBodySchema.extend({
  cle: analyticsDimensionKeySchema,
})
export type AnalyticsDimension = z.infer<typeof analyticsDimensionSchema>

export const analyticsDimensionListSchema = z
  .array(analyticsDimensionSchema)
  .describe('Correspondances, triées par numéro de dimension.')

export const toDimensionSlots = (
  dimensions: ReadonlyArray<AnalyticsDimension>,
): Record<string, number> =>
  Object.fromEntries(dimensions.map((dimension) => [dimension.cle, dimension.slot]))
