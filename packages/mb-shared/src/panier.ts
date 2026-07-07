import { z } from 'zod'

import { createPaginatedApiListSchema, paginationCursorSchema, pageSizeSchema } from './pagination'
import { indicateurPublicIdSchema, panierPublicIdSchema } from './publicIds'
import { responsableApiModelSchema } from './responsable'

export const panierVisibiliteSchema = z
  .enum(['PUBLIC', 'PRIVE'])
  .describe(
    "Visibilité du panier. PUBLIC : accessible en lecture à tout principal authentifié. PRIVE : accessible uniquement aux principals disposant d'une permission explicite. Un principal qui voit un panier voit aussi les indicateurs qui le composent (propagation READ).",
  )
export type PanierVisibilite = z.infer<typeof panierVisibiliteSchema>

export const panierApiModelSchema = z.object({
  id: panierPublicIdSchema,
  nom: z.string().describe('Nom lisible du panier.'),
  description: z.string().nullable().describe('Description libre du panier.'),
  visibilite: panierVisibiliteSchema,
  indicateurIds: z
    .array(indicateurPublicIdSchema)
    .describe(
      "Identifiants publics des indicateurs composant le panier, triés par ordre d'insertion (createdAt ASC).",
    ),
  responsables: z
    .array(responsableApiModelSchema)
    .describe("Utilisateurs désignés responsables du panier, triés par ordre d'assignation (createdAt ASC)."),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type PanierApiModel = z.infer<typeof panierApiModelSchema>

export const panierListApiModelSchema = createPaginatedApiListSchema(panierApiModelSchema)
export type PanierListApiModel = z.infer<typeof panierListApiModelSchema>

export const listPaniersQuerySchema = z.object({
  recherche: z.string().optional().describe('Filtre case-insensitive sur le nom du panier.'),
  rechercheIdentifiant: z
    .string()
    .optional()
    .describe("Filtre case-insensitive sur l'identifiant public (`publicId`, ex. `PAN-01`)."),
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
export type ListPaniersQuery = z.infer<typeof listPaniersQuerySchema>
