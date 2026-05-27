import { type DeleteObjectifIndicateurIndividuBody } from '@pilote/mb-shared/objectifIndicateurIndividu'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividu } from '@/indicateur/resolveIndicateurAndIndividu'

export type DeleteObjectifIndicateurIndividuError = IndividuInconnuError

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
  resolveIndicateurAndIndividu({
    indicateurPublicId,
    individuPublicId: body.individu,
  }).andThen(({ indicateur, individu }) =>
    ResultAsync.fromSafePromise(
      db().objectifIndicateurIndividu.deleteMany({
        where: {
          indicateurId: indicateur.id,
          individuId: individu.id,
          date: body.date,
        },
      }),
    ).map(() => undefined),
  )
