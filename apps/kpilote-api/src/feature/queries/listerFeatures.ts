import { type FeatureListApiModel } from '@pilote/kpilote-shared/feature'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { toFeatureApiModel } from '@/feature/utils'

const performList = async (): Promise<FeatureListApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const rows = await db().feature.findMany({ orderBy: { nom: 'asc' } })
  return rows.map(toFeatureApiModel)
}

export const listerFeatures = (): ResultAsync<FeatureListApiModel, never> =>
  ResultAsync.fromSafePromise(performList())
