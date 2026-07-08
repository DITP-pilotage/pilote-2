import {
  type MePermissionsApiModel,
  mePermissionsApiModelSchema,
} from '@pilote/kpilote-shared/mePermissions'

import { apiClient } from '@/api/client'

export const fetchMePermissions = async (): Promise<MePermissionsApiModel> => {
  const json = await apiClient.get('me/permissions').json()
  return mePermissionsApiModelSchema.parse(json)
}
