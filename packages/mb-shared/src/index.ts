import { z } from 'zod'

export const SHARED_GREETING = 'Hello from @pilote/mb-shared'

export const sharedMessageSchema = z.object({
  greeting: z.string(),
})

export type SharedMessage = z.infer<typeof sharedMessageSchema>

// --- Paginated lists ---

export const paginationSchema = z.object({
  cursor: z.string().min(1).nullable(),
  hasMore: z.boolean(),
})

export const createPaginatedAPIListSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: paginationSchema,
    total: z.number(),
  })

export type PaginatedAPIList<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof createPaginatedAPIListSchema<T>>
>

// --- Indicateur ---

export const indicateurStatutSchema = z.enum(['actif', 'inactif', 'archive'])
export type IndicateurStatut = z.infer<typeof indicateurStatutSchema>

export const indicateurAPISchema = z.object({
  id: z.number(),
  nom: z.string(),
  valeur: z.number(),
  unite: z.string(),
  statut: indicateurStatutSchema,
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type IndicateurAPI = z.infer<typeof indicateurAPISchema>

export const indicateurListAPISchema = createPaginatedAPIListSchema(indicateurAPISchema)
export type IndicateurListAPI = z.infer<typeof indicateurListAPISchema>
