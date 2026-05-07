import { z } from 'zod'

export const meApiModelSchema = z.object({
  userId: z.string().describe("Identifiant stable de l'utilisateur authentifié."),
  prenom: z.string().describe("Prénom de l'utilisateur (claim given_name)."),
  nom: z.string().describe("Nom de l'utilisateur (claim family_name)."),
})

export type MeApiModel = z.infer<typeof meApiModelSchema>
