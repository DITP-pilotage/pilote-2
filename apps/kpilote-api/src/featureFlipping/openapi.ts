import {
  featureFlippingApiModelSchema,
  featureFlippingDetailApiModelSchema,
  featureFlippingListApiModelSchema,
} from '@pilote/kpilote-shared/featureFlipping'

import { erreur400, erreur404, succes200 } from '@/framework/openapi/responses'

export const FeatureFlippingApiModelSchema =
  featureFlippingApiModelSchema.openapi('FeatureFlippingApiModel')
export const FeatureFlippingDetailApiModelSchema = featureFlippingDetailApiModelSchema.openapi(
  'FeatureFlippingDetailApiModel',
)
export const FeatureFlippingListApiModelSchema = featureFlippingListApiModelSchema.openapi(
  'FeatureFlippingListApiModel',
)

export const reponseListeFeatureFlipping = {
  200: succes200('Feature flippings', FeatureFlippingListApiModelSchema),
}

export const reponseDetailFeatureFlipping = {
  200: succes200('Feature flipping', FeatureFlippingDetailApiModelSchema),
  400: erreur400,
  404: erreur404,
}
