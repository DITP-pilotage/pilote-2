import { type ListPaniersQuery } from '@pilote/kpilote-shared/panier'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

import { fetchPanierById, fetchPaniers, fetchPanierTauxProgression } from '@/api/paniers'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const paniersQueryOptions = (params: ListPaniersQuery) =>
  queryOptions({
    queryKey: ['paniers', params],
    queryFn: () => fetchPaniers(params),
    staleTime: DEFAULT_STALE_TIME,
  })

/**
 * Toutes les pages de paniers en une liste, pour un filtrage 100% client
 * (ex: command palette ⌘K). Cache dédié — pattern d'accès distinct des pages
 * liste paginées côté serveur.
 */
export const allPaniersQueryOptions = () =>
  queryOptions({
    queryKey: ['paniers', 'all'],
    queryFn: () => fetchAllPaginatedItems((cursor) => fetchPaniers({ cursor, pageSize: 100 })),
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadPaniers = ({
  queryClient,
  query,
}: {
  queryClient: QueryClient
  query: ListPaniersQuery
}) => queryClient.fetchQuery(paniersQueryOptions(query))

export const panierQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['panier', id],
    queryFn: () => fetchPanierById(id),
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadPanier = ({
  queryClient,
  panierId,
}: {
  queryClient: QueryClient
  panierId: string
}) => queryClient.fetchQuery(panierQueryOptions(panierId))

export const panierTauxProgressionQueryOptions = ({
  panierId,
  individu,
}: {
  panierId: string
  individu: string
}) =>
  queryOptions({
    queryKey: ['panier', panierId, 'taux-progression', individu],
    queryFn: () => fetchPanierTauxProgression({ panierId, individu }),
    staleTime: DEFAULT_STALE_TIME,
  })
