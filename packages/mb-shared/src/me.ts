import { z } from 'zod'

export const meApiModelSchema = z.object({
  userId: z.string().describe("Identifiant stable de l'utilisateur authentifié."),
  prenom: z.string().optional().describe("Prénom de l'utilisateur (claim given_name)."),
  nom: z.string().optional().describe("Nom de l'utilisateur (claim family_name)."),
  source: z.literal('jwt').describe("Origine de l'authentification."),
})

export type MeApiModel = z.infer<typeof meApiModelSchema>
