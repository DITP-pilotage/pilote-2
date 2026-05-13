import { queryOptions } from '@tanstack/react-query'

import { fetchIndividusForReferentiel, fetchReferentielById } from '@/api/referentiels'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const referentielQueryOptions = (referentielId: string) =>
  queryOptions({
    queryKey: ['referentiel', referentielId],
    queryFn: () => fetchReferentielById(referentielId),
    staleTime: DEFAULT_STALE_TIME,
  })

export const referentielIndividusQueryOptions = (referentielId: string) =>
  queryOptions({
    queryKey: ['referentiel', referentielId, 'individus'],
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchIndividusForReferentiel(referentielId, cursor ? { cursor } : {}),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })
