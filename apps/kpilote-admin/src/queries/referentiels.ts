import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import {
  fetchAllReferentiels,
  fetchIndividusForReferentiel,
  fetchReferentielById,
  fetchReferentiels,
} from '@/api/referentiels'
import { fetchAllPages } from '@/lib/fetchAllPages'

export const referentielsAllQueryOptions = () =>
  queryOptions({
    queryKey: ['referentiels', 'all'],
    queryFn: () => fetchAllReferentiels(),
  })

export const referentielsInfiniteQueryOptions = (recherche: string) =>
  infiniteQueryOptions({
    queryKey: ['referentiels', { recherche }],
    queryFn: ({ pageParam }) =>
      fetchReferentiels({ recherche: recherche || undefined, cursor: pageParam ?? undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? (lastPage.pagination.cursor ?? undefined) : undefined,
  })

export const referentielQueryOptions = (id: string) =>
  queryOptions({ queryKey: ['referentiel', id], queryFn: () => fetchReferentielById(id) })

export const referentielIndividusQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['referentiel', id, 'individus'],
    queryFn: () =>
      fetchAllPages((cursor) => fetchIndividusForReferentiel(id, cursor ? { cursor } : {})),
  })
