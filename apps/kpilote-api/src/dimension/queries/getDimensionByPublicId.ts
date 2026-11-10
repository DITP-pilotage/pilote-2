import { type DimensionApiModel } from '@pilote/kpilote-shared/dimension'
import { ResultAsync } from 'neverthrow'

import { dimensionInclude, toDimensionApiModel } from '@/dimension/utils'
import { db } from '@/framework/persistence/dbStore'

export const getDimensionByPublicId = (publicId: string): ResultAsync<DimensionApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().dimension.findUniqueOrThrow({ where: { publicId }, include: dimensionInclude }),
  ).map(toDimensionApiModel)
