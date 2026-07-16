import {
  type FeatureDetailApiModel,
  type ModifierEtatFeatureBody,
} from '@pilote/kpilote-shared/feature'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { featureInclude, toFeatureDetailApiModel } from '@/feature/utils'

const performModifierEtat = async (
  id: string,
  body: ModifierEtatFeatureBody,
): Promise<FeatureDetailApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const row = await db().feature.update({
    where: { id },
    data: { etat: body.etat },
    include: featureInclude,
  })
  return toFeatureDetailApiModel(row)
}

export const modifierEtatFeature = (
  id: string,
  body: ModifierEtatFeatureBody,
): ResultAsync<FeatureDetailApiModel, never> =>
  ResultAsync.fromSafePromise(performModifierEtat(id, body))
