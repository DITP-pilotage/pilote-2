import { type PanierApiModel } from '@pilote/mb-shared/panier'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { toPanierApiModel } from '@/panier/utils'

export const getPanierByPublicId = (publicId: string): ResultAsync<PanierApiModel, never> => {
  return ResultAsync.fromSafePromise(
    db().panier.findUniqueOrThrow({
      where: { publicId },
      include: {
        indicateurs: {
          orderBy: { createdAt: 'asc' },
          include: { indicateur: { select: { publicId: true } } },
        },
      },
    }),
  ).map(toPanierApiModel)
}
