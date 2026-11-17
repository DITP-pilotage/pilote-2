import { ResultAsync } from 'neverthrow'

import {
  chargerContexteModalites,
  type ModaliteDemandee,
  type SaisieModalitesError,
  validerModalitesSaisie,
} from '@/axe/modalitesDemandees'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividuForWriteData } from '@/indicateur/resolveIndicateurAndIndividuForWriteData'

type CelluleForWrite = {
  indicateur: { id: string; publicId: string }
  individu: { id: string; publicId: string }
  // Une modalité feuille par axe déclaré, dans l'ordre des axes.
  modalites: ModaliteDemandee[]
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
        chargerContexteModalites({ indicateurId: indicateur.id, modalitePublicIds }),
      ).andThen((contexte) =>
        validerModalitesSaisie({ contexte, modalitePublicIds }).map((modalites) => ({
          indicateur,
          individu,
          modalites,
        })),
      ),
  )
