import { z } from 'zod'

// --- Indicateur --------------------------------------------------------------

export const indicateurPermissionActionSchema = z.enum(['READ', 'WRITE_DATA', 'WRITE_COMMENT'])
export type IndicateurPermissionActionValue = z.infer<typeof indicateurPermissionActionSchema>
export const IndicateurPermissionAction = indicateurPermissionActionSchema.enum
export type IndicateurPermissionWriteActionValue = Exclude<IndicateurPermissionActionValue, 'READ'>

// --- Collection --------------------------------------------------------------

export const collectionPermissionActionSchema = z.enum(['READ', 'WRITE_COMMENT'])
export type CollectionPermissionActionValue = z.infer<typeof collectionPermissionActionSchema>
export const CollectionPermissionAction = collectionPermissionActionSchema.enum

// --- Commun ------------------------------------------------------------------

export const permissionResourceTypeSchema = z.enum(['COLLECTION', 'INDICATEUR'])
export type PermissionResourceType = z.infer<typeof permissionResourceTypeSchema>

const directIndicateurPermissionSchema = z.object({
  publicId: z.string().describe('Identifiant public de la ressource (`IND-…`).'),
  nom: z.string().describe('Nom lisible de la ressource.'),
  actions: z
    .array(indicateurPermissionActionSchema)
    .min(1)
    .describe(
      'Actions directes accordées, triées `READ` avant `WRITE_DATA` avant `WRITE_COMMENT`.',
    ),
})

const directCollectionPermissionSchema = z.object({
  publicId: z.string().describe('Identifiant public de la ressource (`COL-…`).'),
  nom: z.string().describe('Nom lisible de la ressource.'),
  actions: z
    .array(collectionPermissionActionSchema)
    .min(1)
    .describe('Actions directes accordées, triées `READ` avant `WRITE_COMMENT`.'),
})

const indicateurHeriteSchema = z.object({
  publicId: z.string().describe("Identifiant public de l'indicateur hérité."),
  nom: z.string().describe("Nom lisible de l'indicateur."),
  viaCollectionPublicId: z.string().describe('Collection source de la propagation READ.'),
  viaCollectionNom: z.string().describe('Nom de la collection source.'),
})

export const principalPermissionsApiModelSchema = z.object({
  collections: z
    .array(directCollectionPermissionSchema)
    .describe('Permissions directes sur les collections, triées par `publicId` ASC.'),
  indicateurs: z
    .array(directIndicateurPermissionSchema)
    .describe('Permissions directes sur les indicateurs, triées par `publicId` ASC.'),
  indicateursHerites: z
    .array(indicateurHeriteSchema)
    .describe(
      'Indicateurs en READ hérité via une collection (propagation), lecture seule. Exclut ceux ' +
        'déjà présents en direct dans `indicateurs`. Triés par `publicId` ASC.',
    ),
})
export type PrincipalPermissionsApiModel = z.infer<typeof principalPermissionsApiModelSchema>

export const listPrincipalPermissionsQuerySchema = z.object({
  principalId: z.string().uuid().describe('Identifiant (UUID) du principal.'),
})
export type ListPrincipalPermissionsQuery = z.infer<typeof listPrincipalPermissionsQuerySchema>

// --- Requêtes indicateur -----------------------------------------------------

export const grantIndicateurPermissionBodySchema = z.object({
  principalId: z.string().uuid().describe('Principal (UUID) à qui accorder le droit.'),
  indicateurPublicId: z.string().describe("Identifiant public de l'indicateur (`IND-…`)."),
  action: indicateurPermissionActionSchema,
})
export type GrantIndicateurPermissionBody = z.infer<typeof grantIndicateurPermissionBodySchema>

export const revokeIndicateurPermissionQuerySchema = z.object({
  principalId: z.string().uuid(),
  indicateurPublicId: z.string(),
  action: indicateurPermissionActionSchema
    .optional()
    .describe("Action à retirer. Si absent, retire toutes les actions de l'indicateur."),
})
export type RevokeIndicateurPermissionQuery = z.infer<typeof revokeIndicateurPermissionQuerySchema>

// --- Requêtes collection -----------------------------------------------------

export const grantCollectionPermissionBodySchema = z.object({
  principalId: z.string().uuid().describe('Principal (UUID) à qui accorder le droit.'),
  collectionPublicId: z.string().describe('Identifiant public de la collection (`COL-…`).'),
  action: collectionPermissionActionSchema,
})
export type GrantCollectionPermissionBody = z.infer<typeof grantCollectionPermissionBodySchema>

export const collectionPermissionPrincipalTypeSchema = z.enum(['UTILISATEUR', 'API_KEY'])
export type CollectionPermissionPrincipalType = z.infer<
  typeof collectionPermissionPrincipalTypeSchema
>

export const collectionPermissionsApiModelSchema = z.object({
  items: z
    .array(
      z.object({
        principalId: z.string().uuid(),
        type: collectionPermissionPrincipalTypeSchema,
        libelle: z
          .string()
          .describe("Email de l'utilisateur, ou libellé de la clé API selon le `type`."),
        actions: z
          .array(collectionPermissionActionSchema)
          .min(1)
          .describe('Triées `READ` avant `WRITE_COMMENT`.'),
      }),
    )
    .describe(
      "Principals disposant d'une permission directe sur la collection, triés par `type` puis `libelle`.",
    ),
})
export type CollectionPermissionsApiModel = z.infer<typeof collectionPermissionsApiModelSchema>

export const revokeCollectionPermissionQuerySchema = z.object({
  principalId: z.string().uuid(),
  collectionPublicId: z.string(),
  action: collectionPermissionActionSchema
    .optional()
    .describe('Action à retirer. Si absent, retire toutes les actions de la collection.'),
})
export type RevokeCollectionPermissionQuery = z.infer<typeof revokeCollectionPermissionQuerySchema>
