import { z } from 'zod'

import { createPaginatedApiListSchema, listQuerySchema } from './pagination'
import { referentielPublicIdSchema } from './publicIds'

export const indicateurPublicIdSchema = z
  .string()
  .regex(/^IND-\d+$/, 'Identifiant public attendu au format IND-XXX')
  .describe("Identifiant public de l'indicateur (format IND-XXX).")

export const indicateurVisibiliteSchema = z
  .enum(['PUBLIC', 'PRIVE'])
  .describe(
    "Visibilité de l'indicateur. PUBLIC : accessible en lecture à tout principal authentifié. PRIVE : accessible uniquement aux principals disposant d'une permission explicite.",
  )
export type IndicateurVisibilite = z.infer<typeof indicateurVisibiliteSchema>

export const fonctionAgregationSchema = z
  .enum(['SUM', 'NONE'])
  .describe(
    "Fonction d'agrégation appliquée pour calculer la valeur d'un parent à partir des valeurs " +
      "de ses enfants. `SUM` = somme des contributions des enfants. `NONE` = pas d'agrégation : " +
      "la valeur doit être saisie directement pour ce référentiel, elle n'est jamais dérivée depuis " +
      'les enfants.',
  )
export type FonctionAgregation = z.infer<typeof fonctionAgregationSchema>

export const configurationIndicateurReferentielSchema = z
  .object({
    referentielPublicId: referentielPublicIdSchema,
    fonctionAgregation: fonctionAgregationSchema,
  })
  .describe("Configuration d'un indicateur sur un référentiel donné.")
export type ConfigurationIndicateurReferentiel = z.infer<
  typeof configurationIndicateurReferentielSchema
>

export const indicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'indicateur."),
  visibilite: indicateurVisibiliteSchema,
  referentiels: z
    .array(configurationIndicateurReferentielSchema)
    .describe(
      'Configurations de cet indicateur sur chaque référentiel associé, triées par ' +
        '`referentielPublicId` ASC. Tableau vide si aucun référentiel.',
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
  visibilite: indicateurVisibiliteSchema,
  referentiels: z
    .array(configurationIndicateurReferentielSchema)
    .describe(
      'Liste complète des référentiels configurés pour cet indicateur (replace-all à chaque PUT). ' +
        'Tableau vide pour aucun référentiel. Doublons silencieusement dédupliqués sur ' +
        "`referentielPublicId` ; en cas de fonctions différentes, la dernière occurrence l'emporte.",
    ),
})
export type UpsertIndicateurBody = z.infer<typeof upsertIndicateurBodySchema>
