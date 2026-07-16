import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { fetchAllIndicateurs, fetchIndicateurById, fetchIndicateurs } from '@/api/indicateurs'

export const indicateursAllQueryOptions = () =>
  queryOptions({
    queryKey: ['indicateurs', 'all'],
    queryFn: () => fetchAllIndicateurs(),
  })

export const indicateursInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['indicateurs', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchIndicateurs({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const indicateurQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['indicateur', id], queryFn: () => fetchIndicateurById(id) })
