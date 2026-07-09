import { type ListIndicateursQuery } from '@pilote/kpilote-shared/indicateur'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

import {
  fetchIndicateurById,
  fetchIndicateurs,
  fetchIndividusForIndicateur,
  fetchSyntheseIndividus,
  fetchTauxProgressionForIndicateur,
  fetchValeursForIndicateur,
  fetchValeursRemarquablesForIndicateur,
} from '@/api/indicateurs'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const indicateursQueryOptions = (params: ListIndicateursQuery) =>
  queryOptions({
    queryKey: ['indicateurs', params],
    queryFn: () => fetchIndicateurs(params),
    staleTime: DEFAULT_STALE_TIME,
  })

/**
 * Toutes les pages d'indicateurs en une liste, pour un filtrage 100% client
 * (ex: command palette ⌘K). Cache dédié — pattern d'accès distinct des pages
 * liste paginées côté serveur.
 */
export const allIndicateursQueryOptions = () =>
  queryOptions({
    queryKey: ['indicateurs', 'all'],
    queryFn: () => fetchAllPaginatedItems((cursor) => fetchIndicateurs({ cursor, pageSize: 100 })),
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadIndicateurs = ({
  queryClient,
  query,
}: {
  queryClient: QueryClient
  query: ListIndicateursQuery
}) => queryClient.fetchQuery(indicateursQueryOptions(query))

export const indicateurQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['indicateur', id],
    queryFn: () => fetchIndicateurById(id),
    staleTime: DEFAULT_STALE_TIME,
  })

export const loadIndicateur = ({
  queryClient,
  indicateurId,
}: {
  queryClient: QueryClient
  indicateurId: string
}) => queryClient.fetchQuery(indicateurQueryOptions(indicateurId))

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
    queryFn: () =>
      fetchValeursForIndicateur(indicateurId, {
        individus: [individuId],
        dateTrunc: 'month',
      }),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurValeursRemarquablesQueryOptions = (
  indicateurId: string,
  referentielId: string,
) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'valeurs-remarquables', referentielId],
    queryFn: () =>
      fetchValeursRemarquablesForIndicateur(indicateurId, {
        referentiels: [referentielId],
        dateTrunc: 'month',
      }),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurSyntheseIndividuQueryOptions = (indicateurId: string, individuId: string) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'synthese-individus', individuId],
    queryFn: () =>
      fetchSyntheseIndividus(indicateurId, { individus: [individuId], dateTrunc: 'month' }),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurTauxProgressionQueryOptions = (indicateurId: string, individuId: string) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'taux-progression', individuId],
    queryFn: () => fetchTauxProgressionForIndicateur(indicateurId, { individus: [individuId] }),
    staleTime: DEFAULT_STALE_TIME,
  })

export const prefetchIndicateurValeursForIndividu = async ({
  queryClient,
  indicateurId,
  individuId,
  referentielId,
}: {
  queryClient: QueryClient
  indicateurId: string
  individuId: string
  referentielId: string
}): Promise<void> => {
  await Promise.all([
    queryClient.fetchQuery(indicateurValeursQueryOptions(indicateurId, individuId)),
    queryClient.fetchQuery(indicateurValeursRemarquablesQueryOptions(indicateurId, referentielId)),
    queryClient.fetchQuery(indicateurSyntheseIndividuQueryOptions(indicateurId, individuId)),
    queryClient.fetchQuery(indicateurTauxProgressionQueryOptions(indicateurId, individuId)),
  ])
}
