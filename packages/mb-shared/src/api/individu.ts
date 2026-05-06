import { z } from 'zod'

import { createPaginatedApiListSchema } from './pagination'
import { referentielPublicIdSchema } from './referentiel'

export const individuPublicIdSchema = z
  .string()
  .regex(
    /^[A-Za-z][A-Za-z0-9-]{0,63}$/,
    'Identifiant public d\'individu attendu (lettre suivie de lettres/chiffres/tirets, max 64 caractères)',
  )
  .describe(
    "Identifiant public d'individu, format humain-friendly (ex. Dept-84, Reg-93, FR). Lettre puis lettres/chiffres/tirets, max 64 caractères.",
  )

export const individuApiModelSchema = z.object({
  id: individuPublicIdSchema,
  nom: z.string().describe("Nom lisible de l'individu."),
  referentiels: z
    .array(referentielPublicIdSchema)
    .describe("Référentiels auxquels l'individu appartient."),
  metadata: z
    .record(z.string(), z.unknown())
    .nullable()
    .describe(
      "Métadonnées libres associées à l'individu (ex. code INSEE, clé géographique pour la cartographie).",
    ),
  createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
  updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière mise à jour.'),
})
export type IndividuApiModel = z.infer<typeof individuApiModelSchema>

export const individuListApiModelSchema = createPaginatedApiListSchema(individuApiModelSchema)
export type IndividuListApiModel = z.infer<typeof individuListApiModelSchema>

export const listIndividusForReferentielQuerySchema = z.object({
  recherche: z.string().optional().describe("Filtre case-insensitive sur le nom de l'individu."),
  cursor: individuPublicIdSchema
    .optional()
    .describe(
      'Cursor de pagination (renvoyé par la réponse précédente). Vide pour la première page.',
    ),
})
export type ListIndividusForReferentielQuery = z.infer<typeof listIndividusForReferentielQuerySchema>
