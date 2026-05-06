import { z } from 'zod'

export const meApiModelSchema = z.object({
  userId: z.string().describe("Identifiant stable de l'utilisateur authentifié."),
  source: z.literal('jwt').describe("Origine de l'authentification."),
})

export type MeApiModel = z.infer<typeof meApiModelSchema>
