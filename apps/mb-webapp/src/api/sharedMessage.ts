import { sharedMessageSchema, type SharedMessage } from '@pilote/mb-shared'

import { apiClient } from '@/api/client'

export const fetchSharedMessage = async (): Promise<SharedMessage> => {
  const json = await apiClient.get('shared-message').json()
  return sharedMessageSchema.parse(json)
}
