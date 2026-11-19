import { err, type Result } from 'neverthrow'

import {
  loadModalitesContext,
  type RequestedModalite,
  type SaisieModalitesError,
  validateSaisieModalites,
} from '@/axe/requestedModalites'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividuForWriteData } from '@/indicateur/resolveIndicateurAndIndividuForWriteData'

type CelluleForWrite = {
  indicateur: { id: string; publicId: string }
  individu: { id: string; publicId: string }
  // Une modalité feuille par axe déclaré, dans l'ordre des axes.
  modalites: RequestedModalite[]
}

type ResolveCelluleForWriteParams = {
  indicateurPublicId: string
  individuPublicId: string
  modalitePublicIds: ReadonlyArray<string>
}

type ResolveCelluleForWriteError = IndividuInconnuError | SaisieModalitesError

// Cible d'une écriture unitaire : l'individu (droits et rattachement à
// l'indicateur) et les modalités qui complètent la cellule.
export const resolveCelluleForWrite = async ({
  indicateurPublicId,
  individuPublicId,
  modalitePublicIds,
}: ResolveCelluleForWriteParams): Promise<Result<CelluleForWrite, ResolveCelluleForWriteError>> => {
  const resolved = await resolveIndicateurAndIndividuForWriteData({
    indicateurPublicId,
    individuPublicId,
  })
  if (resolved.isErr()) return err(resolved.error)
  const { indicateur, individu } = resolved.value

  const context = await loadModalitesContext({ indicateurId: indicateur.id, modalitePublicIds })
  return validateSaisieModalites({ context, modalitePublicIds }).map((modalites) => ({
    indicateur,
    individu,
    modalites,
  }))
}
