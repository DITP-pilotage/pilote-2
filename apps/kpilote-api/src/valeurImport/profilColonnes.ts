import { type CelluleSource, type TableauSource } from '@pilote/kpilote-shared/valeurImport'
import { parseDate } from '@pilote/kpilote-shared/valeurImport/parseDate'
import { parseNombre } from '@pilote/kpilote-shared/valeurImport/parseNombre'
import { countBy, uniq } from 'es-toolkit'

// Profil d'une colonne du fichier, calculé sans IA et donné à Albert : il voit
// la nature et les valeurs de chaque colonne sans lire tout le fichier.
export type NatureColonne = 'TEXTE' | 'NOMBRE' | 'DATE' | 'VIDE'

export type ProfilColonne = {
  entete: string
  nature: NatureColonne
  valeursDistinctes: number
  exemples: string[]
}

const MAX_EXEMPLES = 10
// En dessous de ce seuil, on donne toutes les valeurs : Albert peut alors
// désigner celles d'un filtre sans en manquer.
const MAX_VALEURS_COMPLETES = 20

const natureOf = (cellule: CelluleSource): Exclude<NatureColonne, 'VIDE'> => {
  if (typeof cellule === 'number') return 'NOMBRE'
  if (parseNombre(cellule) !== null) return 'NOMBRE'
  if (parseDate(cellule) !== null) return 'DATE'
  return 'TEXTE'
}

const dominantNature = (cellules: ReadonlyArray<CelluleSource>): NatureColonne => {
  const counts = countBy(cellules, natureOf)
  const natures: Exclude<NatureColonne, 'VIDE'>[] = ['TEXTE', 'NOMBRE', 'DATE']
  let dominant: NatureColonne = 'VIDE'
  let max = 0
  for (const nature of natures) {
    const count = counts[nature] ?? 0
    if (count > max) {
      dominant = nature
      max = count
    }
  }
  return dominant
}

export const buildProfilColonnes = ({ tableau }: { tableau: TableauSource }): ProfilColonne[] =>
  tableau.entetes.map((entete, index) => {
    const cellules = tableau.lignes
      .map((ligne) => ligne[index] ?? null)
      .filter((cellule) => cellule !== null && String(cellule).trim() !== '')
    const distinctes = uniq(cellules.map((cellule) => String(cellule).trim()))
    const limit = distinctes.length <= MAX_VALEURS_COMPLETES ? MAX_VALEURS_COMPLETES : MAX_EXEMPLES
    return {
      entete,
      nature: dominantNature(cellules),
      valeursDistinctes: distinctes.length,
      exemples: distinctes.slice(0, limit),
    }
  })
