import type { TauxProgressionPointApiModel } from '@pilote/mb-shared/tauxProgression'
import type { ValeurDateApiModel } from '@pilote/mb-shared/valeurAvancement'
import { Temporal } from '@js-temporal/polyfill'

export type Month = {
  // `PlainYearMonth` représente exactement un bucket mensuel : pas de jour, pas
  // de fuseau, donc impossible d'introduire un offset qui décale le mois.
  bucket: Temporal.PlainYearMonth
  key: string
}

export type MonthlySeries = {
  months: ReadonlyArray<Month>
  values: ReadonlyArray<number | null>
  valeursCible: ReadonlyArray<number | null>
  tauxProgression: ReadonlyArray<number | null>
  defaultWindow: { startIndex: number; endIndex: number }
}

// `PlainYearMonth.from("2025-02-14")` ignore le jour et retient `2025-02` : la
// truncation au mois est faite par Temporal sans manipulation manuelle.
const parseMonth = (isoDate: string): Temporal.PlainYearMonth =>
  Temporal.PlainYearMonth.from(isoDate)

const toMonth = (bucket: Temporal.PlainYearMonth): Month => ({ bucket, key: bucket.toString() })

const compareMonths = (a: Temporal.PlainYearMonth, b: Temporal.PlainYearMonth): number =>
  Temporal.PlainYearMonth.compare(a, b)

const earlier = (
  a: Temporal.PlainYearMonth,
  b: Temporal.PlainYearMonth,
): Temporal.PlainYearMonth => (compareMonths(a, b) <= 0 ? a : b)

// Un même mois peut contenir plusieurs valeurs ; on conserve celle dont la date
// d'origine est la plus récente dans le mois.
const latestValueByMonthKey = (valeurs: ReadonlyArray<ValeurDateApiModel>): Map<string, number> => {
  const latestDateByKey = new Map<string, string>()
  const valueByKey = new Map<string, number>()
  for (const { date, valeur } of valeurs) {
    const key = parseMonth(date).toString()
    const previous = latestDateByKey.get(key)
    if (!previous || date > previous) {
      latestDateByKey.set(key, date)
      valueByKey.set(key, valeur)
    }
  }
  return valueByKey
}

// Indexe les points de taux de progression par bucket mensuel pour permettre
// un alignement O(1) sur l'axe des mois.
const tauxByMonthKey = (
  tauxProgression: ReadonlyArray<TauxProgressionPointApiModel>,
): Map<string, TauxProgressionPointApiModel> => {
  const map = new Map<string, TauxProgressionPointApiModel>()
  for (const point of tauxProgression) {
    map.set(parseMonth(point.date).toString(), point)
  }
  return map
}

// Bornes temporelles de l'historique. `undefined` signifie « aucune valeur ».
const monthBounds = (
  valeurs: ReadonlyArray<ValeurDateApiModel>,
): {
  earliest: Temporal.PlainYearMonth | undefined
  latest: Temporal.PlainYearMonth | undefined
} => {
  let earliest: Temporal.PlainYearMonth | undefined
  let latest: Temporal.PlainYearMonth | undefined
  for (const { date } of valeurs) {
    const ym = parseMonth(date)
    if (!earliest || compareMonths(ym, earliest) < 0) earliest = ym
    if (!latest || compareMonths(ym, latest) > 0) latest = ym
  }
  return { earliest, latest }
}

// Génère la séquence continue de mois entre deux bornes (incluses), pour que
// l'axe X reste régulier même si certains mois n'ont pas de valeur.
const enumerateMonths = ({
  start,
  end,
}: {
  start: Temporal.PlainYearMonth
  end: Temporal.PlainYearMonth
}): Month[] => {
  const months: Month[] = []
  let cursor = start
  while (compareMonths(cursor, end) <= 0) {
    months.push(toMonth(cursor))
    cursor = cursor.add({ months: 1 })
  }
  return months
}

const currentMonth = (): Temporal.PlainYearMonth =>
  Temporal.Now.plainDateISO('UTC').toPlainYearMonth()

// Construit la série mensuelle consommée par le chart :
// - ancre = mois de la dernière valeur, ou mois courant à défaut ;
// - série = du plus ancien mois disponible (ou ancre−(windowSize−1) si pas
//   d'historique antérieur) jusqu'à l'ancre, sans trou ;
// - defaultWindow = derniers `windowSize` mois pour cadrer l'affichage initial,
//   le reste reste accessible via le slider ECharts.
// `valeursCible` et `tauxProgression` sont alignés sur le même axe X via le
// bucket mensuel, et restent `null` pour les mois sans objectif applicable.
export const buildMonthlySeries = ({
  valeurs,
  tauxProgression,
  windowSize,
}: {
  valeurs: ReadonlyArray<ValeurDateApiModel>
  tauxProgression: ReadonlyArray<TauxProgressionPointApiModel>
  windowSize: number
}): MonthlySeries => {
  const valueByKey = latestValueByMonthKey(valeurs)
  const tauxByKey = tauxByMonthKey(tauxProgression)
  const { earliest, latest } = monthBounds(valeurs)
  const anchor = latest ?? currentMonth()
  const minStart = anchor.subtract({ months: windowSize - 1 })
  const start = earliest ? earlier(earliest, minStart) : minStart
  const months = enumerateMonths({ start, end: anchor })
  const values = months.map((month): number | null => valueByKey.get(month.key) ?? null)
  const valeursCible = months.map(
    (month): number | null => tauxByKey.get(month.key)?.valeurCible ?? null,
  )
  const taux = months.map(
    (month): number | null => tauxByKey.get(month.key)?.tauxProgression ?? null,
  )
  const lastIndex = months.length - 1
  return {
    months,
    values,
    valeursCible,
    tauxProgression: taux,
    defaultWindow: {
      startIndex: Math.max(0, lastIndex - (windowSize - 1)),
      endIndex: lastIndex,
    },
  }
}
