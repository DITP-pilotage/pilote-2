import { unique } from '@/framework/array'
import { safeStringify } from '@/valeurImport/helpers/safeStringify'

// Glue tabulaire : stringify + trim de chaque cellule d'une colonne, sans les
// vides, dédoublonné via l'util générique `unique` (ordre de 1re occurrence).
export const collecterValeursDistinctes = ({
  rows,
  colonne,
}: {
  rows: ReadonlyArray<Record<string, unknown>>
  colonne: string
}): string[] =>
  unique(
    rows.map((row) => safeStringify(row[colonne]).trim()).filter((valeur) => valeur.length > 0),
  )
