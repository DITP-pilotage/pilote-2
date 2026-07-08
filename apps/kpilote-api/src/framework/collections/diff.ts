export const diff = <T>(
  desired: ReadonlyArray<T>,
  existing: ReadonlyArray<T>,
): { toAdd: T[]; toRemove: T[] } => {
  const desiredSet = new Set(desired)
  const existingSet = new Set(existing)
  return {
    toAdd: desired.filter((item) => !existingSet.has(item)),
    toRemove: existing.filter((item) => !desiredSet.has(item)),
  }
}
