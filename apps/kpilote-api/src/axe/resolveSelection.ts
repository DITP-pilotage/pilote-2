import { ok, type Result } from 'neverthrow'

import { type Selection } from '@/axe/modalites'
import {
  loadModalitesContext,
  modalitesErrorMessage,
  type ResolveModalitesError,
  resolveModalites,
} from '@/axe/requestedModalites'

export type ResolveSelectionError = ResolveModalitesError

type ResolveSelectionParams = {
  indicateurId: string
  modalitePublicIds: ReadonlyArray<string>
}

// Transforme les modalités demandées dans une lecture (`modalites=`) en
// sélection axe → modalité pour l'indicateur. Sans modalité : « Tous » sur
// chaque axe (sélection vide), y compris pour un indicateur sans axe. Une
// modalité parente est acceptée : sa valeur se calcule.
export const resolveSelection = async ({
  indicateurId,
  modalitePublicIds,
}: ResolveSelectionParams): Promise<Result<Selection, ResolveSelectionError>> => {
  // Sans modalité, rien à lire : « Tous » sur chaque axe.
  if (modalitePublicIds.length === 0) return ok(new Map())
  const context = await loadModalitesContext({ indicateurId, modalitePublicIds })
  return resolveModalites({ context, modalitePublicIds }).map(
    (modaliteByAxe): Selection =>
      new Map([...modaliteByAxe].map(([axeId, modalite]) => [axeId, modalite.id])),
  )
}

export const selectionErrorMessage = (error: ResolveSelectionError): string =>
  modalitesErrorMessage(error)
