import { groupBy } from '@/framework/array'
import { type Decimal } from '@/framework/decimal'

export const computeMediane = (values: ReadonlyArray<Decimal>): number | null => {
  if (values.length === 0) return null

  const sorted = values.map((v) => v.toNumber()).sort((a, b) => a - b)
  const middle = sorted.length / 2

  if (sorted.length % 2 === 1) {
    return sorted[Math.floor(middle)]!
  }
  return (sorted[middle - 1]! + sorted[middle]!) / 2
}

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
