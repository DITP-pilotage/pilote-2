import { z } from 'zod'
import { type DeclarationAxeIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { MAX_VALEURS_PAR_BATCH } from '@pilote/kpilote-shared/valeurAvancement'
import { celluleVersTexte } from './celluleXlsx'

export type ParseError =
  | { code: 'EMPTY' }
  | { code: 'TOO_MANY_ROWS'; count: number; max: number }
  | { code: 'MISSING_COLUMNS'; missing: string[] }
  | { code: 'UNREADABLE' }

export type ParseResult = { ok: true; rows: ParsedRow[] } | { ok: false; error: ParseError }

const COLONNES = ['individu', 'date', 'valeur'] as const

// Un axe de l'indicateur, tel que l'import le lit : son publicId (en-tête de sa
// colonne dans le fichier) et son nom (affiché).
export type AxeImport = Pick<DeclarationAxeIndicateurApiModel, 'id' | 'nom'>

// Colonnes attendues dans l'ordre où l'aide les présente : l'individu, une
// colonne par axe (en-tête = publicId de l'axe), la date, la valeur.
export const colonnesAttendues = ({ axes }: { axes: ReadonlyArray<AxeImport> }): string[] => [
  'individu',
  ...axes.map((axe) => axe.id),
  'date',
  'valeur',
]

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

// `modalites` : une par axe de l'indicateur, dans l'ordre des axes ; absent sans axe.
export type ParsedRow = z.infer<typeof rowSchema> & { modalites?: string[] | undefined }

// Projection stricte d'une matrice de cellules vers des lignes normalisées.
// Attend les colonnes individu, date, valeur, et une colonne par axe de
// l'indicateur dont l'en-tête est le publicId de l'axe (ordre et casse libres).
export function matriceVersRows({
  matrice,
  axes = [],
}: {
  matrice: unknown[][]
  axes?: ReadonlyArray<AxeImport>
}): ParseResult {
  const [ligneEntetes, ...lignesSuivantes] = matrice
  if (ligneEntetes === undefined) return { ok: false, error: { code: 'EMPTY' } }

  const entetes = ligneEntetes.map((cellule) => celluleVersTexte(cellule).trim().toLowerCase())
  const indexParColonne = new Map(COLONNES.map((nom) => [nom, entetes.indexOf(nom)]))
  const indexParAxe = axes.map((axe) => entetes.indexOf(axe.id.toLowerCase()))
  const missing = colonnesAttendues({ axes }).filter((nom) => !entetes.includes(nom.toLowerCase()))
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

  const rows = lignesData.map((ligne): ParsedRow => {
    const row = rowSchema.parse({
      individu: ligne[indices.individu],
      date: ligne[indices.date],
      valeur: ligne[indices.valeur],
    })
    if (axes.length === 0) return row
    // Une cellule d'axe vide est omise : l'API la signale (modalité manquante
    // pour l'axe, avec le numéro de ligne).
    const modalites = indexParAxe
      .map((index) => celluleVersTexte(ligne[index]).trim())
      .filter((modalite) => modalite.length > 0)
    return { individu: row.individu, modalites, date: row.date, valeur: row.valeur }
  })

  return { ok: true, rows }
}
