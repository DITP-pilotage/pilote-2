import { z } from 'zod'

export const paginationSchema = z.object({
  cursor: z
    .string()
    .min(1)
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
