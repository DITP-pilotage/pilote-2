import { z } from 'zod'

export const SHARED_GREETING = 'Hello from @pilote/mb-shared'

export const sharedMessageSchema = z.object({
  greeting: z.string().describe('Salutation partagée renvoyée par le backend'),
})

export type SharedMessage = z.infer<typeof sharedMessageSchema>

// --- Paginated lists ---

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

// --- Errors ---

export const errorApiModelSchema = z.object({
  code: z
    .string()
    .describe('Code stable identifiant la classe d\'erreur (ex: INDICATEUR_NOT_FOUND).'),
  message: z
    .string()
    .describe('Message lisible en français destiné à l\'UI ou à un agent IA.'),
  details: z
    .unknown()
    .optional()
    .describe('Contexte additionnel optionnel (champs invalides, ids référencés, etc.).'),
})
export type ErrorApiModel = z.infer<typeof errorApiModelSchema>

// --- Indicateur ---

export const indicateurStatutSchema = z
  .enum(['actif', 'inactif', 'archive'])
  .describe('État du cycle de vie de l\'indicateur.')
export type IndicateurStatut = z.infer<typeof indicateurStatutSchema>

export const indicateurApiModelSchema = z.object({
  id: z.number().describe('Identifiant numérique unique de l\'indicateur.'),
  nom: z.string().describe('Nom lisible de l\'indicateur.'),
  valeur: z.number().describe('Valeur courante mesurée.'),
  unite: z.string().describe('Unité de mesure (ex: %, jours, agents).'),
  statut: indicateurStatutSchema,
  description: z.string().describe('Description longue de l\'indicateur, en français.'),
  createdAt: z.string().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type IndicateurApiModel = z.infer<typeof indicateurApiModelSchema>

export const indicateurListApiModelSchema = createPaginatedApiListSchema(indicateurApiModelSchema)
export type IndicateurListApiModel = z.infer<typeof indicateurListApiModelSchema>
