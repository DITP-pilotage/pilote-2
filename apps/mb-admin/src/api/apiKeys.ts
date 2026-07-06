import type {
  ApiKeyApiModel,
  ApiKeyListApiModel,
  CreateApiKeyBody,
  CreatedApiKeyApiModel,
} from '@pilote/mb-shared/apiKey'
import {
  apiKeyApiModelSchema,
  apiKeyListApiModelSchema,
  createdApiKeyApiModelSchema,
} from '@pilote/mb-shared/apiKey'

import { bffClient } from '@/api/client'

export const fetchApiKeys = async (): Promise<ApiKeyListApiModel> => {
  const json = await bffClient.get('api-keys').json()
  return apiKeyListApiModelSchema.parse(json)
}

export const fetchApiKeyById = async (id: string): Promise<ApiKeyApiModel> => {
  const json = await bffClient.get(`api-keys/${id}`).json()
  return apiKeyApiModelSchema.parse(json)
}

export const createApiKey = async (body: CreateApiKeyBody): Promise<CreatedApiKeyApiModel> => {
  const json = await bffClient.post('api-keys', { json: body }).json()
  return createdApiKeyApiModelSchema.parse(json)
}

export const revokeApiKey = async (id: string): Promise<ApiKeyApiModel> => {
  const json = await bffClient.post(`api-keys/${id}/revoke`).json()
  return apiKeyApiModelSchema.parse(json)
}
