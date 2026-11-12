import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { type Selection } from '@/axe/calculMarginale'
import { db } from '@/framework/persistence/dbStore'

export type ResoudreSelectionError =
  | { type: 'MODALITE_INCONNUE'; modalites: string[] }
  | { type: 'AXE_NON_DECLARE'; modalites: string[] }
  | { type: 'MODALITES_MEME_AXE'; axe: string; modalites: string[] }

// Transforme les modalités demandées dans une lecture (`modalites=`) en
// sélection axe → modalité pour l'indicateur. Sans modalité : « Tous » sur
// chaque axe (sélection vide), y compris pour un indicateur sans axe.
const resoudre = async ({
  indicateurId,
  modalitePublicIds,
}: {
  indicateurId: string
  modalitePublicIds: ReadonlyArray<string>
}): Promise<Result<Selection, ResoudreSelectionError>> => {
  if (modalitePublicIds.length === 0) return ok(new Map())

  const demandees = [...new Set(modalitePublicIds)]
  const modalites = await db().modalite.findMany({
    where: { publicId: { in: demandees } },
    include: { axe: true },
  })
  const trouvees = new Set(modalites.map((modalite) => modalite.publicId))
  const inconnues = demandees.filter((publicId) => !trouvees.has(publicId))
  if (inconnues.length > 0) return err({ type: 'MODALITE_INCONNUE', modalites: inconnues.sort() })

  const declarations = await db().indicateurAxe.findMany({ where: { indicateurId } })
  const axesDeclares = new Set(declarations.map((declaration) => declaration.axeId))
  const horsAxes = modalites.filter((modalite) => !axesDeclares.has(modalite.axeId))
  if (horsAxes.length > 0) {
    return err({ type: 'AXE_NON_DECLARE', modalites: horsAxes.map((m) => m.publicId).sort() })
  }

  const selection = new Map<string, string>()
  for (const modalite of modalites) {
    if (selection.has(modalite.axeId)) {
      const memeAxe = modalites.filter((m) => m.axeId === modalite.axeId).map((m) => m.publicId)
      return err({
        type: 'MODALITES_MEME_AXE',
        axe: modalite.axe.publicId,
        modalites: memeAxe.sort(),
      })
    }
    selection.set(modalite.axeId, modalite.id)
  }
  return ok(selection)
}

export const resoudreSelection = (params: {
  indicateurId: string
  modalitePublicIds: ReadonlyArray<string>
}): ResultAsync<Selection, ResoudreSelectionError> =>
  ResultAsync.fromSafePromise(resoudre(params)).andThen((result) => result)

export const messageResoudreSelectionError = (error: ResoudreSelectionError): string => {
  switch (error.type) {
    case 'MODALITE_INCONNUE':
      return `Modalités inconnues : ${error.modalites.join(', ')}.`
    case 'AXE_NON_DECLARE':
      return `Ces modalités appartiennent à un axe que l’indicateur ne déclare pas : ${error.modalites.join(', ')}.`
    case 'MODALITES_MEME_AXE':
      return `Une seule modalité par axe : ${error.modalites.join(', ')} appartiennent toutes à l’axe ${error.axe}.`
  }
}
