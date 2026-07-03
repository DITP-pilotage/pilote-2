import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { fetchIndicateurs } from '@/api/indicateurs'
import { fetchPaniers } from '@/api/paniers'
import { fetchPrincipalPermissions } from '@/api/permissions'

export const principalPermissionsQueryOptions = (principalId: string) =>
  queryOptions({
    queryKey: ['permissions', principalId],
    queryFn: () => fetchPrincipalPermissions(principalId),
  })

export const paniersSearchInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['paniers-search', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchPaniers({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const indicateursSearchInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['indicateurs-search', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchIndicateurs({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })
