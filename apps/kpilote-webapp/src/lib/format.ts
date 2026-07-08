import { Temporal } from '@js-temporal/polyfill'
import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'

const numberFr = new Intl.NumberFormat('fr-FR')
const variationFr = new Intl.NumberFormat('fr-FR', { signDisplay: 'exceptZero' })
const dateFr = new Intl.DateTimeFormat('fr-FR')
const heureFr = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const monthYearShortOptions = { month: 'short', year: '2-digit' } as const
const monthYearShortFr = new Intl.DateTimeFormat('fr-FR', monthYearShortOptions)
const monthYearNumericOptions = { month: '2-digit', year: 'numeric' } as const
const monthYearNumericFr = new Intl.DateTimeFormat('fr-FR', monthYearNumericOptions)

const toDate = (value: Date | string): Date => (typeof value === 'string' ? new Date(value) : value)

export const formatNumberFr = (value: number): string => numberFr.format(value)

// Espace fine insécable (U+202F) entre la valeur et l'abréviation, conforme
// à la typographie fr-FR (`70 %`, `82 ans`).
const NBSP_FINE = '\u202F'

const formatAvecUnite = (
  format: Intl.NumberFormat,
  value: number,
  unite: UniteIndicateurApiModel | null,
): string =>
  unite?.abbreviation
    ? `${format.format(value)}${NBSP_FINE}${unite.abbreviation}`
    : format.format(value)

export const formatNumberAvecUniteFr = (
  value: number,
  unite: UniteIndicateurApiModel | null,
): string => formatAvecUnite(numberFr, value, unite)

export const formatVariationFr = (value: number): string => variationFr.format(value)

export const formatVariationAvecUniteFr = (
  value: number,
  unite: UniteIndicateurApiModel | null,
): string => formatAvecUnite(variationFr, value, unite)

export const formatDateFr = (value: Date | string): string => dateFr.format(toDate(value))

export const formatDateTimeFr = (value: Date | string): string =>
  toDate(value).toLocaleString('fr-FR')

// "25/06/2026 à 10:48" — sans les secondes (inutiles pour un horodatage de saisie).
export const formatDateHeureFr = (value: Date | string): string => {
  const date = toDate(value)
  return `${dateFr.format(date)} à ${heureFr.format(date)}`
}

// Accepte `Temporal.PlainDate` (formatage natif sans `Date` JS, conversion
// iso8601→gregory implicite côté locale fr-FR) en plus des entrées historiques
// `Date | string` — utilisé sur des buckets mensuels (1er du mois) pour
// lesquels on veut un libellé fr-FR court (ex. "mars 25").
export const formatMonthYearShortFr = (value: Date | string | Temporal.PlainDate): string =>
  value instanceof Temporal.PlainDate
    ? value.toLocaleString('fr-FR', monthYearShortOptions)
    : monthYearShortFr.format(toDate(value))

export const formatMonthYearNumericFr = (value: Date | string | Temporal.PlainDate): string =>
  value instanceof Temporal.PlainDate
    ? value.toLocaleString('fr-FR', monthYearNumericOptions)
    : monthYearNumericFr.format(toDate(value))

const moisAnneeLongOptions = { month: 'long', year: 'numeric' } as const

// "décembre 2024" — entrée ISO YYYY-MM-DD (dates dérivées de l'indicateur).
export const formatMoisAnneeLongFr = (value: string): string =>
  Temporal.PlainDate.from(value).toLocaleString('fr-FR', moisAnneeLongOptions)
