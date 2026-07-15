import { type FeatureFlippingDetailApiModel } from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { featureFlippingInclude, toFeatureFlippingDetailApiModel } from '@/featureFlipping/utils'

const performGet = async (id: string): Promise<FeatureFlippingDetailApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const row = await db().featureFlipping.findUniqueOrThrow({
    where: { id },
    include: featureFlippingInclude,
  })
  return toFeatureFlippingDetailApiModel(row)
}

export const getFeatureFlippingById = (
  id: string,
): ResultAsync<FeatureFlippingDetailApiModel, never> => ResultAsync.fromSafePromise(performGet(id))
