import { z } from 'zod'

export const responsableApiModelSchema = z.object({
  email:    z.string().email(),
  nom:      z.string(),
  prenom:   z.string(),
  service:  z.string(),
  fonction: z.string(),
})
export type ResponsableApiModel = z.infer<typeof responsableApiModelSchema>
