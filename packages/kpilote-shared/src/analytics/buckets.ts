// Les valeurs numériques non bornées ne peuvent pas partir telles quelles dans
// le nom d'un événement : elles feraient exploser la cardinalité du rapport.
// On les regroupe en tranches, seule forme agrégeable côté Matomo.
const QUERY_LENGTH_BUCKETS = [
  { max: 2, label: '1-2' },
  { max: 5, label: '3-5' },
  { max: 10, label: '6-10' },
] as const

export const bucketQueryLength = (length: number): string => {
  if (length <= 0) return '0'
  return QUERY_LENGTH_BUCKETS.find((bucket) => length <= bucket.max)?.label ?? '11+'
}
