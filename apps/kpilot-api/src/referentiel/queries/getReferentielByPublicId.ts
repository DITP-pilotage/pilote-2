import { type ReferentielApiModel } from '@pilote/kpilot-shared/referentiel'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { toReferentielApiModel } from '@/referentiel/utils'

export const getReferentielByPublicId = (
  publicId: string,
): ResultAsync<ReferentielApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().referentiel.findUniqueOrThrow({
      where: { publicId },
      include: {
        _count: { select: { individus: true } },
        widgets: { include: { widget: true }, orderBy: { createdAt: 'asc' } },
      },
    }),
  ).map(toReferentielApiModel)
