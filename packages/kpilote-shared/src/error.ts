import { z } from 'zod'

export const errorApiModelSchema = z.object({
  code: z
    .string()
    .describe("Code stable identifiant la classe d'erreur (ex: INDICATEUR_NOT_FOUND)."),
  message: z.string().describe("Message lisible en français destiné à l'UI ou à un agent IA."),
  details: z
    .unknown()
    .optional()
    .describe('Contexte additionnel optionnel (champs invalides, ids référencés, etc.).'),
})

export type ErrorApiModel = z.infer<typeof errorApiModelSchema>

export const validationIssueApiModelSchema = z.object({
  path: z
    .array(z.union([z.string(), z.number()]))
    .describe('Chemin Zod de la donnée invalide (ex. ["items", 2, "date"]).'),
  message: z.string().describe('Message Zod en français.'),
  code: z.string().describe('Code Zod (ex. custom, invalid_type).'),
})
export type ValidationIssueApiModel = z.infer<typeof validationIssueApiModelSchema>

export const validationErrorApiModelSchema = z.object({
  code: z.literal('VALIDATION_ERROR'),
  message: z.string(),
  details: z.object({ issues: z.array(validationIssueApiModelSchema) }),
})
export type ValidationErrorApiModel = z.infer<typeof validationErrorApiModelSchema>
