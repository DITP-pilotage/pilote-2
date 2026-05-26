import { type DeleteObjectifAvancementBody } from '@pilote/mb-shared/objectifAvancement'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividu } from '@/indicateur/resolveIndicateurAndIndividu'

export type DeleteObjectifAvancementError = IndividuInconnuError

type DeleteObjectifAvancementParams = {
  indicateurPublicId: string
  body: DeleteObjectifAvancementBody
}

export const deleteObjectifAvancement = ({
  indicateurPublicId,
  body,
}: DeleteObjectifAvancementParams): ResultAsync<void, DeleteObjectifAvancementError> =>
  resolveIndicateurAndIndividu({
    indicateurPublicId,
    individuPublicId: body.individu,
  }).andThen(({ indicateur, individu }) =>
    ResultAsync.fromSafePromise(
      db().objectifAvancement.deleteMany({
        where: {
          indicateurId: indicateur.id,
          individuId: individu.id,
          date: body.date,
        },
      }),
    ).map(() => undefined),
  )
