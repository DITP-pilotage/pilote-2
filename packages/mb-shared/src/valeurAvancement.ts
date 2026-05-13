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

const truncateTo2Decimals = (value: number): number => {
  const scaled = Math.round(value * 1e10) / 1e8
  return Math.trunc(scaled) / 100
}

export const upsertValeurAvancementBodySchema = z.object({
  individu: individuPublicIdSchema,
  date: dateSchema,
  valeur: z
    .number()
    .finite()
    .transform(truncateTo2Decimals)
    .describe(
      'Valeur observée. Tronquée vers zéro à 2 décimales côté serveur pour respecter la précision stockée (Decimal(20,2)).',
    ),
})
export type UpsertValeurAvancementBody = z.infer<typeof upsertValeurAvancementBodySchema>

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

const MAX_REFERENTIELS_PAR_REQUETE = 100

const referentielsCsvSchema = z
  .string()
  .min(1, 'Au moins un identifiant de référentiel est requis')
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(
    z
      .array(referentielPublicIdSchema)
      .min(1)
      .max(
        MAX_REFERENTIELS_PAR_REQUETE,
        `Au plus ${MAX_REFERENTIELS_PAR_REQUETE} référentiels par requête`,
      ),
  )

export const valeursRemarquablesReferentielApiModelSchema = z.object({
  referentiel: referentielPublicIdSchema,
  min: z
    .number()
    .nullable()
    .describe(
      "Plus petite valeur la plus récente parmi les individus du référentiel ayant au moins une valeur " +
        "pour l'indicateur. null si aucun individu n'a de valeur.",
    ),
  max: z
    .number()
    .nullable()
    .describe(
      "Plus grande valeur la plus récente parmi les individus du référentiel ayant au moins une valeur " +
        "pour l'indicateur. null si aucun individu n'a de valeur.",
    ),
  mediane: z
    .number()
    .nullable()
    .describe(
      "Médiane des valeurs les plus récentes des individus du référentiel ayant au moins une valeur " +
        "pour l'indicateur. Moyenne des deux valeurs centrales si le nombre d'individus est pair. " +
        "null si aucun individu n'a de valeur.",
    ),
})
export type ValeursRemarquablesReferentielApiModel = z.infer<
  typeof valeursRemarquablesReferentielApiModelSchema
>

export const valeursRemarquablesListApiModelSchema = z.object({
  items: z
    .array(valeursRemarquablesReferentielApiModelSchema)
    .describe('Valeurs remarquables agrégées pour chaque référentiel demandé existant.'),
})
export type ValeursRemarquablesListApiModel = z.infer<
  typeof valeursRemarquablesListApiModelSchema
>

export const listValeursRemarquablesForIndicateurQuerySchema = z.object({
  referentiels: referentielsCsvSchema.describe(
    `Liste d'identifiants de référentiels séparés par une virgule (ex. REF-DEPT,REF-REG). 1..${MAX_REFERENTIELS_PAR_REQUETE} identifiants.`,
  ),
})
export type ListValeursRemarquablesForIndicateurQuery = z.infer<
  typeof listValeursRemarquablesForIndicateurQuerySchema
>

export const syntheseIndividuApiModelSchema = z.object({
  individu: individuPublicIdSchema,
  variation: z
    .number()
    .nullable()
    .describe(
      "Variation absolue entre la valeur la plus récente et la précédente (par date de la valeur). " +
        "null si l'individu n'a aucune valeur ; égale à la valeur la plus récente s'il n'en a qu'une (comparée à 0).",
    ),
  ecartMediane: z
    .number()
    .nullable()
    .describe(
      "Écart entre la valeur la plus récente de l'individu et la médiane des valeurs les plus récentes " +
        "des individus de son référentiel ayant au moins une valeur pour l'indicateur. " +
        "null si l'individu n'a aucune valeur ou si la médiane n'est pas calculable.",
    ),
})
export type SyntheseIndividuApiModel = z.infer<typeof syntheseIndividuApiModelSchema>

export const syntheseIndividusListApiModelSchema = z.object({
  items: z
    .array(syntheseIndividuApiModelSchema)
    .describe('Synthèse pour chaque individu demandé ayant été trouvé.'),
})
export type SyntheseIndividusListApiModel = z.infer<typeof syntheseIndividusListApiModelSchema>

export const listSyntheseIndividusQuerySchema = z.object({
  individus: individusCsvSchema.describe(
    `Liste d'identifiants d'individus séparés par une virgule (ex. DEPT-84,DEPT-13). 1..${MAX_INDIVIDUS_PAR_REQUETE} identifiants.`,
  ),
})
export type ListSyntheseIndividusQuery = z.infer<typeof listSyntheseIndividusQuerySchema>

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
