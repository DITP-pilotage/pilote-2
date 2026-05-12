export const computeMediane = (values: ReadonlyArray<number>): number | null => {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length / 2

  if (sorted.length % 2 === 1) {
    return sorted[Math.floor(middle)]!
  }
  return (sorted[middle - 1]! + sorted[middle]!) / 2
}
