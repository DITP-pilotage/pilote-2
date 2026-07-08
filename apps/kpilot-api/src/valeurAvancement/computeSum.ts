import { Decimal } from '@/framework/decimal'

export const computeSum = (values: ReadonlyArray<Decimal>): number | null => {
  if (values.length === 0) return null
  return values.reduce((acc, v) => acc.plus(v), new Decimal(0)).toNumber()
}
