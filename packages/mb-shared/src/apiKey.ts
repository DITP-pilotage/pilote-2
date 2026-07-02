import { z } from 'zod'

export const apiKeyRoleSchema = z.enum(['CONTRIBUTOR', 'ADMIN'])
export type ApiKeyRoleValue = z.infer<typeof apiKeyRoleSchema>

export const apiKeyStatusSchema = z.enum(['active', 'expired', 'revoked'])
export type ApiKeyStatus = z.infer<typeof apiKeyStatusSchema>

export const apiKeyApiModelSchema = z.object({
  id: z.string().describe('Identifiant unique de la clé (UUID).'),
  label: z.string().describe('Étiquette lisible de la clé.'),
  prefix: z.string().describe("Préfixe visible de la clé (pour l'identifier)."),
  role: apiKeyRoleSchema.describe('Rôle de la clé.'),
  status: apiKeyStatusSchema.describe('Statut dérivé : active, expired ou revoked.'),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .describe("Date ISO 8601 d'expiration (null si la clé n'expire pas)."),
  revokedAt: z
    .string()
    .datetime()
    .nullable()
    .describe('Date ISO 8601 de révocation (null si la clé est active).'),
  lastUsedAt: z
    .string()
    .datetime()
    .nullable()
    .describe('Date ISO 8601 de dernière utilisation (null si jamais utilisée).'),
})
export type ApiKeyApiModel = z.infer<typeof apiKeyApiModelSchema>

export const apiKeyListApiModelSchema = z.array(apiKeyApiModelSchema)
export type ApiKeyListApiModel = z.infer<typeof apiKeyListApiModelSchema>

export const createdApiKeyApiModelSchema = apiKeyApiModelSchema.extend({
  rawKey: z
    .string()
    .describe('Clé API en clair. Affichée une seule fois, non re-affichable ensuite.'),
})
export type CreatedApiKeyApiModel = z.infer<typeof createdApiKeyApiModelSchema>

export const createApiKeyBodySchema = z.object({
  label: z.string().min(1).describe('Étiquette lisible de la clé.'),
  role: apiKeyRoleSchema.default('CONTRIBUTOR').describe('Rôle de la clé (défaut CONTRIBUTOR).'),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe("Date ISO 8601 d'expiration (optionnelle)."),
})
export type CreateApiKeyBody = z.infer<typeof createApiKeyBodySchema>
