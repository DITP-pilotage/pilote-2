import { infiniteQueryOptions } from '@tanstack/react-query'

import { fetchReferentiels } from '@/api/referentiels'

export const referentielsInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['referentiels', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchReferentiels({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })
