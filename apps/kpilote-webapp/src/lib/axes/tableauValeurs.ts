import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'
import { buildModaliteTree, type ModaliteTree, TOUS_ID } from '@pilote/kpilote-shared/modaliteTree'
import { type ValeursCombinaisonApiModel } from '@pilote/kpilote-shared/valeurAvancement'
import {
  buildAxeIndexByModalite,
  buildSeriesByCombinaison,
  type CombinaisonIds,
  listPeriodes,
  type SeriesByCombinaison,
} from '@pilote/kpilote-shared/valeursCombinaison'

import { type AxeWithModalites } from '@/lib/axes/selection'

export type AxeTableau = {
  id: string
  nom: string
  fonction: FonctionAgregationAxe
  tree: ModaliteTree
}

export type TableauValeursContext = {
  axes: ReadonlyArray<AxeTableau>
  axeIndexByModalite: ReadonlyMap<string, number>
  series: SeriesByCombinaison
  periodes: ReadonlyArray<string>
}

// « Tous » est la marginale d'un axe : avec plusieurs axes, son nom dit lequel.
export const buildTableauValeursContext = ({
  axes,
  items,
}: {
  // Dans l'ordre de déclaration sur l'indicateur.
  axes: ReadonlyArray<AxeWithModalites & { fonction: FonctionAgregationAxe }>
  items: ReadonlyArray<ValeursCombinaisonApiModel>
}): TableauValeursContext => {
  const axeIndexByModalite = buildAxeIndexByModalite(axes)
  const series = buildSeriesByCombinaison({ items, axeIndexByModalite, axesCount: axes.length })
  return {
    axes: axes.map((axe) => ({
      id: axe.id,
      nom: axe.nom,
      fonction: axe.fonction,
      tree: buildModaliteTree({ modalites: axe.modalites, tousNom: `Tous (${axe.nom})` }),
    })),
    axeIndexByModalite,
    series,
    periodes: listPeriodes(series),
  }
}

// Index de l'axe en lignes et de l'axe en colonnes ; sans axe en colonnes, les colonnes sont
// les périodes.
export type Disposition = { lignes: number; colonnes: number | null }

// Par défaut, le premier axe déclaré en lignes et les périodes en colonnes.
export const INITIAL_DISPOSITION: Disposition = { lignes: 0, colonnes: null }

// Choisir comme lignes l'axe déjà en colonnes échange les deux.
export const withLignes = ({
  disposition,
  index,
}: {
  disposition: Disposition
  index: number
}): Disposition => {
  if (index === disposition.colonnes) return { lignes: index, colonnes: disposition.lignes }
  return { ...disposition, lignes: index }
}

// Choisir comme colonnes l'axe en lignes échange les deux, sauf sans axe en colonnes : les
// lignes passent alors sur le premier autre axe.
export const withColonnes = ({
  disposition,
  index,
  axesCount,
}: {
  disposition: Disposition
  index: number | null
  axesCount: number
}): Disposition => {
  if (index === null || index !== disposition.lignes) return { ...disposition, colonnes: index }
  if (disposition.colonnes !== null) return { lignes: disposition.colonnes, colonnes: index }
  const autre = Array.from({ length: axesCount }, (_, position) => position).find(
    (position) => position !== index,
  )
  return { lignes: autre ?? index, colonnes: index }
}

// La combinaison d'une cellule : la modalité de la ligne, celle de la colonne si un axe est
// en colonnes, la modalité fixée sur chaque autre axe.
export const buildCelluleIds = ({
  disposition,
  fixees,
  row,
  column,
}: {
  disposition: Disposition
  fixees: ReadonlyArray<string>
  row: string
  column: string | null
}): CombinaisonIds =>
  fixees.map((fixee, index) => {
    if (index === disposition.lignes) return row
    if (index === disposition.colonnes) return column ?? TOUS_ID
    return fixee
  })

// Au-delà, un arbre déplié d'emblée noie le tableau : on replie les parentes du premier niveau.
const AUTO_COLLAPSE_AT = 40

export const initialCollapsed = (tree: ModaliteTree): ReadonlySet<string> => {
  if (tree.size - 1 <= AUTO_COLLAPSE_AT) return new Set()
  const racines = tree.get(TOUS_ID)?.children ?? []
  return new Set(racines.filter((id) => tree.get(id)?.kind === 'parente'))
}

export const toggleIn = ({ set, id }: { set: ReadonlySet<string>; id: string }): Set<string> => {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}
