import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { groupBy } from 'es-toolkit'

import {
  type AxeWithModalites,
  selectedModalites,
  type SelectionModalites,
  setModalite,
} from '@/lib/axes/selection'

// La palette par défaut d'ECharts compte 9 couleurs : la sélection courante
// plus 8 modalités, sans couleur répétée.
export const MAX_DECOMPOSITION_SERIES = 8

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

const ROOT = ''

// Modalités enfants du niveau courant (les racines sur « Tous »), en descendant
// tant qu'il n'y en a qu'une : une série unique égale à la sélection n'apporte rien.
export const listDecompositionModalites = ({
  axe,
  modaliteId,
}: {
  axe: AxeWithModalites
  modaliteId: string | null
}): ModaliteApiModel[] => {
  const childrenByParent = groupBy(axe.modalites, (modalite) => modalite.parent ?? ROOT)
  const childrenOf = (parent: string): ModaliteApiModel[] =>
    (childrenByParent[parent] ?? []).toSorted((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  const descendSingle = (modalites: ModaliteApiModel[]): ModaliteApiModel[] => {
    const [single, ...others] = modalites
    if (!single || others.length > 0) return modalites
    const children = childrenOf(single.id)
    return children.length > 0 ? descendSingle(children) : modalites
  }
  return descendSingle(childrenOf(modaliteId ?? ROOT))
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
