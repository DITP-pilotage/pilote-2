import { type Decimal } from '@/framework/decimal'

export const computeMax = (values: ReadonlyArray<Decimal>): number | null => {
  if (values.length === 0) return null
  return Math.max(...values.map((v) => v.toNumber()))
}
