import { queryOptions } from '@tanstack/react-query'

import { fetchApiKeyById, fetchApiKeys } from '@/api/apiKeys'

export const apiKeysQueryOptions = () =>
  queryOptions({ queryKey: ['api-keys'], queryFn: fetchApiKeys })

export const apiKeyQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['api-key', id], queryFn: () => fetchApiKeyById(id) })
