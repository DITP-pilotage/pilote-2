import { type DeleteValeurAvancementBody } from '@pilote/kpilot-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError } from '@/individu/permission'
import { resolveIndicateurAndIndividuForWrite } from '@/indicateur/resolveIndicateurAndIndividuForWrite'

export type DeleteValeurAvancementError = IndividuInconnuError

type DeleteValeurAvancementParams = {
  indicateurPublicId: string
  body: DeleteValeurAvancementBody
}

export const deleteValeurAvancement = ({
  indicateurPublicId,
  body,
}: DeleteValeurAvancementParams): ResultAsync<void, DeleteValeurAvancementError> =>
  resolveIndicateurAndIndividuForWrite({
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
