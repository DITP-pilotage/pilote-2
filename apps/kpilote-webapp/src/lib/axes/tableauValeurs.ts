import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'
import { errorApiModelSchema } from '@pilote/kpilote-shared/error'
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
export type Layout = { rows: number; columns: number | null }

// Par défaut, le premier axe déclaré en lignes et les périodes en colonnes.
export const INITIAL_LAYOUT: Layout = { rows: 0, columns: null }

// Choisir comme lignes l'axe déjà en colonnes échange les deux.
export const withRowsAxe = ({ layout, index }: { layout: Layout; index: number }): Layout => {
  if (index === layout.columns) return { rows: index, columns: layout.rows }
  return { ...layout, rows: index }
}

// Choisir comme colonnes l'axe en lignes échange les deux, sauf sans axe en colonnes : les
// lignes passent alors sur le premier autre axe.
export const withColumnsAxe = ({
  layout,
  index,
  axesCount,
}: {
  layout: Layout
  index: number | null
  axesCount: number
}): Layout => {
  if (index === null || index !== layout.rows) return { ...layout, columns: index }
  if (layout.columns !== null) return { rows: layout.columns, columns: index }
  const otherAxe = Array.from({ length: axesCount }, (_, position) => position).find(
    (position) => position !== index,
  )
  return { rows: otherAxe ?? index, columns: index }
}

// La combinaison d'une cellule : la modalité de la ligne, celle de la colonne si un axe est
// en colonnes, la modalité fixée sur chaque autre axe.
export const buildCelluleIds = ({
  layout,
  fixedIds,
  row,
  column,
}: {
  layout: Layout
  fixedIds: ReadonlyArray<string>
  row: string
  column: string | null
}): CombinaisonIds =>
  fixedIds.map((fixedId, index) => {
    if (index === layout.rows) return row
    if (index === layout.columns) return column ?? TOUS_ID
    return fixedId
  })

// Au-delà, un arbre déplié d'emblée noie le tableau : on replie les parentes du premier niveau.
const AUTO_COLLAPSE_AT = 40

export const initialCollapsed = (tree: ModaliteTree): ReadonlySet<string> => {
  if (tree.size - 1 <= AUTO_COLLAPSE_AT) return new Set()
  const roots = tree.get(TOUS_ID)?.children ?? []
  return new Set(roots.filter((id) => tree.get(id)?.kind === 'parente'))
}

export const toggleIn = ({ set, id }: { set: ReadonlySet<string>; id: string }): Set<string> => {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

// Un sélecteur de la page a changé : seuls les axes dont la modalité a changé suivent, les
// autres gardent ce qu'on a choisi dans le tableau.
export const syncFixedIds = ({
  fixedIds,
  previous,
  next,
}: {
  fixedIds: ReadonlyArray<string>
  previous: ReadonlyArray<string | null>
  next: ReadonlyArray<string | null>
}): string[] =>
  fixedIds.map((fixedId, index) =>
    previous[index] === next[index] ? fixedId : (next[index] ?? TOUS_ID),
  )

// Les modalités d'une combinaison au format de `GET /indicateurs/{id}/valeurs`.
export const modalitesOf = (ids: CombinaisonIds): string[] => ids.filter((id) => id !== TOUS_ID)

export type CelluleTone = 'active' | 'precedent'

export const toneOf = ({
  isActive,
  isPrecedent,
}: {
  isActive: boolean
  isPrecedent: boolean
}): CelluleTone | undefined => {
  if (isActive) return 'active'
  if (isPrecedent) return 'precedent'
  return undefined
}

// Libellé accessible d'une cellule : « Opérateur : Orange × Tous (Type de fraude) ».
export const celluleLabelOf = ({
  axes,
  ids,
}: {
  axes: ReadonlyArray<AxeTableau>
  ids: CombinaisonIds
}): string =>
  ids
    .map((id, index) => {
      const axe = axes[index]
      const nom = axe?.tree.get(id)?.nom ?? id
      return id === TOUS_ID ? nom : `${axe?.nom ?? ''} : ${nom}`
    })
    .join(' × ')

// Le message d'un échec de lecture du cube : celui de l'API quand elle refuse (trop de
// combinaisons), sinon un message générique qui ne présume pas de la cause.
export const describeChargementError = ({
  status,
  body,
}: {
  status: number | null
  body: unknown
}): string => {
  const parsed = errorApiModelSchema.safeParse(body)
  if (status === 400 && parsed.success) return parsed.data.message
  if (status === 404) return 'Le tableau des valeurs n’est pas disponible pour cet indicateur.'
  return 'Les valeurs n’ont pas pu être chargées. Réessayez dans quelques instants.'
}
