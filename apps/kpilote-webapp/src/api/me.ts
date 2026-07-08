import { type MeApiModel, meApiModelSchema } from '@pilote/kpilote-shared/me'

import { apiClient } from '@/api/client'

export const fetchMe = async (): Promise<MeApiModel> => {
  const json = await apiClient.get('me').json()
  return meApiModelSchema.parse(json)
}
