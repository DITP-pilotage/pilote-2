import { type DeleteObjectifIndicateurIndividuBody } from '@pilote/kpilote-shared/objectifIndicateurIndividu'
import { okAsync, ResultAsync } from 'neverthrow'

import { type ErreurCellule, resoudreCelluleEcriture } from '@/dimension/celluleEcriture'
import { db } from '@/framework/persistence/dbStore'
import { resolveIndicateurForWriteData } from '@/indicateur/resolveIndicateurForWrite'

export type DeleteObjectifIndicateurIndividuError = ErreurCellule

type DeleteObjectifIndicateurIndividuParams = {
  indicateurPublicId: string
  body: DeleteObjectifIndicateurIndividuBody
}

export const deleteObjectifIndicateurIndividu = ({
  indicateurPublicId,
  body,
}: DeleteObjectifIndicateurIndividuParams): ResultAsync<
  void,
  DeleteObjectifIndicateurIndividuError
> =>
  resolveIndicateurForWriteData({ indicateurPublicId }).andThen(({ indicateur, principalId }) =>
    resoudreCelluleEcriture({
      indicateurId: indicateur.id,
      principalId,
      sousCube: 'objectifs',
      cible: body,
      creer: false,
    }).andThen(({ celluleId }) =>
      celluleId === null
        ? okAsync(undefined)
        : ResultAsync.fromSafePromise(
            db().objectifIndicateurIndividu.deleteMany({
              where: { indicateurId: indicateur.id, celluleId, dateCible: body.dateCible },
            }),
          ).map(() => undefined),
    ),
  )
