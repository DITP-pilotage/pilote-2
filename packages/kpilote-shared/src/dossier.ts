import { z } from 'zod'

import { createPaginatedApiListSchema, paginationCursorSchema, pageSizeSchema } from './pagination'
import { dossierContactsUtilesGroupSchema } from './dossierContactUtile'
import { dossierPublicIdSchema, indicateurPublicIdSchema } from './publicIds'
import { responsableApiModelSchema } from './responsable'

export const dossierVisibiliteSchema = z
  .enum(['PUBLIC', 'PRIVE'])
  .describe(
    "Visibilité du dossier. PUBLIC : accessible en lecture à tout principal authentifié. PRIVE : accessible uniquement aux principals disposant d'une permission explicite. Un principal qui voit un dossier voit aussi les indicateurs qui le composent (propagation READ).",
  )
export type DossierVisibilite = z.infer<typeof dossierVisibiliteSchema>

export const dossierApiModelSchema = z.object({
  id: dossierPublicIdSchema,
  nom: z.string().describe('Nom lisible du dossier.'),
  description: z.string().nullable().describe('Description libre du dossier.'),
  visibilite: dossierVisibiliteSchema,
  indicateurIds: z
    .array(indicateurPublicIdSchema)
    .describe(
      "Identifiants publics des indicateurs composant le dossier, triés par ordre d'insertion (createdAt ASC).",
    ),
  responsables: z
    .array(responsableApiModelSchema)
    .describe(
      "Utilisateurs désignés responsables du dossier, triés par ordre d'assignation (createdAt ASC).",
    ),
  contactsUtiles: z
    .array(dossierContactsUtilesGroupSchema)
    .describe(
      'Contacts utiles du dossier, regroupés par organisme et triés alphabétiquement (organismes puis contacts).',
    ),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type DossierApiModel = z.infer<typeof dossierApiModelSchema>

export const dossierListApiModelSchema = createPaginatedApiListSchema(dossierApiModelSchema)
export type DossierListApiModel = z.infer<typeof dossierListApiModelSchema>

export const listDossiersQuerySchema = z.object({
  recherche: z.string().optional().describe('Filtre case-insensitive sur le nom du dossier.'),
  rechercheIdentifiant: z
    .string()
    .optional()
    .describe("Filtre case-insensitive sur l'identifiant public (`publicId`, ex. `DOS-01`)."),
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
export type ListDossiersQuery = z.infer<typeof listDossiersQuerySchema>
