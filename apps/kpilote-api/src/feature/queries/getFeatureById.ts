import { type FeatureDetailApiModel } from '@pilote/kpilote-shared/feature'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { featureInclude, toFeatureDetailApiModel } from '@/feature/utils'

const performGet = async (id: string): Promise<FeatureDetailApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const row = await db().feature.findUniqueOrThrow({
    where: { id },
    include: featureInclude,
  })
  return toFeatureDetailApiModel(row)
}

export const getFeatureById = (id: string): ResultAsync<FeatureDetailApiModel, never> =>
  ResultAsync.fromSafePromise(performGet(id))
