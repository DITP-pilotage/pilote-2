import { type ReferentielApiModel } from '@pilote/mb-shared/api'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { toReferentielApiModel } from '@/referentiel/utils'

export const getReferentielByPublicId = (
  publicId: string,
): ResultAsync<ReferentielApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().referentiel.findUniqueOrThrow({
      where: { publicId },
      include: { _count: { select: { individus: true } } },
    }),
  ).map(toReferentielApiModel)
