import { type FeatureFlippingListApiModel } from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { toFeatureFlippingApiModel } from '@/featureFlipping/utils'
import { db } from '@/framework/persistence/dbStore'

export const listerFeatureFlippings = (): ResultAsync<FeatureFlippingListApiModel, never> =>
  ResultAsync.fromSafePromise(db().featureFlipping.findMany({ orderBy: { nom: 'asc' } })).map(
    (rows) => rows.map(toFeatureFlippingApiModel),
  )
