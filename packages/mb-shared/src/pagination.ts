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

export const listQuerySchema = z.object({
  recherche: z.string().optional().describe('Filtre case-insensitive sur le nom.'),
  cursor: paginationCursorSchema.optional(),
})
export type ListQuery = z.infer<typeof listQuerySchema>
