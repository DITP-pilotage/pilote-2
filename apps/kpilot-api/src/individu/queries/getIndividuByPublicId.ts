import { type IndividuApiModel } from '@pilote/kpilot-shared/individu'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { individuInclude, toIndividuApiModel } from '@/individu/utils'

export const getIndividuByPublicId = (publicId: string): ResultAsync<IndividuApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().individu.findUniqueOrThrow({
      where: { publicId },
      include: individuInclude,
    }),
  ).map(toIndividuApiModel)
