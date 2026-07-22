import { type ListCollectionsQuery } from '@pilote/kpilote-shared/collection'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

import {
  fetchCollectionById,
  fetchCollections,
  fetchCollectionTauxProgression,
} from '@/api/collections'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const collectionsQueryOptions = (params: ListCollectionsQuery) =>
  queryOptions({
    queryKey: ['collections', params],
    queryFn: () => fetchCollections(params),
    staleTime: DEFAULT_STALE_TIME,
  })

/**
 * Tous les collections en une liste, pour un filtrage 100% client
 * (ex: command palette ⌘K). Cache dédié — pattern d'accès distinct des pages
 * liste paginées côté serveur.
 */
export const allCollectionsQueryOptions = () =>
  queryOptions({
    queryKey: ['collections', 'all'],
    queryFn: () => fetchAllPaginatedItems((cursor) => fetchCollections({ cursor, pageSize: 100 })),
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadCollections = ({
  queryClient,
  query,
}: {
  queryClient: QueryClient
  query: ListCollectionsQuery
}) => queryClient.fetchQuery(collectionsQueryOptions(query))

export const collectionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['collection', id],
    queryFn: () => fetchCollectionById(id),
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadCollection = ({
  queryClient,
  collectionId,
}: {
  queryClient: QueryClient
  collectionId: string
}) => queryClient.fetchQuery(collectionQueryOptions(collectionId))

export const collectionTauxProgressionQueryOptions = ({
  collectionId,
  individu,
}: {
  collectionId: string
  individu: string
}) =>
  queryOptions({
    queryKey: ['collection', collectionId, 'taux-progression', individu],
    queryFn: () => fetchCollectionTauxProgression({ collectionId, individu }),
    staleTime: DEFAULT_STALE_TIME,
  })
