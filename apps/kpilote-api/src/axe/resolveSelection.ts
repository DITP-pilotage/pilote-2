import { ok, ResultAsync } from 'neverthrow'

import {
  loadModalitesContext,
  type ResolveModalitesError,
  resolveModalites,
  modalitesErrorMessage,
} from '@/axe/requestedModalites'
import { type Selection } from '@/axe/modalites'

export type ResolveSelectionError = ResolveModalitesError

// Transforme les modalités demandées dans une lecture (`modalites=`) en
// sélection axe → modalité pour l'indicateur. Sans modalité : « Tous » sur
// chaque axe (sélection vide), y compris pour un indicateur sans axe. Une
// modalité parente est acceptée : sa valeur se calcule.
export const resolveSelection = ({
  indicateurId,
  modalitePublicIds,
}: {
  indicateurId: string
  modalitePublicIds: ReadonlyArray<string>
}): ResultAsync<Selection, ResolveSelectionError> => {
  if (modalitePublicIds.length === 0) return ResultAsync.fromSafePromise(Promise.resolve(new Map()))
  return ResultAsync.fromSafePromise(
    loadModalitesContext({ indicateurId, modalitePublicIds }),
  ).andThen((contexte) =>
    resolveModalites({ contexte, modalitePublicIds }).andThen((parAxe) =>
      ok<Selection, ResolveSelectionError>(
        new Map([...parAxe].map(([axeId, modalite]) => [axeId, modalite.id])),
      ),
    ),
  )
}

export const selectionErrorMessage = (error: ResolveSelectionError): string =>
  modalitesErrorMessage(error)
