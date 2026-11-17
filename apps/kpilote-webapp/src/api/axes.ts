import { type ModaliteListApiModel, modaliteListApiModelSchema } from '@pilote/kpilote-shared/axe'

import { apiClient } from '@/api/client'

export const fetchModalitesForAxe = async (axeId: string): Promise<ModaliteListApiModel> => {
  const json = await apiClient.get(`axes/${axeId}/modalites`).json()
  return modaliteListApiModelSchema.parse(json)
}
