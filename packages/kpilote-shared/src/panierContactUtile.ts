import { z } from 'zod'

export const contactUtileApiModelSchema = z.object({
  id: z.string(),
  nom: z.string(),
  description: z.string().nullable(),
  telephone: z.string().nullable(),
  email: z.string().email().nullable(),
  url: z.string().nullable(),
  adresse: z.string().nullable(),
})
export type ContactUtileApiModel = z.infer<typeof contactUtileApiModelSchema>

export const panierContactsUtilesGroupSchema = z.object({
  organisme: z.object({
    id: z.string(),
    nom: z.string(),
  }),
  contacts: z.array(contactUtileApiModelSchema),
})
export type PanierContactsUtilesGroup = z.infer<typeof panierContactsUtilesGroupSchema>
