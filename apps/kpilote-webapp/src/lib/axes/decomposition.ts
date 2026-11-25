import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'

import {
  type AxeWithModalites,
  selectedModalites,
  type SelectionModalites,
  setModalite,
} from '@/lib/axes/selection'

// Au-delà, la légende et les couleurs du graphique ne sont plus lisibles.
export const MAX_DECOMPOSITION_SERIES = 12

export type DecompositionSerie = {
  modalite: ModaliteApiModel
  /** Lecture de la série : la sélection courante, la modalité décomposée remplacée. */
  modalites: ReadonlyArray<string>
}

export type Decomposition = {
  series: ReadonlyArray<DecompositionSerie>
  /** Nombre de modalités candidates avant plafonnement. */
  total: number
}

const sortByNom = (modalites: ReadonlyArray<ModaliteApiModel>): ModaliteApiModel[] =>
  modalites.toSorted((a, b) => a.nom.localeCompare(b.nom, 'fr'))

// Modalités enfants du niveau courant. Sur « Tous », les racines, en descendant
// tant qu'il n'y en a qu'une : une série unique égale à « Tous » n'apporte rien.
export const listDecompositionModalites = ({
  axe,
  modaliteId,
}: {
  axe: AxeWithModalites
  modaliteId: string | null
}): ModaliteApiModel[] => {
  const childrenOf = (parent: string | null) =>
    sortByNom(axe.modalites.filter((modalite) => modalite.parent === parent))
  if (modaliteId !== null) return childrenOf(modaliteId)
  const descendSingle = (modalites: ModaliteApiModel[]): ModaliteApiModel[] => {
    const [single, ...others] = modalites
    if (!single || others.length > 0) return modalites
    const children = childrenOf(single.id)
    return children.length > 0 ? descendSingle(children) : modalites
  }
  return descendSingle(childrenOf(null))
}

export const buildDecomposition = ({
  axes,
  selection,
  axeId,
  max = MAX_DECOMPOSITION_SERIES,
}: {
  axes: ReadonlyArray<AxeWithModalites>
  selection: SelectionModalites
  axeId: string
  max?: number
}): Decomposition => {
  const axe = axes.find((candidate) => candidate.id === axeId)
  if (!axe) return { series: [], total: 0 }
  const modalites = listDecompositionModalites({ axe, modaliteId: selection.get(axeId) ?? null })
  return {
    total: modalites.length,
    series: modalites.slice(0, max).map((modalite) => ({
      modalite,
      modalites: selectedModalites({
        axes,
        selection: setModalite({ selection, axeId, modalite: modalite.id }),
      }),
    })),
  }
}
