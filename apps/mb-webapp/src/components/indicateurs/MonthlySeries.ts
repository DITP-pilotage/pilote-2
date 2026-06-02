import type { TauxProgressionPointApiModel } from '@pilote/mb-shared/tauxProgression'
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
  valeursCible: ReadonlyArray<number | null>
  tauxProgression: ReadonlyArray<number | null>
  defaultWindow: { startIndex: number; endIndex: number }
}

// Encode un mois sur un seul entier pour pouvoir l'additionner / soustraire sans
// gérer manuellement le débordement d'année.
const ordinalOf = ({ year, monthIndex }: { year: number; monthIndex: number }): number =>
  year * 12 + monthIndex

// Inverse de `ordinalOf`. La double modulo `((x % 12) + 12) % 12` garantit un
// `monthIndex` positif même pour des ordinaux négatifs (théoriques).
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

// Lecture en UTC pour éviter qu'un fuseau négatif fasse glisser une date du
// 1er du mois sur le mois précédent.
const monthFromIsoDate = (isoDate: string): Month => {
  const parsed = new Date(isoDate)
  return monthFromOrdinal(
    ordinalOf({ year: parsed.getUTCFullYear(), monthIndex: parsed.getUTCMonth() }),
  )
}

// Fallback d'ancre quand l'indicateur n'a aucune valeur saisie.
const currentMonth = (): Month => {
  const now = new Date()
  return monthFromOrdinal(ordinalOf({ year: now.getUTCFullYear(), monthIndex: now.getUTCMonth() }))
}

// Un même mois peut contenir plusieurs valeurs ; on conserve celle dont la date
// est la plus récente dans le mois.
const latestValueByMonthKey = (valeurs: ReadonlyArray<ValeurDateApiModel>): Map<string, number> => {
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

// Bornes temporelles de l'historique. `undefined` signifie « aucune valeur ».
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

// Génère la séquence continue de mois entre deux bornes (incluses), pour que
// l'axe X reste régulier même si certains mois n'ont pas de valeur.
const enumerateMonths = ({ start, end }: { start: Month; end: Month }): Month[] => {
  const startOrdinal = ordinalOf(start)
  const endOrdinal = ordinalOf(end)
  const months: Month[] = []
  for (let ordinal = startOrdinal; ordinal <= endOrdinal; ordinal++) {
    months.push(monthFromOrdinal(ordinal))
  }
  return months
}

// Indexe les points de taux de progression par bucket mensuel pour permettre
// un alignement O(1) sur l'axe des mois.
const tauxByMonthKey = (
  tauxProgression: ReadonlyArray<TauxProgressionPointApiModel>,
): Map<string, TauxProgressionPointApiModel> => {
  const map = new Map<string, TauxProgressionPointApiModel>()
  for (const point of tauxProgression) {
    map.set(point.date.slice(0, 7), point)
  }
  return map
}

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
  const minStartOrdinal = ordinalOf(anchor) - (windowSize - 1)
  const startOrdinal = earliest ? Math.min(ordinalOf(earliest), minStartOrdinal) : minStartOrdinal
  const months = enumerateMonths({ start: monthFromOrdinal(startOrdinal), end: anchor })
  const values = months.map((month): number | null => valueByKey.get(month.key) ?? null)
  const valeursCible = months.map((month): number | null => tauxByKey.get(month.key)?.valeurCible ?? null)
  const taux = months.map((month): number | null => tauxByKey.get(month.key)?.tauxProgression ?? null)
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
