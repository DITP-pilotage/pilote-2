import type { ValeurDateApiModel } from '@pilote/mb-shared/valeurAvancement'

export type Month = {
  year: number
  monthIndex: number
  date: Date
  key: string
}

export type MonthlySeries = {
  months: ReadonlyArray<Month>
  values: ReadonlyArray<number | null>
  defaultWindow: { startIndex: number; endIndex: number }
}

const ordinalOf = ({ year, monthIndex }: { year: number; monthIndex: number }): number =>
  year * 12 + monthIndex

const monthFromOrdinal = (ordinal: number): Month => {
  const year = Math.floor(ordinal / 12)
  const monthIndex = ((ordinal % 12) + 12) % 12
  return {
    year,
    monthIndex,
    date: new Date(Date.UTC(year, monthIndex, 1)),
    key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
  }
}

const monthFromIsoDate = (isoDate: string): Month => {
  const parsed = new Date(isoDate)
  return monthFromOrdinal(
    ordinalOf({ year: parsed.getUTCFullYear(), monthIndex: parsed.getUTCMonth() }),
  )
}

const currentMonth = (): Month => {
  const now = new Date()
  return monthFromOrdinal(ordinalOf({ year: now.getUTCFullYear(), monthIndex: now.getUTCMonth() }))
}

const latestValueByMonthKey = (
  valeurs: ReadonlyArray<ValeurDateApiModel>,
): Map<string, number> => {
  const latestDateByKey = new Map<string, string>()
  const valueByKey = new Map<string, number>()
  for (const { date, valeur } of valeurs) {
    const key = date.slice(0, 7)
    const previous = latestDateByKey.get(key)
    if (!previous || date > previous) {
      latestDateByKey.set(key, date)
      valueByKey.set(key, valeur)
    }
  }
  return valueByKey
}

const monthBounds = (
  valeurs: ReadonlyArray<ValeurDateApiModel>,
): { earliest: Month | undefined; latest: Month | undefined } => {
  let earliestDate: string | undefined
  let latestDate: string | undefined
  for (const { date } of valeurs) {
    if (!earliestDate || date < earliestDate) earliestDate = date
    if (!latestDate || date > latestDate) latestDate = date
  }
  return {
    earliest: earliestDate ? monthFromIsoDate(earliestDate) : undefined,
    latest: latestDate ? monthFromIsoDate(latestDate) : undefined,
  }
}

const enumerateMonths = ({ start, end }: { start: Month; end: Month }): Month[] => {
  const startOrdinal = ordinalOf(start)
  const endOrdinal = ordinalOf(end)
  const months: Month[] = []
  for (let ordinal = startOrdinal; ordinal <= endOrdinal; ordinal++) {
    months.push(monthFromOrdinal(ordinal))
  }
  return months
}

export const buildMonthlySeries = ({
  valeurs,
  windowSize,
}: {
  valeurs: ReadonlyArray<ValeurDateApiModel>
  windowSize: number
}): MonthlySeries => {
  const valueByKey = latestValueByMonthKey(valeurs)
  const { earliest, latest } = monthBounds(valeurs)
  const anchor = latest ?? currentMonth()
  const minStartOrdinal = ordinalOf(anchor) - (windowSize - 1)
  const startOrdinal = earliest
    ? Math.min(ordinalOf(earliest), minStartOrdinal)
    : minStartOrdinal
  const months = enumerateMonths({ start: monthFromOrdinal(startOrdinal), end: anchor })
  const values = months.map((month): number | null => valueByKey.get(month.key) ?? null)
  const lastIndex = months.length - 1
  return {
    months,
    values,
    defaultWindow: {
      startIndex: Math.max(0, lastIndex - (windowSize - 1)),
      endIndex: lastIndex,
    },
  }
}
