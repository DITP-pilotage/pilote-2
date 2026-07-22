import { z } from 'zod'
import { MAX_VALEURS_PAR_BATCH } from '@pilote/kpilote-shared/valeurAvancement'
import { celluleVersTexte } from './celluleXlsx'

export type ParseError =
  | { code: 'EMPTY' }
  | { code: 'TOO_MANY_ROWS'; count: number; max: number }
  | { code: 'MISSING_COLUMNS'; missing: string[] }
  | { code: 'UNREADABLE' }

export type ParseResult = { ok: true; rows: ParsedRow[] } | { ok: false; error: ParseError }

const COLONNES = ['individu', 'date', 'valeur'] as const

const pad = (valeur: number): string => String(valeur).padStart(2, '0')

export function formatDateCell({ cell }: { cell: unknown }): string {
  if (cell instanceof Date) {
    return `${cell.getUTCFullYear()}-${pad(cell.getUTCMonth() + 1)}-${pad(cell.getUTCDate())}`
  }
  return celluleVersTexte(cell).trim()
}

export function parseValeurCell({ cell }: { cell: unknown }): number | string {
  if (typeof cell === 'number') return cell
  const texte = celluleVersTexte(cell).trim()
  const normalise = Number(texte.replace(',', '.'))
  return texte.length > 0 && Number.isFinite(normalise) ? normalise : texte
}

const rowSchema = z.object({
  individu: z.preprocess((cell) => celluleVersTexte(cell).trim(), z.string()),
  date: z.preprocess((cell) => formatDateCell({ cell }), z.string()),
  valeur: z.preprocess((cell) => parseValeurCell({ cell }), z.union([z.number(), z.string()])),
})

export type ParsedRow = z.infer<typeof rowSchema>

// Projection stricte d'une matrice de cellules vers des lignes normalisées.
// Attend les colonnes individu, date, valeur (ordre et casse libres).
export function matriceVersRows({ matrice }: { matrice: unknown[][] }): ParseResult {
  const [ligneEntetes, ...lignesSuivantes] = matrice
  if (ligneEntetes === undefined) return { ok: false, error: { code: 'EMPTY' } }

  const entetes = ligneEntetes.map((cellule) => celluleVersTexte(cellule).trim().toLowerCase())
  const indexParColonne = new Map(COLONNES.map((nom) => [nom, entetes.indexOf(nom)]))
  const missing = COLONNES.filter((nom) => (indexParColonne.get(nom) ?? -1) < 0)
  if (missing.length > 0) return { ok: false, error: { code: 'MISSING_COLUMNS', missing } }

  // Après le check missing, les trois colonnes sont garanties présentes.
  const indices = {
    individu: indexParColonne.get('individu') ?? -1,
    date: indexParColonne.get('date') ?? -1,
    valeur: indexParColonne.get('valeur') ?? -1,
  }

  const lignesData = lignesSuivantes.filter((ligne) =>
    ligne.some((cellule) => celluleVersTexte(cellule).trim().length > 0),
  )

  if (lignesData.length === 0) return { ok: false, error: { code: 'EMPTY' } }
  if (lignesData.length > MAX_VALEURS_PAR_BATCH) {
    return {
      ok: false,
      error: { code: 'TOO_MANY_ROWS', count: lignesData.length, max: MAX_VALEURS_PAR_BATCH },
    }
  }

  const rows = lignesData.map((ligne) =>
    rowSchema.parse({
      individu: ligne[indices.individu],
      date: ligne[indices.date],
      valeur: ligne[indices.valeur],
    }),
  )

  return { ok: true, rows }
}
