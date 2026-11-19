import { err, ok, type Result } from 'neverthrow'

import { diff } from '@/framework/collections/diff'

export type AxesVerrouillesError = { type: 'AXES_VERROUILLES'; nombreValeurs: number }

// Une valeur est précisée par une modalité de chaque axe déclaré. Les valeurs
// déjà saisies ne portent pas de modalité pour un axe ajouté, et en portent une
// pour un axe retiré : ajouter ou retirer un axe est refusé dès que l'indicateur
// a des valeurs. Changer la fonction ou l'ordre ne touche que le calcul des
// totaux : c'est permis.
export const checkAxesModifiables = ({
  axeIdsActuels,
  axeIdsCibles,
  nombreValeurs,
}: {
  axeIdsActuels: ReadonlyArray<string>
  axeIdsCibles: ReadonlyArray<string>
  nombreValeurs: number
}): Result<void, AxesVerrouillesError> => {
  const { toAdd, toRemove } = diff(axeIdsCibles, axeIdsActuels)
  const axesInchanges = toAdd.length === 0 && toRemove.length === 0
  if (axesInchanges) return ok()
  if (nombreValeurs === 0) return ok()
  return err({ type: 'AXES_VERROUILLES', nombreValeurs })
}
