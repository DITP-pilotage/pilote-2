import { queryOptions } from '@tanstack/react-query'

import { fetchAllIndividus } from '@/api/individus'

export const individusAllQueryOptions = () =>
  queryOptions({
    queryKey: ['individus', 'all'],
    queryFn: () => fetchAllIndividus(),
  })
