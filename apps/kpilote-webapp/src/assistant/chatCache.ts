/**
 * Marque `key` comme la plus récemment utilisée et oublie les plus anciennes au-delà de
 * `max`, sauf celles encore occupées. Renvoie les clés oubliées.
 */
export const remember = <V>(
  cache: Map<string, V>,
  key: string,
  value: V,
  { max, isBusy }: { max: number; isBusy: (value: V) => boolean },
): string[] => {
  cache.delete(key)
  cache.set(key, value)
  const forgotten: string[] = []
  for (const [candidate, entry] of cache) {
    if (cache.size <= max) break
    if (candidate === key || isBusy(entry)) continue
    cache.delete(candidate)
    forgotten.push(candidate)
  }
  return forgotten
}
