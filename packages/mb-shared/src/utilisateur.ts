import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'

export const providerTypeSchema = z.enum(['proconnect', 'keycloak'])
export type ProviderTypeValue = z.infer<typeof providerTypeSchema>

export const utilisateurStatusSchema = z.enum(['en_attente', 'actif'])
export type UtilisateurStatus = z.infer<typeof utilisateurStatusSchema>

export const utilisateurApiModelSchema = z.object({
  id: z.string().uuid().describe("Identifiant unique de l'utilisateur (UUID)."),
  email: z.string().email().describe('Adresse email (clé du linking OIDC, immuable).'),
  nom: z.string().describe('Nom.'),
  prenom: z.string().describe('Prénom.'),
  service: z.string().describe('Service métier.'),
  fonction: z.string().describe('Fonction.'),
  status: utilisateurStatusSchema.describe(
    "Statut dérivé : `en_attente` tant qu'aucune identité OIDC n'est rattachée, `actif` sinon.",
  ),
  providers: z
    .array(providerTypeSchema)
    .describe('Providers OIDC rattachés (vide si `status = en_attente`).'),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type UtilisateurApiModel = z.infer<typeof utilisateurApiModelSchema>

export const utilisateurListApiModelSchema = createPaginatedApiListSchema(utilisateurApiModelSchema)
export type UtilisateurListApiModel = z.infer<typeof utilisateurListApiModelSchema>

export const listUtilisateursQuerySchema = listQuerySchema
export type ListUtilisateursQuery = z.infer<typeof listUtilisateursQuerySchema>

export const createUtilisateurBodySchema = z.object({
  email: z.string().email().describe('Adresse email (clé du linking OIDC).'),
  nom: z.string().trim().min(1).describe('Nom.'),
  prenom: z.string().trim().min(1).describe('Prénom.'),
  service: z.string().trim().min(1).describe('Service métier.'),
  fonction: z.string().trim().min(1).describe('Fonction.'),
})
export type CreateUtilisateurBody = z.infer<typeof createUtilisateurBodySchema>

export const updateUtilisateurBodySchema = z.object({
  nom: z.string().trim().min(1).describe('Nom.'),
  prenom: z.string().trim().min(1).describe('Prénom.'),
  service: z.string().trim().min(1).describe('Service métier.'),
  fonction: z.string().trim().min(1).describe('Fonction.'),
})
export type UpdateUtilisateurBody = z.infer<typeof updateUtilisateurBodySchema>
