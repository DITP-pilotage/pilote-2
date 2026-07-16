import {
  featureApiModelSchema,
  featureDetailApiModelSchema,
  featureListApiModelSchema,
} from '@pilote/kpilote-shared/feature'

import { erreur400, erreur404, succes200 } from '@/framework/openapi/responses'

export const FeatureApiModelSchema = featureApiModelSchema.openapi('FeatureApiModel')
export const FeatureDetailApiModelSchema =
  featureDetailApiModelSchema.openapi('FeatureDetailApiModel')
export const FeatureListApiModelSchema = featureListApiModelSchema.openapi('FeatureListApiModel')

export const reponseListeFeature = {
  200: succes200('Features', FeatureListApiModelSchema),
}

export const reponseDetailFeature = {
  200: succes200('Feature', FeatureDetailApiModelSchema),
  400: erreur400,
  404: erreur404,
}
