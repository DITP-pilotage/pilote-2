import { queryOptions } from '@tanstack/react-query'

import { fetchApiKeys } from '@/api/apiKeys'

export const apiKeysQueryOptions = () =>
  queryOptions({ queryKey: ['api-keys'], queryFn: fetchApiKeys })
