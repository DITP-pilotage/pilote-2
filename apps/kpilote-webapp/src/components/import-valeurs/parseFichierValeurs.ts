import { MAX_VALEURS_PAR_BATCH } from '@pilote/kpilote-shared/valeurAvancement'

export type ParsedRow = { individu: string; date: string; valeur: number | string }

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
  return String(cell ?? '').trim()
}

export function parseValeurCell({ cell }: { cell: unknown }): number | string {
  if (typeof cell === 'number') return cell
  const texte = String(cell ?? '').trim()
  const normalise = Number(texte.replace(',', '.'))
  return texte.length > 0 && Number.isFinite(normalise) ? normalise : texte
}

export async function parseFichierValeurs({ file }: { file: File }): Promise<ParseResult> {
  const XLSX = await import('xlsx')
  let matrice: unknown[][]
  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array', cellDates: true })
    const feuille = workbook.Sheets[workbook.SheetNames[0]]
    matrice = XLSX.utils.sheet_to_json<unknown[]>(feuille, { header: 1, raw: true, blankrows: false })
  } catch {
    return { ok: false, error: { code: 'UNREADABLE' } }
  }

  if (matrice.length === 0) return { ok: false, error: { code: 'EMPTY' } }

  const entetes = matrice[0].map((cellule) => String(cellule ?? '').trim().toLowerCase())
  const indexParColonne = new Map(COLONNES.map((nom) => [nom, entetes.indexOf(nom)]))
  const missing = COLONNES.filter((nom) => (indexParColonne.get(nom) ?? -1) < 0)
  if (missing.length > 0) return { ok: false, error: { code: 'MISSING_COLUMNS', missing } }

  const lignesData = matrice
    .slice(1)
    .filter((ligne) => ligne.some((cellule) => String(cellule ?? '').trim().length > 0))

  if (lignesData.length === 0) return { ok: false, error: { code: 'EMPTY' } }
  if (lignesData.length > MAX_VALEURS_PAR_BATCH) {
    return {
      ok: false,
      error: { code: 'TOO_MANY_ROWS', count: lignesData.length, max: MAX_VALEURS_PAR_BATCH },
    }
  }

  const rows = lignesData.map((ligne) => ({
    individu: String(ligne[indexParColonne.get('individu') as number] ?? '').trim(),
    date: formatDateCell({ cell: ligne[indexParColonne.get('date') as number] }),
    valeur: parseValeurCell({ cell: ligne[indexParColonne.get('valeur') as number] }),
  }))

  return { ok: true, rows }
}
