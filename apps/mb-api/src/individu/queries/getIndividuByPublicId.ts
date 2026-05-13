import { type IndividuApiModel } from '@pilote/mb-shared/individu'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { toIndividuApiModel } from '@/individu/utils'

export const getIndividuByPublicId = (publicId: string): ResultAsync<IndividuApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().individu.findUniqueOrThrow({
      where: { publicId },
      include: { referentiel: { select: { publicId: true } } },
    }),
  ).map(toIndividuApiModel)
