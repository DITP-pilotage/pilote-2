import {
  type FeatureFlippingDetailApiModel,
  type ModifierEtatFeatureFlippingBody,
} from '@pilote/kpilote-shared/featureFlipping'
import { ResultAsync } from 'neverthrow'

import { featureFlippingInclude, toFeatureFlippingDetailApiModel } from '@/featureFlipping/utils'
import { db } from '@/framework/persistence/dbStore'

export const modifierEtatFeatureFlipping = (
  id: string,
  body: ModifierEtatFeatureFlippingBody,
): ResultAsync<FeatureFlippingDetailApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().featureFlipping.update({
      where: { id },
      data: { etat: body.etat },
      include: featureFlippingInclude,
    }),
  ).map(toFeatureFlippingDetailApiModel)
