import { groupBy } from '@/framework/array'
import { type Decimal } from '@/framework/decimal'

// Médiane calculée en décimal exact : une valeur dérivée (moyenne) garde toutes
// ses décimales, et un passage par les flottants laisserait un écart résiduel
// (≈ 1e-13) entre un individu seul dans son référentiel et sa propre médiane.
export const computeMedianeDecimal = (values: ReadonlyArray<Decimal>): Decimal | null => {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a.comparedTo(b))
  const middle = sorted.length / 2

  if (sorted.length % 2 === 1) {
    return sorted[Math.floor(middle)]!
  }
  return sorted[middle - 1]!.plus(sorted[middle]!).div(2)
}

export const computeMediane = (values: ReadonlyArray<Decimal>): number | null =>
  computeMedianeDecimal(values)?.toNumber() ?? null

export const groupMedianesByKey = <T, K>(
  rows: ReadonlyArray<T>,
  getKey: (row: T) => K,
  getValeur: (row: T) => Decimal,
): Map<K, number | null> => {
  const grouped = groupBy(rows, getKey)
  const result = new Map<K, number | null>()
  for (const [key, group] of grouped) {
    result.set(key, computeMediane(group.map(getValeur)))
  }
  return result
}
