import { z } from 'zod'

export const paginationCursorSchema = z
  .string()
  .min(1)
  .describe('Cursor opaque (base64) renvoyé par la réponse précédente. Vide pour la première page.')

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
    total: z.number().describe("Nombre total d'items après filtres (toutes pages confondues)"),
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

/**
 * Filtre `ids` d'une route de liste. Accepté en CSV dans la query string
 * (`?ids=A,B`) comme en tableau ; vide ou absent = aucun filtre.
 *
 * Factorisé ici parce que toute liste dont on résout des entités par lot en a
 * besoin : sans lui, l'appelant doit charger une page et filtrer en mémoire, et
 * tout ce qui dépasse `pageSize` disparaît silencieusement.
 */
export const idsFilterSchema = <T extends z.ZodType<string>>(publicIdSchema: T, exemple: string) =>
  z
    .preprocess((val) => {
      if (typeof val !== 'string') return val
      const parts = val
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      return parts.length === 0 ? undefined : parts
    }, z.array(publicIdSchema).optional())
    .describe(
      `Filtre par identifiants publics (CSV, ex. \`${exemple}\`). Vide ou absent = aucun filtre.`,
    )

export const listQuerySchema = z.object({
  recherche: z.string().optional().describe('Filtre case-insensitive sur le nom.'),
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
export type ListQuery = z.infer<typeof listQuerySchema>
