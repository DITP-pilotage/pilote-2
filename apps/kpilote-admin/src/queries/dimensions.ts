import { queryOptions } from '@tanstack/react-query'

import { fetchAllDimensions, fetchDimensionById } from '@/api/dimensions'

export const dimensionsAllQueryOptions = () =>
  queryOptions({
    queryKey: ['dimensions', 'all'],
    queryFn: () => fetchAllDimensions(),
  })

export const dimensionQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['dimension', id], queryFn: () => fetchDimensionById(id) })
