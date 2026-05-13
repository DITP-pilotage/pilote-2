import { groupBy } from '@/framework/array'
import { Prisma } from '@/generated/prisma/client'

export const computeMediane = (values: ReadonlyArray<number>): number | null => {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length / 2

  if (sorted.length % 2 === 1) {
    return sorted[Math.floor(middle)]!
  }
  return (sorted[middle - 1]! + sorted[middle]!) / 2
}

export const computeMedianeFromDecimals = (
  rows: ReadonlyArray<{ valeur: Prisma.Decimal }>,
): number | null => computeMediane(rows.map((row) => row.valeur.toNumber()))

export const groupMedianesByKey = <T, K>(
  rows: ReadonlyArray<T>,
  getKey: (row: T) => K,
  getValeur: (row: T) => Prisma.Decimal,
): Map<K, number | null> => {
  const grouped = groupBy(rows, getKey)
  const result = new Map<K, number | null>()
  for (const [key, group] of grouped) {
    result.set(key, computeMedianeFromDecimals(group.map((row) => ({ valeur: getValeur(row) }))))
  }
  return result
}
