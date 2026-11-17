import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'

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
  modaliteParId: ReadonlyMap<string, ModaliteCalcul>
  racinesParAxe: ReadonlyMap<string, ReadonlyArray<string>>
  enfantsParModalite: ReadonlyMap<string, ReadonlyArray<string>>
}

export const construireArbreModalites = (
  modalites: ReadonlyArray<ModaliteCalcul>,
): ArbreModalites => {
  const racinesParAxe = new Map<string, string[]>()
  const enfantsParModalite = new Map<string, string[]>()
  for (const modalite of modalites) {
    const [index, cle] =
      modalite.parentId === null
        ? [racinesParAxe, modalite.axeId]
        : [enfantsParModalite, modalite.parentId]
    index.set(cle, [...(index.get(cle) ?? []), modalite.id])
  }
  return {
    modaliteParId: new Map(modalites.map((modalite) => [modalite.id, modalite])),
    racinesParAxe,
    enfantsParModalite,
  }
}

export const estFeuille = ({
  arbre,
  modaliteId,
}: {
  arbre: ArbreModalites
  modaliteId: string
}): boolean => (arbre.enfantsParModalite.get(modaliteId)?.length ?? 0) === 0

// `modaliteId` est `ancetre` ou l'un de ses descendants.
export const descendDe = ({
  arbre,
  modaliteId,
  ancetre,
}: {
  arbre: ArbreModalites
  modaliteId: string
  ancetre: string
}): boolean => {
  for (
    let id: string | null = modaliteId;
    id !== null;
    id = arbre.modaliteParId.get(id)?.parentId ?? null
  ) {
    if (id === ancetre) return true
  }
  return false
}

// Descend l'axe d'un niveau : « Tous » donne les modalités racines, une
// modalité parente ses modalités enfants.
export const descendreUnNiveau = ({
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
      ? (arbre.racinesParAxe.get(axe.id) ?? [])
      : (arbre.enfantsParModalite.get(modaliteId) ?? [])
  return modalitesEnfants.map((enfant) => new Map([...selection, [axe.id, enfant]]))
}
