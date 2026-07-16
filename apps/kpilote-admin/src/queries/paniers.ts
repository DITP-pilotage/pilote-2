import { queryOptions } from '@tanstack/react-query'

import { fetchAllPaniers } from '@/api/paniers'

export const paniersAllQueryOptions = () =>
  queryOptions({
    queryKey: ['paniers', 'all'],
    queryFn: () => fetchAllPaniers(),
  })
