import { z } from 'zod'

export const responsableApiModelSchema = z.object({
  id: z.string().uuid().describe("Identifiant (UUID) de l'utilisateur responsable."),
  email: z.string().email(),
  nom: z.string(),
  prenom: z.string(),
  service: z.string(),
  fonction: z.string(),
})
export type ResponsableApiModel = z.infer<typeof responsableApiModelSchema>
