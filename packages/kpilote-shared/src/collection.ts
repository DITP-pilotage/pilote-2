import { z } from 'zod'

import { createPaginatedApiListSchema, paginationCursorSchema, pageSizeSchema } from './pagination'
import { collectionContactsUtilesGroupSchema } from './collectionContactUtile'
import { collectionPublicIdSchema, indicateurPublicIdSchema } from './publicIds'
import { responsableApiModelSchema } from './responsable'

export const collectionVisibiliteSchema = z
  .enum(['PUBLIC', 'PRIVE'])
  .describe(
    "Visibilité de la collection. PUBLIC : accessible en lecture à tout principal authentifié. PRIVE : accessible uniquement aux principals disposant d'une permission explicite. Un principal qui voit une collection voit aussi les indicateurs qui le composent (propagation READ).",
  )
export type CollectionVisibilite = z.infer<typeof collectionVisibiliteSchema>

export const collectionIndicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  ponderation: z
    .number()
    .describe(
      'Poids de l’indicateur dans la moyenne pondérée du taux de progression de la collection. 1 par défaut ; 0 exclut l’indicateur du calcul.',
    ),
})
export type CollectionIndicateurApiModel = z.infer<typeof collectionIndicateurApiModelSchema>

export const collectionApiModelSchema = z.object({
  id: collectionPublicIdSchema,
  nom: z.string().describe('Nom lisible de la collection.'),
  description: z.string().nullable().describe('Description libre de la collection.'),
  visibilite: collectionVisibiliteSchema,
  indicateurs: z
    .array(collectionIndicateurApiModelSchema)
    .describe(
      "Indicateurs composant la collection, triés par ordre d'insertion (createdAt ASC), avec leur pondération.",
    ),
  responsables: z
    .array(responsableApiModelSchema)
    .describe(
      "Utilisateurs désignés responsables de la collection, triés par ordre d'assignation (createdAt ASC).",
    ),
  contactsUtiles: z
    .array(collectionContactsUtilesGroupSchema)
    .describe(
      'Contacts utiles de la collection, regroupés par organisme et triés alphabétiquement (organismes puis contacts).',
    ),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type CollectionApiModel = z.infer<typeof collectionApiModelSchema>

export const collectionListApiModelSchema = createPaginatedApiListSchema(collectionApiModelSchema)
export type CollectionListApiModel = z.infer<typeof collectionListApiModelSchema>

export const listCollectionsQuerySchema = z.object({
  recherche: z.string().optional().describe('Filtre case-insensitive sur le nom de la collection.'),
  rechercheIdentifiant: z
    .string()
    .optional()
    .describe("Filtre case-insensitive sur l'identifiant public (`publicId`, ex. `COL-01`)."),
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
export type ListCollectionsQuery = z.infer<typeof listCollectionsQuerySchema>
