import { z } from 'zod'

import { indicateurPublicIdSchema } from './indicateur'
import { individuApiModelSchema, individuPublicIdSchema } from './individu'
import { createPaginatedApiListSchema } from './pagination'
import { referentielPublicIdSchema } from './referentiel'

export const dateObservationSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format ISO YYYY-MM-DD')
  .describe("Date d'observation au format ISO YYYY-MM-DD.")

export const valeurAvancementApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  dateObservation: dateObservationSchema,
  valeur: z.number().describe('Valeur observée.'),
})
export type ValeurAvancementApiModel = z.infer<typeof valeurAvancementApiModelSchema>

export const valeurAvancementListApiModelSchema = z.object({
  items: z
    .array(valeurAvancementApiModelSchema)
    .describe('Observations correspondant aux individus demandés et à la plage de dates.'),
})
export type ValeurAvancementListApiModel = z.infer<typeof valeurAvancementListApiModelSchema>

const individusCsvSchema = z
  .string()
  .min(1, 'Au moins un identifiant d\'individu est requis')
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(z.array(individuPublicIdSchema).min(1))

export const listValeursForIndicateurQuerySchema = z
  .object({
    individus: individusCsvSchema.describe(
      "Liste d'identifiants d'individus séparés par une virgule (ex. Dept-84,Dept-13). Au moins un identifiant requis.",
    ),
    dateDebut: dateObservationSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre observations >= dateDebut).',
    ),
    dateFin: dateObservationSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre observations <= dateFin).',
    ),
  })
  .refine(
    (value) => !value.dateDebut || !value.dateFin || value.dateDebut <= value.dateFin,
    {
      message: 'dateDebut doit être <= dateFin',
      path: ['dateDebut'],
    },
  )
export type ListValeursForIndicateurQuery = z.infer<typeof listValeursForIndicateurQuerySchema>

export const individuAvecObservationsApiModelSchema = z.object({
  individu: individuApiModelSchema,
  derniereObservation: z
    .object({
      dateObservation: dateObservationSchema,
      valeur: z.number().describe('Valeur observée.'),
    })
    .describe("Observation la plus récente pour cet individu sur l'indicateur."),
  nombreObservations: z
    .number()
    .int()
    .nonnegative()
    .describe("Nombre total d'observations pour cet individu sur l'indicateur."),
})
export type IndividuAvecObservationsApiModel = z.infer<
  typeof individuAvecObservationsApiModelSchema
>

export const individusWithValeursListApiModelSchema = createPaginatedApiListSchema(
  individuAvecObservationsApiModelSchema,
)
export type IndividusWithValeursListApiModel = z.infer<
  typeof individusWithValeursListApiModelSchema
>

export const listIndividusWithValeursQuerySchema = z.object({
  referentiel: referentielPublicIdSchema
    .optional()
    .describe('Filtre sur la population du référentiel donné.'),
  cursor: individuPublicIdSchema
    .optional()
    .describe(
      'Cursor de pagination (renvoyé par la réponse précédente). Vide pour la première page.',
    ),
})
export type ListIndividusWithValeursQuery = z.infer<typeof listIndividusWithValeursQuerySchema>
