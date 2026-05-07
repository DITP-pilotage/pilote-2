import { z } from 'zod'

export const paginationCursorSchema = z
  .string()
  .min(1)
  .describe(
    'Cursor opaque (base64) renvoyé par la réponse précédente. Vide pour la première page.',
  )

export const paginationSchema = z.object({
  cursor: paginationCursorSchema
    .nullable()
    .describe('Cursor opaque à passer pour récupérer la page suivante. null si dernière page.'),
  hasMore: z.boolean().describe("Vrai s'il existe une page suivante."),
})

export const createPaginatedApiListSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema).describe('Items de la page courante'),
    pagination: paginationSchema.describe('Métadonnées de pagination'),
    total: z.number().describe('Nombre total d\'items après filtres (toutes pages confondues)'),
  })

export type PaginatedApiList<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof createPaginatedApiListSchema<T>>
>

export const pageSizeSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .describe("Nombre d'items par page (défaut serveur, max 100).")

export type PaginateQuery = {
  cursor?: string | undefined
  pageSize?: number | undefined
}

export const listQuerySchema = z.object({
  recherche: z.string().optional().describe('Filtre case-insensitive sur le nom.'),
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
export type ListQuery = z.infer<typeof listQuerySchema>
