import type { TauxProgressionPointApiModel } from '@pilote/mb-shared/tauxProgression'
import type { ValeurDateApiModel } from '@pilote/mb-shared/valeurAvancement'
import { DateTime } from 'luxon'

export type Month = {
  date: Date
  key: string
}

export type MonthlySeries = {
  months: ReadonlyArray<Month>
  values: ReadonlyArray<number | null>
  valeursCible: ReadonlyArray<number | null>
  tauxProgression: ReadonlyArray<number | null>
  defaultWindow: { startIndex: number; endIndex: number }
}

const UTC = { zone: 'utc' } as const

// Toutes les manipulations se font en UTC pour éviter qu'un fuseau négatif ne
// fasse glisser une date du 1er du mois sur le mois précédent.
const parseMonth = (isoDate: string): DateTime => DateTime.fromISO(isoDate, UTC).startOf('month')

const monthKeyOf = (dt: DateTime): string => dt.toFormat('yyyy-LL')

const toMonth = (dt: DateTime): Month => {
  const start = dt.startOf('month')
  return { date: start.toJSDate(), key: monthKeyOf(start) }
}

// Un même mois peut contenir plusieurs valeurs ; on conserve celle dont la date
// est la plus récente dans le mois.
const latestValueByMonthKey = (valeurs: ReadonlyArray<ValeurDateApiModel>): Map<string, number> => {
  const latestDateByKey = new Map<string, string>()
  const valueByKey = new Map<string, number>()
  for (const { date, valeur } of valeurs) {
    const key = monthKeyOf(parseMonth(date))
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
    map.set(monthKeyOf(parseMonth(point.date)), point)
  }
  return map
}

// Bornes temporelles de l'historique. `undefined` signifie « aucune valeur ».
const monthBounds = (
  valeurs: ReadonlyArray<ValeurDateApiModel>,
): { earliest: DateTime | undefined; latest: DateTime | undefined } => {
  let earliestDate: string | undefined
  let latestDate: string | undefined
  for (const { date } of valeurs) {
    if (!earliestDate || date < earliestDate) earliestDate = date
    if (!latestDate || date > latestDate) latestDate = date
  }
  return {
    earliest: earliestDate ? parseMonth(earliestDate) : undefined,
    latest: latestDate ? parseMonth(latestDate) : undefined,
  }
}

// Génère la séquence continue de mois entre deux bornes (incluses), pour que
// l'axe X reste régulier même si certains mois n'ont pas de valeur.
const enumerateMonths = ({ start, end }: { start: DateTime; end: DateTime }): Month[] => {
  const months: Month[] = []
  let cursor = start
  while (cursor <= end) {
    months.push(toMonth(cursor))
    cursor = cursor.plus({ months: 1 })
  }
  return months
}

const earlier = (a: DateTime, b: DateTime): DateTime => (a < b ? a : b)

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
  const anchor = latest ?? DateTime.utc().startOf('month')
  const minStart = anchor.minus({ months: windowSize - 1 })
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
