export const unique = <T>(items: ReadonlyArray<T>): T[] => [...new Set(items)]

export const groupBy = <T, K>(items: ReadonlyArray<T>, getKey: (item: T) => K): Map<K, T[]> => {
  const result = new Map<K, T[]>()
  for (const item of items) {
    const key = getKey(item)
    const arr = result.get(key) ?? []
    arr.push(item)
    result.set(key, arr)
  }
  return result
}
