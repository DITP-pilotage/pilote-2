import { ok, ResultAsync } from 'neverthrow'

import {
  chargerContexteModalites,
  type LireModalitesError,
  lireModalites,
  messageModalitesError,
} from '@/axe/modalitesDemandees'
import { type Selection } from '@/axe/modalites'

export type ResoudreSelectionError = LireModalitesError

// Transforme les modalités demandées dans une lecture (`modalites=`) en
// sélection axe → modalité pour l'indicateur. Sans modalité : « Tous » sur
// chaque axe (sélection vide), y compris pour un indicateur sans axe. Une
// modalité parente est acceptée : sa valeur se calcule.
export const resoudreSelection = ({
  indicateurId,
  modalitePublicIds,
}: {
  indicateurId: string
  modalitePublicIds: ReadonlyArray<string>
}): ResultAsync<Selection, ResoudreSelectionError> => {
  if (modalitePublicIds.length === 0) return ResultAsync.fromSafePromise(Promise.resolve(new Map()))
  return ResultAsync.fromSafePromise(
    chargerContexteModalites({ indicateurId, modalitePublicIds }),
  ).andThen((contexte) =>
    lireModalites({ contexte, modalitePublicIds }).andThen((parAxe) =>
      ok<Selection, ResoudreSelectionError>(
        new Map([...parAxe].map(([axeId, modalite]) => [axeId, modalite.id])),
      ),
    ),
  )
}

export const messageResoudreSelectionError = (error: ResoudreSelectionError): string =>
  messageModalitesError(error)
