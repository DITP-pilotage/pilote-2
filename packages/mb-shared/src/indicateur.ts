import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { referentielPublicIdSchema } from './publicIds'

export const indicateurPublicIdSchema = z
  .string()
  .regex(/^IND-\d+$/, 'Identifiant public attendu au format IND-XXX')
  .describe("Identifiant public de l'indicateur (format IND-XXX).")

export const fonctionAgregationSchema = z
  .enum(['SUM', 'NONE'])
  .describe(
    "Fonction d'agrégation appliquée pour dériver la valeur d'un parent depuis ses enfants. " +
      "`SUM` = somme des contributions ; `NONE` = indicateur non dérivable pour ce référentiel.",
  )
export type FonctionAgregation = z.infer<typeof fonctionAgregationSchema>

export const indicateurReferentielLinkSchema = z
  .object({
    referentielId: referentielPublicIdSchema,
    fonctionAgregation: fonctionAgregationSchema,
  })
  .describe("Lien indicateur-référentiel avec sa fonction d'agrégation.")
export type IndicateurReferentielLink = z.infer<typeof indicateurReferentielLinkSchema>

export const indicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'indicateur."),
  referentiels: z
    .array(indicateurReferentielLinkSchema)
    .describe(
      "Liens vers les référentiels associés, triés par `referentielId` ASC. Tableau vide si aucun lien.",
    ),
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
  referentiels: z
    .array(indicateurReferentielLinkSchema)
    .describe(
      'Liste complète des liens à appliquer (replace-all à chaque PUT). Tableau vide pour aucun lien. ' +
        "Doublons silencieusement dédupliqués sur `referentielId` ; en cas de fonctions différentes, la dernière occurrence l'emporte.",
    ),
})
export type UpsertIndicateurBody = z.infer<typeof upsertIndicateurBodySchema>
