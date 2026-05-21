const numberFr = new Intl.NumberFormat('fr-FR')
const variationFr = new Intl.NumberFormat('fr-FR', { signDisplay: 'exceptZero' })
const dateFr = new Intl.DateTimeFormat('fr-FR')
const monthYearShortFr = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' })
const monthYearNumericFr = new Intl.DateTimeFormat('fr-FR', {
  month: '2-digit',
  year: 'numeric',
})

const toDate = (value: Date | string): Date => (typeof value === 'string' ? new Date(value) : value)

export const formatNumberFr = (value: number): string => numberFr.format(value)

export const formatVariationFr = (value: number): string => variationFr.format(value)

export const formatDateFr = (value: Date | string): string => dateFr.format(toDate(value))

export const formatDateTimeFr = (value: Date | string): string =>
  toDate(value).toLocaleString('fr-FR')

export const formatMonthYearShortFr = (value: Date | string): string =>
  monthYearShortFr.format(toDate(value))

export const formatMonthYearNumericFr = (value: Date | string): string =>
  monthYearNumericFr.format(toDate(value))
