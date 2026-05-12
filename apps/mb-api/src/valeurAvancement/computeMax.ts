export const computeMax = (values: ReadonlyArray<number>): number | null => {
  if (values.length === 0) return null
  return Math.max(...values)
}
