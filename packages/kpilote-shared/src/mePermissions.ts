import { z } from 'zod'

import { collectionPermissionActionSchema, indicateurPermissionActionSchema } from './permission'

const collectionPermissionEntrySchema = z.object({
  id: z.string().describe('Identifiant public de la collection (`COL-…`).'),
  actions: z
    .array(collectionPermissionActionSchema)
    .min(1)
    .describe('Actions accordées. Triées `READ` avant `WRITE_COMMENT`.'),
})

const indicateurPermissionEntrySchema = z.object({
  id: z.string().describe("Identifiant public de l'indicateur (`IND-…`)."),
  actions: z
    .array(indicateurPermissionActionSchema)
    .min(1)
    .describe('Actions accordées. Triées `READ` avant `WRITE_DATA` avant `WRITE_COMMENT`.'),
})

export const mePermissionsApiModelSchema = z.object({
  isAdmin: z
    .literal(true)
    .optional()
    .describe(
      'Présent uniquement pour les principals admin (API key de rôle ADMIN). Quand présent, le ' +
        'client doit considérer toute action autorisée et ignorer `collections`/`indicateurs` ' +
        '(retournés vides). Pour les principals standards, ce champ est absent.',
    ),
  collections: z
    .array(collectionPermissionEntrySchema)
    .describe(
      "Permissions explicites du principal sur les collections, triées par `id` ASC. N'inclut PAS " +
        'le READ implicite des collections `PUBLIC` (le client le sait en affichant la collection).',
    ),
  indicateurs: z
    .array(indicateurPermissionEntrySchema)
    .describe(
      'Permissions du principal sur les indicateurs, triées par `id` ASC. Inclut les permissions ' +
        'directes et le READ dans le cas où le principal possède READ ou WRITE_COMMENT sur une ' +
        'collection contenant cet indicateur (propagation). ' +
        'WRITE_DATA et WRITE_COMMENT ne se propagent jamais depuis une collection. ' +
        "N'inclut PAS le READ implicite des indicateurs `PUBLIC`.",
    ),
})

export type MePermissionsApiModel = z.infer<typeof mePermissionsApiModelSchema>

export type CollectionPermissionEntryApiModel = z.infer<typeof collectionPermissionEntrySchema>
export type IndicateurPermissionEntryApiModel = z.infer<typeof indicateurPermissionEntrySchema>
