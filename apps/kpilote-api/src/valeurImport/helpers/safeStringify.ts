// Convertit une valeur de cellule (typée unknown après parsing CSV/Excel) en
// string sans tomber dans le piège `[object Object]` de String(value).
export const safeStringify = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  return JSON.stringify(value)
}
