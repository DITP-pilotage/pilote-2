import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'

export type AxeWithModalites = {
  id: string
  nom: string
  modalites: ReadonlyArray<ModaliteApiModel>
}

/** Modalité choisie par axe ; un axe absent vaut « Tous ». */
export type SelectionModalites = ReadonlyMap<string, string>

export type OrderedModalite = { modalite: ModaliteApiModel; depth: number }

export const parseModalitesParam = (param: string | undefined): ReadonlyArray<string> =>
  param ? param.split(',').filter((segment) => segment.length > 0) : []

export const readSelection = ({
  axes,
  modalites,
}: {
  axes: ReadonlyArray<AxeWithModalites>
  modalites: ReadonlyArray<string>
}): SelectionModalites => {
  const axeParModalite = new Map(
    axes.flatMap((axe) => axe.modalites.map((m) => [m.id, axe.id] as const)),
  )
  const selection = new Map<string, string>()
  for (const modaliteId of modalites) {
    const axeId = axeParModalite.get(modaliteId)
    if (axeId && !selection.has(axeId)) selection.set(axeId, modaliteId)
  }
  return selection
}

export const writeSelection = ({
  axes,
  selection,
}: {
  axes: ReadonlyArray<{ id: string }>
  selection: SelectionModalites
}): string | undefined => {
  const modalites = selectedModalites({ axes, selection })
  return modalites.length > 0 ? modalites.join(',') : undefined
}

export const selectedModalites = ({
  axes,
  selection,
}: {
  axes: ReadonlyArray<{ id: string }>
  selection: SelectionModalites
}): ReadonlyArray<string> =>
  axes.flatMap((axe) => {
    const modaliteId = selection.get(axe.id)
    return modaliteId ? [modaliteId] : []
  })

export const setModalite = ({
  selection,
  axeId,
  modalite,
}: {
  selection: SelectionModalites
  axeId: string
  modalite: string | null
}): SelectionModalites => {
  const next = new Map(selection)
  if (modalite) next.set(axeId, modalite)
  else next.delete(axeId)
  return next
}

export const orderModalites = (
  modalites: ReadonlyArray<ModaliteApiModel>,
): ReadonlyArray<OrderedModalite> => {
  const children = new Map<string | null, ModaliteApiModel[]>()
  for (const modalite of modalites) {
    const siblings = children.get(modalite.parent) ?? []
    siblings.push(modalite)
    children.set(modalite.parent, siblings)
  }
  const visit = (parent: string | null, depth: number): OrderedModalite[] =>
    (children.get(parent) ?? [])
      .toSorted((a, b) => a.nom.localeCompare(b.nom, 'fr'))
      .flatMap((modalite) => [{ modalite, depth }, ...visit(modalite.id, depth + 1)])
  return visit(null, 0)
}

export const selectionLabel = ({
  axes,
  selection,
}: {
  axes: ReadonlyArray<AxeWithModalites>
  selection: SelectionModalites
}): string | null => {
  if (axes.length === 0) return null
  if (selection.size === 0) return 'Ensemble'
  return axes
    .map((axe) => {
      const modaliteId = selection.get(axe.id)
      const modalite = axe.modalites.find((m) => m.id === modaliteId)
      return modalite ? modalite.nom : `${axe.nom} : ensemble`
    })
    .join(' · ')
}
