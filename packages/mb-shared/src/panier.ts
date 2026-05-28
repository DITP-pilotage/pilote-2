import { z } from 'zod'

import { createPaginatedApiListSchema, paginationCursorSchema, pageSizeSchema } from './pagination'
import { indicateurPublicIdSchema, panierPublicIdSchema } from './publicIds'

export const panierApiModelSchema = z.object({
  id: panierPublicIdSchema,
  nom: z.string().describe('Nom lisible du panier.'),
  description: z.string().nullable().describe('Description libre du panier.'),
  indicateurIds: z
    .array(indicateurPublicIdSchema)
    .describe(
      "Identifiants publics des indicateurs composant le panier, triés par ordre d'insertion (createdAt ASC).",
    ),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type PanierApiModel = z.infer<typeof panierApiModelSchema>

export const panierListApiModelSchema = createPaginatedApiListSchema(panierApiModelSchema)
export type PanierListApiModel = z.infer<typeof panierListApiModelSchema>

export const listPaniersQuerySchema = z.object({
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
export type ListPaniersQuery = z.infer<typeof listPaniersQuerySchema>
