import { z } from 'zod'

export const contactUtileApiModelSchema = z.object({
  id:          z.string().uuid(),
  nom:         z.string(),
  description: z.string().nullable(),
  telephone:   z.string().nullable(),
  email:       z.string().nullable(),
  url:         z.string().nullable(),
  adresse:     z.string().nullable(),
})

export const organismeAvecContactsApiModelSchema = z.object({
  organisme: z.object({
    id:  z.string().uuid(),
    nom: z.string(),
  }),
  contacts: z.array(contactUtileApiModelSchema),
})

export const panierContactsUtilesApiModelSchema = z.object({
  items: z.array(organismeAvecContactsApiModelSchema),
})

export type ContactUtileApiModel          = z.infer<typeof contactUtileApiModelSchema>
export type OrganismeAvecContactsApiModel = z.infer<typeof organismeAvecContactsApiModelSchema>
export type PanierContactsUtilesApiModel  = z.infer<typeof panierContactsUtilesApiModelSchema>
