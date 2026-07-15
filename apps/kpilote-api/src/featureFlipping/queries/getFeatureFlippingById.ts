import { type FeatureFlippingDetailApiModel } from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { featureFlippingInclude, toFeatureFlippingDetailApiModel } from '@/featureFlipping/utils'
import { db } from '@/framework/persistence/dbStore'

export const getFeatureFlippingById = (
  id: string,
): ResultAsync<FeatureFlippingDetailApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().featureFlipping.findUniqueOrThrow({ where: { id }, include: featureFlippingInclude }),
  ).map(toFeatureFlippingDetailApiModel)
