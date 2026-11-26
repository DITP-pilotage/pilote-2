import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'
import { toMap } from '@pilote/kpilote-shared/record'
import { groupBy, keyBy, mapValues, partition } from 'es-toolkit'

// Axes et modalités tels que le calcul des séries les lit : chaque axe déclaré
// sur un indicateur, ses modalités rangées en arbre, et une sélection d'une
// modalité (ou « Tous ») par axe.

export type AxeCalcul = {
  id: string
  fonction: Extract<FonctionAgregation, 'SUM' | 'AVG'>
}

export type ModaliteCalcul = {
  id: string
  publicId: string
  axeId: string
  parentId: string | null
}

// axeId → modaliteId ; un axe absent vaut « Tous ».
export type Selection = ReadonlyMap<string, string>

// Les modalités des axes, rangées en arbre (une forêt par axe).
export type ArbreModalites = {
  modaliteById: ReadonlyMap<string, ModaliteCalcul>
  racinesByAxe: ReadonlyMap<string, ReadonlyArray<string>>
  enfantsByModalite: ReadonlyMap<string, ReadonlyArray<string>>
}

export const buildArbreModalites = (modalites: ReadonlyArray<ModaliteCalcul>): ArbreModalites => {
  const [enfants, racines] = partition(
    modalites,
    (modalite): modalite is ModaliteCalcul & { parentId: string } => modalite.parentId !== null,
  )
  const idsOf = (group: ReadonlyArray<ModaliteCalcul>) => group.map((modalite) => modalite.id)
  return {
    modaliteById: toMap(keyBy(modalites, (modalite) => modalite.id)),
    racinesByAxe: toMap(
      mapValues(
        groupBy(racines, (modalite) => modalite.axeId),
        idsOf,
      ),
    ),
    enfantsByModalite: toMap(
      mapValues(
        groupBy(enfants, (modalite) => modalite.parentId),
        idsOf,
      ),
    ),
  }
}

export const isLeaf = ({
  arbre,
  modaliteId,
}: {
  arbre: ArbreModalites
  modaliteId: string
}): boolean => (arbre.enfantsByModalite.get(modaliteId)?.length ?? 0) === 0

// `modaliteId` est `ancestor` ou l'un de ses descendants.
export const descendsFrom = ({
  arbre,
  modaliteId,
  ancestor,
}: {
  arbre: ArbreModalites
  modaliteId: string
  ancestor: string
}): boolean => {
  for (
    let id: string | null = modaliteId;
    id !== null;
    id = arbre.modaliteById.get(id)?.parentId ?? null
  ) {
    if (id === ancestor) return true
  }
  return false
}

// Descend l'axe d'un niveau : « Tous » donne les modalités racines, une
// modalité parente ses modalités enfants.
export const descendOneLevel = ({
  arbre,
  axe,
  selection,
}: {
  arbre: ArbreModalites
  axe: AxeCalcul
  selection: Selection
}): Selection[] => {
  const modaliteId = selection.get(axe.id)
  const modalitesEnfants =
    modaliteId === undefined
      ? (arbre.racinesByAxe.get(axe.id) ?? [])
      : (arbre.enfantsByModalite.get(modaliteId) ?? [])
  return modalitesEnfants.map((enfant) => new Map([...selection, [axe.id, enfant]]))
}
