import { type DeleteValeurAvancementBody } from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividu } from '@/indicateur/resolveIndicateurAndIndividu'

export type DeleteValeurAvancementError = IndividuInconnuError

type DeleteValeurAvancementParams = {
  indicateurPublicId: string
  body: DeleteValeurAvancementBody
}

export const deleteValeurAvancement = ({
  indicateurPublicId,
  body,
}: DeleteValeurAvancementParams): ResultAsync<void, DeleteValeurAvancementError> =>
  resolveIndicateurAndIndividu({
    indicateurPublicId,
    individuPublicId: body.individu,
  }).andThen(({ indicateur, individu }) =>
    ResultAsync.fromSafePromise(
      db().valeurAvancement.deleteMany({
        where: {
          indicateurId: indicateur.id,
          individuId: individu.id,
          date: body.date,
        },
      }),
    ).map(() => undefined),
  )
