import { ResultAsync } from 'neverthrow'

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

// Cible d'une écriture unitaire : l'individu (droits et rattachement à
// l'indicateur) et les modalités qui complètent la cellule.
export const resolveCelluleForWrite = ({
  indicateurPublicId,
  individuPublicId,
  modalitePublicIds,
}: {
  indicateurPublicId: string
  individuPublicId: string
  modalitePublicIds: ReadonlyArray<string>
}): ResultAsync<CelluleForWrite, IndividuInconnuError | SaisieModalitesError> =>
  resolveIndicateurAndIndividuForWriteData({ indicateurPublicId, individuPublicId }).andThen(
    ({ indicateur, individu }) =>
      ResultAsync.fromSafePromise(
        loadModalitesContext({ indicateurId: indicateur.id, modalitePublicIds }),
      ).andThen((contexte) =>
        validateSaisieModalites({ contexte, modalitePublicIds }).map((modalites) => ({
          indicateur,
          individu,
          modalites,
        })),
      ),
  )
