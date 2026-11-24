import { type LucideIcon } from 'lucide-react'

// Une grille de valeurs au format d'import : une ligne par valeur, une colonne par individu,
// axe, date et valeur. Les cellules arrivent déjà préparées : chaque écran traduit ses propres
// données vers ce modèle.

export type ColonneGrille =
  | { type: 'INDIVIDU'; label: string }
  | { type: 'AXE'; label: string; axe: string; rang: number }
  | { type: 'DATE'; label: string }
  | { type: 'VALEUR'; label: string }

export type PositionCellule = { ligne: number; colonne: number }

// Couleur du texte et du fond. L'écran décide de ce que chaque ton veut dire.
export type CelluleTone = 'DEFAULT' | 'WARNING' | 'MUTED'

// Pictogramme affiché avant le texte, avec son libellé pour les lecteurs d'écran.
export type CelluleMarker = { icon: LucideIcon; label: string }

export type CelluleGrille = {
  text: string
  // Identifiant public affiché en petit à droite (individu ou modalité), ou `null`.
  identifiant: string | null
  tone: CelluleTone
  marker: CelluleMarker | null
  alignRight: boolean
  // L'écran sait la corriger : la grille demande son édition au double-clic, à Entrée ou à F2.
  isEditable: boolean
}

export type LigneGrille = {
  // Position de la ligne dans les données de l'écran : c'est elle que porte `PositionCellule.ligne`.
  index: number
  // Numéro affiché dans la première colonne.
  numero: number
  cellules: CelluleGrille[]
}

export const formatDate = (iso: string): string => {
  const [annee = '', mois = '', jour = ''] = iso.split('-')
  return `${jour}/${mois}/${annee}`
}

const NOMBRE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 })

export const formatValeur = (valeur: number): string => NOMBRE.format(valeur)

// `gridId` distingue deux grilles d'une même page.
export const cellDomId = ({
  gridId,
  position,
}: {
  gridId: string
  position: PositionCellule
}): string => `${gridId}-cellule-${position.ligne}-${position.colonne}`

const clamp = ({ value, max }: { value: number; max: number }): number =>
  Math.min(Math.max(value, 0), max)

// Déplacement de la sélection au clavier, borné aux lignes affichées. Depuis une ligne qui n'est
// pas affichée (sélection initiale hors des lignes, ligne filtrée), on va à la première ligne
// affichée, quel que soit le sens.
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
  const rang = lignes.findIndex((ligne) => ligne.index === position.ligne)
  const nextRang = rang === -1 ? 0 : clamp({ value: rang + delta.ligne, max: lignes.length - 1 })
  return {
    ligne: lignes[nextRang]?.index ?? position.ligne,
    colonne: clamp({ value: position.colonne + delta.colonne, max: nombreColonnes - 1 }),
  }
}
