import type { NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurImport'
import type { LectureMatrice } from './lecture/fichierVersMatrice'
import {
  type AxeImport,
  matriceVersRows,
  type ParseError,
  type ParsedRow,
  type ParseResult,
} from './lecture/matriceVersRows'

export type EtatImport =
  | { kind: 'vide' }
  | { kind: 'lecture' }
  | { kind: 'illisible'; error: ParseError }
  | { kind: 'standard'; rows: ParsedRow[]; nomFichier: string | undefined }
  | { kind: 'albertEnCours' }
  | { kind: 'albertRevue'; revue: NormaliserValeursImportResponseApiModel }
  | { kind: 'albertEchec'; error: ParseError }

// `undefined` tant que le fichier n'est pas lu ou que les axes de l'indicateur,
// qui fixent les colonnes attendues, ne sont pas chargés.
export const parseLecture = ({
  lecture,
  axes,
}: {
  lecture: LectureMatrice | undefined
  axes: ReadonlyArray<AxeImport> | undefined
}): ParseResult | undefined => {
  if (!lecture || !axes) return undefined
  if (!lecture.ok) return { ok: false, error: { code: 'UNREADABLE' } }
  return matriceVersRows({ matrice: lecture.matrice, axes })
}

export function deriverEtatImport({
  file,
  lectureEnCours,
  parseResult,
  albert,
}: {
  file: File | null
  lectureEnCours: boolean
  parseResult: ParseResult | undefined
  albert: { revue: NormaliserValeursImportResponseApiModel | null; echec: boolean }
}): EtatImport {
  if (!file) return { kind: 'vide' }
  if (lectureEnCours || parseResult === undefined) return { kind: 'lecture' }
  if (parseResult.ok) return { kind: 'standard', rows: parseResult.rows, nomFichier: file.name }

  // Colonnes manquantes → on tente l'extraction assistée par Albert. Les autres
  // erreurs de parse (vide, trop de lignes, illisible) sont terminales.
  if (parseResult.error.code === 'MISSING_COLUMNS') {
    if (albert.revue) return { kind: 'albertRevue', revue: albert.revue }
    if (albert.echec) return { kind: 'albertEchec', error: parseResult.error }
    return { kind: 'albertEnCours' }
  }

  return { kind: 'illisible', error: parseResult.error }
}

export function payloadDepuisEtat(etat: EtatImport): ParsedRow[] | null {
  if (etat.kind === 'standard') return etat.rows
  if (etat.kind === 'albertRevue') return etat.revue.items
  return null
}
