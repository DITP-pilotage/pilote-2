import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { fetchAxeById, fetchAxes, fetchModalites } from '@/api/axes'

export const axesInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['axes', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchAxes({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const axeQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['axe', id], queryFn: () => fetchAxeById(id) })

export const axeModalitesQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['axe', id, 'modalites'], queryFn: () => fetchModalites(id) })
