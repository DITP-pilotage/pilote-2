import { queryOptions } from '@tanstack/react-query'

import { fetchAllRelations } from '@/api/relations'

export const relationsAllQueryOptions = () =>
  queryOptions({
    queryKey: ['relations', 'all'],
    queryFn: () => fetchAllRelations(),
  })
