import { formatIsoDate } from '@pilote/kpilote-shared/dates'
import { emptyToNull } from '@pilote/kpilote-shared/texte'
import {
  type CelluleSource,
  MAX_COLONNES_TABLEAU,
  MAX_LIGNES_TABLEAU,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'

export type LectureError =
  | { code: 'UNREADABLE' }
  | { code: 'EMPTY' }
  | { code: 'TOO_MANY_ROWS'; count: number; max: number }
  | { code: 'TOO_MANY_COLUMNS'; count: number; max: number }

export type LectureTableau =
  { ok: true; tableau: TableauSource } | { ok: false; error: LectureError }

// Une date de tableur est lue à minuit UTC : ses composantes UTC sont la date écrite.
const toIsoDate = (date: Date): string =>
  formatIsoDate({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  })

const toCelluleSource = (cellule: unknown): CelluleSource => {
  if (cellule instanceof Date) return toIsoDate(cellule)
  if (typeof cellule === 'number') return Number.isFinite(cellule) ? cellule : null
  if (typeof cellule === 'string') return emptyToNull(cellule)
  if (typeof cellule === 'boolean') return String(cellule)
  return null
}

const toEntete = (cellule: unknown): string => {
  const source = toCelluleSource(cellule)
  return source === null ? '' : String(source)
}

// Projection d'une matrice de cellules vers le tableau source de l'import : la
// première ligne porte les en-têtes, les colonnes sans en-tête et les lignes
// vides sont retirées. Aucune hypothèse sur le rôle des colonnes.
export const matriceVersTableau = ({ matrice }: { matrice: unknown[][] }): LectureTableau => {
  const [ligneEntetes, ...lignesSuivantes] = matrice
  if (ligneEntetes === undefined) return { ok: false, error: { code: 'EMPTY' } }

  const colonnes = ligneEntetes
    .map((cellule, index) => ({ entete: toEntete(cellule), index }))
    .filter((colonne) => colonne.entete !== '')
  if (colonnes.length === 0) return { ok: false, error: { code: 'EMPTY' } }
  if (colonnes.length > MAX_COLONNES_TABLEAU) {
    return {
      ok: false,
      error: { code: 'TOO_MANY_COLUMNS', count: colonnes.length, max: MAX_COLONNES_TABLEAU },
    }
  }

  const lignes = lignesSuivantes
    .map((ligne) => colonnes.map((colonne) => toCelluleSource(ligne[colonne.index])))
    .filter((ligne) => ligne.some((cellule) => cellule !== null))
  if (lignes.length === 0) return { ok: false, error: { code: 'EMPTY' } }
  if (lignes.length > MAX_LIGNES_TABLEAU) {
    return {
      ok: false,
      error: { code: 'TOO_MANY_ROWS', count: lignes.length, max: MAX_LIGNES_TABLEAU },
    }
  }

  return { ok: true, tableau: { entetes: colonnes.map((colonne) => colonne.entete), lignes } }
}
