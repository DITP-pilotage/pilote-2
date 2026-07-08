import { type ListDossiersQuery } from '@pilote/kpilote-shared/dossier'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

import { fetchDossierById, fetchDossiers, fetchDossierTauxProgression } from '@/api/dossiers'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const dossiersQueryOptions = (params: ListDossiersQuery) =>
  queryOptions({
    queryKey: ['dossiers', params],
    queryFn: () => fetchDossiers(params),
    staleTime: DEFAULT_STALE_TIME,
  })

/**
 * Tous les dossiers en une liste, pour un filtrage 100% client
 * (ex: command palette ⌘K). Cache dédié — pattern d'accès distinct des pages
 * liste paginées côté serveur.
 */
export const allDossiersQueryOptions = () =>
  queryOptions({
    queryKey: ['dossiers', 'all'],
    queryFn: () => fetchAllPaginatedItems((cursor) => fetchDossiers({ cursor, pageSize: 100 })),
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadDossiers = ({
  queryClient,
  query,
}: {
  queryClient: QueryClient
  query: ListDossiersQuery
}) => queryClient.fetchQuery(dossiersQueryOptions(query))

export const dossierQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['dossier', id],
    queryFn: () => fetchDossierById(id),
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadDossier = ({
  queryClient,
  dossierId,
}: {
  queryClient: QueryClient
  dossierId: string
}) => queryClient.fetchQuery(dossierQueryOptions(dossierId))

export const dossierTauxProgressionQueryOptions = ({
  dossierId,
  individu,
}: {
  dossierId: string
  individu: string
}) =>
  queryOptions({
    queryKey: ['dossier', dossierId, 'taux-progression', individu],
    queryFn: () => fetchDossierTauxProgression({ dossierId, individu }),
    staleTime: DEFAULT_STALE_TIME,
  })
