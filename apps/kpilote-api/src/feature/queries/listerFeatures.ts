import { type FeatureListApiModel } from '@pilote/kpilote-shared/feature'
import { ResultAsync } from 'neverthrow'

import { ensureAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { toFeatureApiModel } from '@/feature/utils'

const performList = async (): Promise<FeatureListApiModel> => {
  ensureAdmin()
  const rows = await db().feature.findMany({ orderBy: { nom: 'asc' } })
  return rows.map(toFeatureApiModel)
}

export const listerFeatures = (): ResultAsync<FeatureListApiModel, never> =>
  ResultAsync.fromSafePromise(performList())
