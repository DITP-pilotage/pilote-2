import {
  type FeatureFlippingDetailApiModel,
  type ModifierEtatFeatureFlippingBody,
} from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { featureFlippingInclude, toFeatureFlippingDetailApiModel } from '@/featureFlipping/utils'

const performModifierEtat = async (
  id: string,
  body: ModifierEtatFeatureFlippingBody,
): Promise<FeatureFlippingDetailApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  const row = await db().featureFlipping.update({
    where: { id },
    data: { etat: body.etat },
    include: featureFlippingInclude,
  })
  return toFeatureFlippingDetailApiModel(row)
}

export const modifierEtatFeatureFlipping = (
  id: string,
  body: ModifierEtatFeatureFlippingBody,
): ResultAsync<FeatureFlippingDetailApiModel, never> =>
  ResultAsync.fromSafePromise(performModifierEtat(id, body))
