import {
  type MeFeatureFlippingApiModel,
  meFeatureFlippingApiModelSchema,
} from '@pilote/kpilote-shared/meFeatureFlipping'

import { apiClient } from '@/api/client'

export const fetchMeFeatureFlipping = async (): Promise<MeFeatureFlippingApiModel> => {
  const json = await apiClient.get('me/feature-flipping').json()
  return meFeatureFlippingApiModelSchema.parse(json)
}
