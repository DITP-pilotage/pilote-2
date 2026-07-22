import { z } from 'zod'

export const permissionActionSchema = z.enum(['READ', 'WRITE'])
export type PermissionActionValue = z.infer<typeof permissionActionSchema>

export const permissionResourceTypeSchema = z.enum(['COLLECTION', 'INDICATEUR'])
export type PermissionResourceType = z.infer<typeof permissionResourceTypeSchema>

const directPermissionSchema = z.object({
  publicId: z.string().describe('Identifiant public de la ressource (`COL-…` / `IND-…`).'),
  nom: z.string().describe('Nom lisible de la ressource.'),
  actions: z
    .array(permissionActionSchema)
    .min(1)
    .describe('Actions directes accordées, triées `READ` avant `WRITE`.'),
})

const indicateurHeriteSchema = z.object({
  publicId: z.string().describe("Identifiant public de l'indicateur hérité."),
  nom: z.string().describe("Nom lisible de l'indicateur."),
  viaCollectionPublicId: z.string().describe('Collection source de la propagation READ.'),
  viaCollectionNom: z.string().describe('Nom du collection source.'),
})

export const principalPermissionsApiModelSchema = z.object({
  collections: z
    .array(directPermissionSchema)
    .describe('Permissions directes sur les collections, triées par `publicId` ASC.'),
  indicateurs: z
    .array(directPermissionSchema)
    .describe('Permissions directes sur les indicateurs, triées par `publicId` ASC.'),
  indicateursHerites: z
    .array(indicateurHeriteSchema)
    .describe(
      'Indicateurs en READ hérité via un collection (propagation), lecture seule. Exclut ceux ' +
        'déjà présents en direct dans `indicateurs`. Triés par `publicId` ASC.',
    ),
})
export type PrincipalPermissionsApiModel = z.infer<typeof principalPermissionsApiModelSchema>

export const listPrincipalPermissionsQuerySchema = z.object({
  principalId: z.string().uuid().describe('Identifiant (UUID) du principal.'),
})
export type ListPrincipalPermissionsQuery = z.infer<typeof listPrincipalPermissionsQuerySchema>

// --- Indicateur --------------------------------------------------------------

export const grantIndicateurPermissionBodySchema = z.object({
  principalId: z.string().uuid().describe('Principal (UUID) à qui accorder le droit.'),
  indicateurPublicId: z.string().describe("Identifiant public de l'indicateur (`IND-…`)."),
  action: permissionActionSchema,
})
export type GrantIndicateurPermissionBody = z.infer<typeof grantIndicateurPermissionBodySchema>

export const revokeIndicateurPermissionQuerySchema = z.object({
  principalId: z.string().uuid(),
  indicateurPublicId: z.string(),
  action: permissionActionSchema
    .optional()
    .describe("Action à retirer. Si absent, retire toutes les actions de l'indicateur."),
})
export type RevokeIndicateurPermissionQuery = z.infer<typeof revokeIndicateurPermissionQuerySchema>

// --- Collection -----------------------------------------------------------------

export const grantCollectionPermissionBodySchema = z.object({
  principalId: z.string().uuid().describe('Principal (UUID) à qui accorder le droit.'),
  collectionPublicId: z.string().describe('Identifiant public du collection (`COL-…`).'),
  action: permissionActionSchema,
})
export type GrantCollectionPermissionBody = z.infer<typeof grantCollectionPermissionBodySchema>

export const revokeCollectionPermissionQuerySchema = z.object({
  principalId: z.string().uuid(),
  collectionPublicId: z.string(),
  action: permissionActionSchema
    .optional()
    .describe('Action à retirer. Si absent, retire toutes les actions du collection.'),
})
export type RevokeCollectionPermissionQuery = z.infer<typeof revokeCollectionPermissionQuerySchema>
