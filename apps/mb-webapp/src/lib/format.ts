import { Temporal } from '@js-temporal/polyfill'

const numberFr = new Intl.NumberFormat('fr-FR')
const variationFr = new Intl.NumberFormat('fr-FR', { signDisplay: 'exceptZero' })
const dateFr = new Intl.DateTimeFormat('fr-FR')
const monthYearShortOptions = { month: 'short', year: '2-digit' } as const
const monthYearShortFr = new Intl.DateTimeFormat('fr-FR', monthYearShortOptions)
const monthYearNumericOptions = { month: '2-digit', year: 'numeric' } as const
const monthYearNumericFr = new Intl.DateTimeFormat('fr-FR', monthYearNumericOptions)

const toDate = (value: Date | string): Date => (typeof value === 'string' ? new Date(value) : value)

export const formatNumberFr = (value: number): string => numberFr.format(value)

export const formatVariationFr = (value: number): string => variationFr.format(value)

export const formatDateFr = (value: Date | string): string => dateFr.format(toDate(value))

export const formatDateTimeFr = (value: Date | string): string =>
  toDate(value).toLocaleString('fr-FR')

// `PlainYearMonth.toLocaleString('fr-FR', …)` lève un `RangeError` à cause
// d'un mismatch de calendrier (iso8601 → gregory du locale fr-FR). On passe
// par `PlainDate(day=1)` qui, lui, accepte la conversion implicite. Le jour
// arbitraire ne sort pas du formattage tant qu'on demande uniquement mois+année.
const monthYearAsPlainDate = (ym: Temporal.PlainYearMonth): Temporal.PlainDate =>
  ym.toPlainDate({ day: 1 })

// Accepte `Temporal.PlainYearMonth` (formatage natif sans `Date` JS) en plus
// des entrées historiques `Date | string` — utilisé sur des buckets mensuels
// pour lesquels on veut un libellé fr-FR court (ex. "mars 25").
export const formatMonthYearShortFr = (value: Date | string | Temporal.PlainYearMonth): string =>
  value instanceof Temporal.PlainYearMonth
    ? monthYearAsPlainDate(value).toLocaleString('fr-FR', monthYearShortOptions)
    : monthYearShortFr.format(toDate(value))

export const formatMonthYearNumericFr = (value: Date | string | Temporal.PlainYearMonth): string =>
  value instanceof Temporal.PlainYearMonth
    ? monthYearAsPlainDate(value).toLocaleString('fr-FR', monthYearNumericOptions)
    : monthYearNumericFr.format(toDate(value))
