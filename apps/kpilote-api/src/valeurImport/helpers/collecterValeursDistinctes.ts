import { safeStringify } from '@/valeurImport/helpers/safeStringify'

export const collecterValeursDistinctes = ({
  rows,
  colonne,
}: {
  rows: ReadonlyArray<Record<string, unknown>>
  colonne: string
}): string[] => {
  const set = new Set<string>()
  const ordered: string[] = []
  for (const row of rows) {
    const brut = row[colonne]
    if (brut === null || brut === undefined) continue
    const valeur = safeStringify(brut).trim()
    if (valeur && !set.has(valeur)) {
      set.add(valeur)
      ordered.push(valeur)
    }
  }
  return ordered
}
