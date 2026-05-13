import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { referentielPublicIdSchema } from './publicIds'

export const indicateurPublicIdSchema = z
  .string()
  .regex(/^IND-\d+$/, 'Identifiant public attendu au format IND-XXX')
  .describe("Identifiant public de l'indicateur (format IND-XXX).")

export const indicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'indicateur."),
  referentielIds: z
    .array(referentielPublicIdSchema)
    .describe('Référentiels liés à l\'indicateur, triés par identifiant public ASC. Tableau vide si aucun lien.'),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type IndicateurApiModel = z.infer<typeof indicateurApiModelSchema>

export const indicateurListApiModelSchema = createPaginatedApiListSchema(indicateurApiModelSchema)
export type IndicateurListApiModel = z.infer<typeof indicateurListApiModelSchema>

export const listIndicateursQuerySchema = listQuerySchema
export type ListIndicateursQuery = z.infer<typeof listIndicateursQuerySchema>

export const upsertIndicateurBodySchema = z.object({
  nom: z.string().min(1).describe("Nom lisible de l'indicateur."),
  referentielIds: z
    .array(referentielPublicIdSchema)
    .describe(
      'Liste complète des référentiels à lier à l\'indicateur (replace-all à chaque PUT). ' +
        'Tableau vide pour ne lier aucun référentiel. Doublons silencieusement dédupliqués.',
    ),
})
export type UpsertIndicateurBody = z.infer<typeof upsertIndicateurBodySchema>
