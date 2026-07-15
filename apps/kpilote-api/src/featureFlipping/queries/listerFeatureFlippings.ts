import { type FeatureFlippingListApiModel } from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { toFeatureFlippingApiModel } from '@/featureFlipping/utils'

const performList = async (): Promise<FeatureFlippingListApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const rows = await db().featureFlipping.findMany({ orderBy: { nom: 'asc' } })
  return rows.map(toFeatureFlippingApiModel)
}

export const listerFeatureFlippings = (): ResultAsync<FeatureFlippingListApiModel, never> =>
  ResultAsync.fromSafePromise(performList())
