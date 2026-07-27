import { infiniteQueryOptions } from '@tanstack/react-query'

import { fetchRelations } from '@/api/relations'

export const relationsInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['relations', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchRelations({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })
