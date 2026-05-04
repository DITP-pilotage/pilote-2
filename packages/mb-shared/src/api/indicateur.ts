import { z } from 'zod'

import { createPaginatedApiListSchema } from './pagination'

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
