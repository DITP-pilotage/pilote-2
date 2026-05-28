import { type ListPaniersQuery } from '@pilote/mb-shared/panier'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

import { fetchPanierById, fetchPaniers } from '@/api/paniers'

import { DEFAULT_STALE_TIME } from './utils'

export const paniersQueryOptions = (params: ListPaniersQuery) =>
  queryOptions({
    queryKey: ['paniers', params],
    queryFn: () => fetchPaniers(params),
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
