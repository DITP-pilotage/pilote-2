import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { axePublicIdSchema, modalitePublicIdSchema } from './publicIds'

export { axePublicIdSchema, modalitePublicIdSchema } from './publicIds'

// --- Axe ---------------------------------------------------------------------

export const FONCTIONS_AGREGATION_AXE = ['SUM', 'AVG'] as const
export const fonctionAgregationAxeSchema = z
  .enum(FONCTIONS_AGREGATION_AXE)
  .describe(
    'Fonction d’un axe pour un indicateur : `SUM` (somme) ou `AVG` (moyenne). Elle calcule une modalité parente à partir de ses enfants, à chaque niveau, puis « Tous » à partir du premier niveau.',
  )
export type FonctionAgregationAxe = z.infer<typeof fonctionAgregationAxeSchema>

export const niveauAxeApiModelSchema = z.object({
  ordre: z
    .number()
    .int()
    .positive()
    .describe('Rang du niveau dans l’axe, à partir de 1 (du plus large au plus fin).'),
  nom: z.string().describe('Nom du niveau (ex. Famille, Type).'),
})
export type NiveauAxeApiModel = z.infer<typeof niveauAxeApiModelSchema>

export const axeApiModelSchema = z.object({
  id: axePublicIdSchema,
  nom: z.string().describe('Nom lisible de l’axe (ex. Opérateur, Type de fraude).'),
  description: z.string().nullable().describe('Description optionnelle de l’axe.'),
  niveaux: z
    .array(niveauAxeApiModelSchema)
    .describe('Niveaux de l’axe, triés par ordre. Un axe plat a un seul niveau.'),
  nombreModalites: z
    .number()
    .int()
    .nonnegative()
    .describe('Nombre de modalités de l’axe, tous niveaux confondus.'),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type AxeApiModel = z.infer<typeof axeApiModelSchema>

export const axeListApiModelSchema = createPaginatedApiListSchema(axeApiModelSchema)
export type AxeListApiModel = z.infer<typeof axeListApiModelSchema>

export const listAxesQuerySchema = listQuerySchema
export type ListAxesQuery = z.infer<typeof listAxesQuerySchema>

export const upsertAxeBodySchema = z.object({
  nom: z.string().min(1).describe('Nom lisible de l’axe.'),
  description: z.string().nullable().describe('Description de l’axe (peut être null).'),
  niveaux: z
    .array(z.object({ nom: z.string().min(1).describe('Nom du niveau.') }))
    .min(1)
    .describe(
      'Liste complète des niveaux, du plus large au plus fin. La position donne l’ordre (1, 2…). Raccourcir la liste supprime les derniers niveaux : refusé (409) si l’un d’eux porte des modalités.',
    ),
})
export type UpsertAxeBody = z.infer<typeof upsertAxeBodySchema>

// --- Modalité ----------------------------------------------------------------

export const modaliteApiModelSchema = z.object({
  id: modalitePublicIdSchema,
  nom: z.string().describe('Nom lisible de la modalité (ex. Orange, Fraude à la TVA).'),
  niveau: z.number().int().positive().describe('Ordre du niveau de la modalité dans son axe.'),
  parent: modalitePublicIdSchema
    .nullable()
    .describe('Modalité parente, au niveau précédent du même axe. Null au premier niveau.'),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type ModaliteApiModel = z.infer<typeof modaliteApiModelSchema>

export const modaliteListApiModelSchema = z.object({
  items: z
    .array(modaliteApiModelSchema)
    .describe('Toutes les modalités de l’axe, triées par niveau puis par nom.'),
})
export type ModaliteListApiModel = z.infer<typeof modaliteListApiModelSchema>

export const upsertModaliteBodySchema = z.object({
  nom: z.string().min(1).describe('Nom lisible de la modalité.'),
  parent: modalitePublicIdSchema
    .nullable()
    .describe(
      'Modalité parente, du même axe. Null pour une modalité du premier niveau. Le niveau de la modalité s’en déduit (niveau du parent + 1). Fixé à la création : une modification ne peut pas changer le parent.',
    ),
})
export type UpsertModaliteBody = z.infer<typeof upsertModaliteBodySchema>
