import { z } from 'zod'

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
