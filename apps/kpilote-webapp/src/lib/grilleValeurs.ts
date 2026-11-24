// Une grille de valeurs au format d'import : une ligne par valeur, une colonne par individu,
// axe, date et valeur. Partagée par la grille d'import et la vue en lignes de la fiche
// indicateur.

export type ColonneGrille =
  | { type: 'INDIVIDU'; label: string }
  | { type: 'AXE'; label: string; axe: string; rang: number }
  | { type: 'DATE'; label: string }
  | { type: 'VALEUR'; label: string }

export type PositionCellule = { ligne: number; colonne: number }

export const formatDate = (iso: string): string => {
  const [annee = '', mois = '', jour = ''] = iso.split('-')
  return `${jour}/${mois}/${annee}`
}

const NOMBRE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 })

export const formatValeur = (valeur: number): string => NOMBRE.format(valeur)

export type CelluleGrille = {
  text: string
  // Identifiant public d'un individu ou d'une modalité reconnus.
  identifiant: string | null
  isAlbert: boolean
  isWarning: boolean
  alignRight: boolean
  // Valeur calculée (agrégat), pas saisie : affichée en gris.
  isCalculee: boolean
}

export type LigneGrille = {
  // Index de la ligne dans le résultat de `applyPlan`.
  index: number
  numero: number
  cellules: CelluleGrille[]
  isImportable: boolean
}

// `gridId` distingue deux grilles d'une même page (la vue en lignes derrière la fenêtre d'import).
export const cellDomId = ({
  gridId,
  position,
}: {
  gridId: string
  position: PositionCellule
}): string => `${gridId}-cellule-${position.ligne}-${position.colonne}`

// Déplacement de la sélection au clavier, borné aux lignes affichées.
export const movePosition = ({
  position,
  delta,
  lignes,
  nombreColonnes,
}: {
  position: PositionCellule
  delta: { ligne: number; colonne: number }
  lignes: ReadonlyArray<LigneGrille>
  nombreColonnes: number
}): PositionCellule => {
  if (lignes.length === 0) return position
  const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), max)
  const rang = lignes.findIndex((ligne) => ligne.index === position.ligne)
  const nextRang = clamp(Math.max(rang, 0) + delta.ligne, lignes.length - 1)
  return {
    ligne: lignes[nextRang]?.index ?? position.ligne,
    colonne: clamp(position.colonne + delta.colonne, nombreColonnes - 1),
  }
}
