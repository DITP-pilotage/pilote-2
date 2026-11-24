import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import { sortBy } from 'es-toolkit'

import { type AxeWithModalites } from '@/lib/axes/selection'

// Les modalités feuilles d'un axe : celles qu'aucune modalité n'a pour parent.
// Ce sont les seules qui portent une saisie. Triées par identifiant.
export const listLeafModalites = (axe: AxeWithModalites): ModaliteApiModel[] => {
  const parentIds = new Set(axe.modalites.map((modalite) => modalite.parent))
  const leaves = axe.modalites.filter((modalite) => !parentIds.has(modalite.id))
  return sortBy(leaves, [(modalite) => modalite.id])
}
