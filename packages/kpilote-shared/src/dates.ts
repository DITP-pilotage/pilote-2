import { z } from 'zod'

export const isValidCalendarDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, yearStr, monthStr, dayStr] = match
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format ISO YYYY-MM-DD')
  .refine(isValidCalendarDate, 'Date calendaire invalide')
  .describe('Date au format ISO YYYY-MM-DD.')

export const dateTruncSchema = z
  .enum(['day', 'week', 'month', 'quarter', 'year'])
  .describe(
    'Granularité temporelle de troncature appliquée aux dates des points. `day` = pas de ' +
      'troncature ; `week` = lundi ISO 8601 ; `month` = 1er du mois ; `quarter` = 1er des ' +
      'trimestres calendaires (janvier, avril, juillet, octobre) ; `year` = 1er janvier. ' +
      'Quand plusieurs saisies tombent dans le même bucket pour un individu, la plus récente ' +
      'est retenue.',
  )
export type DateTrunc = z.infer<typeof dateTruncSchema>

// Ordre du plus fin au plus grossier — utilisé pour valider que la granularité
// d'un côté (ex. objectifs) n'est pas plus fine que celle de l'autre (ex.
// valeurs) : un objectif qui change plus souvent que les mesures n'a pas de
// sens car aucune valeur ne pourrait évaluer sa progression.
const DATE_TRUNC_ORDER: Record<DateTrunc, number> = {
  day: 1,
  week: 2,
  month: 3,
  quarter: 4,
  year: 5,
}

export const isCoarserOrEqual = (a: DateTrunc, b: DateTrunc): boolean =>
  DATE_TRUNC_ORDER[a] >= DATE_TRUNC_ORDER[b]
