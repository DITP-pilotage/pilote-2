import { z } from 'zod'

import { indicateurPublicIdSchema } from './indicateur'
import { individuApiModelSchema, individuPublicIdSchema } from './individu'
import {
  createPaginatedApiListSchema,
  pageSizeSchema,
  paginationCursorSchema,
} from './pagination'
import { referentielPublicIdSchema } from './referentiel'

const isValidCalendarDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, yearStr, monthStr, dayStr] = match
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format ISO YYYY-MM-DD')
  .refine(isValidCalendarDate, 'Date calendaire invalide')
  .describe('Date au format ISO YYYY-MM-DD.')

export const valeurSchema = z.number().describe('Valeur observée.')

export const valeurDateApiModelSchema = z.object({
  date: dateSchema,
  valeur: valeurSchema,
})
export type ValeurDateApiModel = z.infer<typeof valeurDateApiModelSchema>

export const valeurAvancementApiModelSchema = valeurDateApiModelSchema.extend({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
})
export type ValeurAvancementApiModel = z.infer<typeof valeurAvancementApiModelSchema>

export const valeurAvancementListApiModelSchema = z.object({
  items: z
    .array(valeurAvancementApiModelSchema)
    .describe('Valeurs correspondant aux individus demandés et à la plage de dates.'),
})
export type ValeurAvancementListApiModel = z.infer<typeof valeurAvancementListApiModelSchema>

const MAX_INDIVIDUS_PAR_REQUETE = 100

const individusCsvSchema = z
  .string()
  .min(1, "Au moins un identifiant d'individu est requis")
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(
    z
      .array(individuPublicIdSchema)
      .min(1)
      .max(MAX_INDIVIDUS_PAR_REQUETE, `Au plus ${MAX_INDIVIDUS_PAR_REQUETE} individus par requête`),
  )

export const listValeursForIndicateurQuerySchema = z
  .object({
    individus: individusCsvSchema.describe(
      `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
    ),
    dateDebut: dateSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre valeurs >= dateDebut).',
    ),
    dateFin: dateSchema.optional().describe(
      'Date ISO YYYY-MM-DD inclusive (filtre valeurs <= dateFin).',
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

export const individuAvecValeursApiModelSchema = z.object({
  individu: individuApiModelSchema,
  derniereValeur: valeurDateApiModelSchema.describe(
    "Valeur la plus récente pour cet individu sur l'indicateur.",
  ),
  nombreValeurs: z
    .number()
    .int()
    .nonnegative()
    .describe("Nombre total de valeurs pour cet individu sur l'indicateur."),
})
export type IndividuAvecValeursApiModel = z.infer<typeof individuAvecValeursApiModelSchema>

export const individusWithValeursListApiModelSchema = createPaginatedApiListSchema(
  individuAvecValeursApiModelSchema,
)
export type IndividusWithValeursListApiModel = z.infer<
  typeof individusWithValeursListApiModelSchema
>

export const listIndividusWithValeursQuerySchema = z.object({
  referentiel: referentielPublicIdSchema
    .optional()
    .describe('Filtre sur la population du référentiel donné.'),
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
})
export type ListIndividusWithValeursQuery = z.infer<typeof listIndividusWithValeursQuerySchema>
