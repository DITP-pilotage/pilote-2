import { queryOptions } from '@tanstack/react-query'

import {
  fetchIndicateurById,
  fetchIndicateurs,
  fetchIndividusForIndicateur,
  fetchValeursForIndicateur,
  type IndicateursQueryParams,
} from '@/api/indicateurs'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const indicateursQueryOptions = (params: IndicateursQueryParams) =>
  queryOptions({
    queryKey: ['indicateurs', params],
    queryFn: () => fetchIndicateurs(params),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['indicateur', id],
    queryFn: () => fetchIndicateurById(id),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurIndividusQueryOptions = (indicateurId: string) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'individus'],
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchIndividusForIndicateur(indicateurId, cursor ? { cursor } : {}),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurValeursQueryOptions = (indicateurId: string, individuId: string) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'valeurs', individuId],
    queryFn: () => fetchValeursForIndicateur(indicateurId, { individus: [individuId] }),
    staleTime: DEFAULT_STALE_TIME,
  })
