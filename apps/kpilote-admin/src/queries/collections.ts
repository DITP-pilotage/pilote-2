import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import {
  fetchCollectionById,
  fetchCollectionPermissions,
  fetchCollections,
} from '@/api/collections'

export const collectionsInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['collections', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchCollections({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const collectionQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['collection', id], queryFn: () => fetchCollectionById(id) })

export const collectionPermissionsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['collection', id, 'permissions'],
    queryFn: () => fetchCollectionPermissions(id),
  })
