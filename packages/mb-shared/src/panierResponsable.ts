import { z } from 'zod'

export const panierResponsableApiModelSchema = z.object({
  email:    z.string().email(),
  nom:      z.string(),
  prenom:   z.string(),
  service:  z.string(),
  fonction: z.string(),
})
export type PanierResponsableApiModel = z.infer<typeof panierResponsableApiModelSchema>

export const panierResponsablesApiModelSchema = z.object({
  items: z.array(panierResponsableApiModelSchema),
})
export type PanierResponsablesApiModel = z.infer<typeof panierResponsablesApiModelSchema>
