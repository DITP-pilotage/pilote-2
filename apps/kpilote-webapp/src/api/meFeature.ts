import { type MeFeatureApiModel, meFeatureApiModelSchema } from '@pilote/kpilote-shared/meFeature'

import { apiClient } from '@/api/client'

export const fetchMeFeature = async (): Promise<MeFeatureApiModel> => {
  const json = await apiClient.get('me/features').json()
  return meFeatureApiModelSchema.parse(json)
}
