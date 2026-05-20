import { type ListIndicateursQuery } from '@pilote/mb-shared/indicateur'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

import {
  fetchIndicateurById,
  fetchIndicateurs,
  fetchIndividusForIndicateur,
  fetchSyntheseIndividus,
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

export const indicateurValeursRemarquablesQueryOptions = (
  indicateurId: string,
  referentielId: string,
) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'valeurs-remarquables', referentielId],
    queryFn: () =>
      fetchValeursRemarquablesForIndicateur(indicateurId, { referentiels: [referentielId] }),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurSyntheseIndividuQueryOptions = (indicateurId: string, individuId: string) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'synthese-individus', individuId],
    queryFn: () => fetchSyntheseIndividus(indicateurId, { individus: [individuId] }),
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
  ])
}
