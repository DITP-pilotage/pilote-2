import { type Decimal } from '@/framework/decimal'

export const computeMin = (values: ReadonlyArray<Decimal>): number | null => {
  if (values.length === 0) return null
  return Math.min(...values.map((v) => v.toNumber()))
}
