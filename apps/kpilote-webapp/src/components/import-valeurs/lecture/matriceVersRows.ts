import { z } from 'zod'
import { individuPublicIdSchema } from '@pilote/kpilote-shared/publicIds'
import { MAX_VALEURS_PAR_BATCH } from '@pilote/kpilote-shared/valeurAvancement'
import { celluleVersTexte } from './celluleXlsx'

export type ParseError =
  | { code: 'EMPTY' }
  | { code: 'TOO_MANY_ROWS'; count: number; max: number }
  | { code: 'MISSING_COLUMNS'; missing: string[] }
  | { code: 'UNREADABLE' }

// `colonnesIdentite` n'est présent que pour un fichier multi-dimension (au moins une
// colonne d'identité en plus de `individu`) ; `colonnesIdentite[i]` est la colonne
// de `coordonnees[i]` dans chaque ligne.
export type ParseResult =
  { ok: true; rows: ParsedRow[]; colonnesIdentite?: string[] } | { ok: false; error: ParseError }

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

// Ligne à importer. `coordonnees` (multi-dimension) : un membre par colonne
// d'identité, alignés sur les colonnes (chaîne vide si la cellule est vide) ;
// `individu` reste la valeur de la colonne `individu`.
export type ParsedRow = z.infer<typeof rowSchema> & { coordonnees?: string[] | undefined }

// Une colonne hors individu/date/valeur est une colonne d'identité supplémentaire
// si toutes ses valeurs non vides sont des publicIds d'individus au format
// `PREFIXE-CODE` (ex. OP-ORANGE). Le tiret est exigé pour ne pas prendre une colonne
// de commentaire (« OK », « RAS ») d'un fichier mono pour une dimension.
const ressembleAPublicId = (texte: string): boolean =>
  texte.includes('-') && individuPublicIdSchema.safeParse(texte).success

const estColonneIdentite = ({ lignes, index }: { lignes: unknown[][]; index: number }): boolean => {
  const valeurs = lignes
    .map((ligne) => celluleVersTexte(ligne[index]).trim())
    .filter((valeur) => valeur.length > 0)
  return valeurs.length > 0 && valeurs.every(ressembleAPublicId)
}

// Projection stricte d'une matrice de cellules vers des lignes normalisées.
// Attend les colonnes individu, date, valeur (ordre et casse libres), plus
// d'éventuelles colonnes d'identité (indicateur multi-dimension, ex. operateur).
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

  const reservees = new Set<number>([indices.individu, indices.date, indices.valeur])
  const indicesIdentite = entetes.flatMap((entete, index) =>
    entete.length > 0 && !reservees.has(index) && estColonneIdentite({ lignes: lignesData, index })
      ? [index]
      : [],
  )

  const rows = lignesData.map((ligne) =>
    rowSchema.parse({
      individu: ligne[indices.individu],
      date: ligne[indices.date],
      valeur: ligne[indices.valeur],
    }),
  )

  // Mono : sortie historique, sans `coordonnees`.
  if (indicesIdentite.length === 0) return { ok: true, rows }

  const indicesCoordonnees = [indices.individu, ...indicesIdentite]
  return {
    ok: true,
    colonnesIdentite: indicesCoordonnees.map((index) =>
      celluleVersTexte(ligneEntetes[index]).trim(),
    ),
    rows: rows.map((row, numero) => ({
      ...row,
      coordonnees: indicesCoordonnees.map((index) =>
        celluleVersTexte(lignesData[numero]?.[index]).trim(),
      ),
    })),
  }
}
