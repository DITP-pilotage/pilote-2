import { type ListPaniersQuery } from '@pilote/mb-shared/panier'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

import {
  fetchPanierById,
  fetchPanierResponsables,
  fetchPaniers,
  fetchPanierTauxProgression,
} from '@/api/paniers'

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

export const panierResponsablesQueryOptions = (panierId: string) =>
  queryOptions({
    queryKey: ['panier', panierId, 'responsables'],
    queryFn: () => fetchPanierResponsables(panierId),
    staleTime: DEFAULT_STALE_TIME,
  })
