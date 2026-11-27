import { type ListIndicateursQuery } from '@pilote/kpilote-shared/indicateur'
import { MAX_PAGE_SIZE } from '@pilote/kpilote-shared/pagination'
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

// Clé partielle de toutes les listes d'épinglés, quelle que soit la sélection.
export const indicateursEpinglesKey = ['indicateurs', { epingle: true }] as const

// Les épinglés tiennent sur une page : l'API borne leur nombre à l'ajout. On
// demande la page la plus grande plutôt que cette borne : un épinglé au-delà
// (accès retrouvé, ajouts simultanés) reste affiché et désépinglable. Comme
// « Mes indicateurs », la section ne garde que les indicateurs attribués : un
// épinglé dont l'attribution est retirée en sort. La sélection place les
// épinglés qu'elle concerne en tête, comme dans la liste.
export const indicateursEpinglesQueryOptions = ({
  individus,
}: {
  individus: ReadonlyArray<string>
}) =>
  indicateursQueryOptions({
    epingle: true,
    acces: 'attribue',
    pageSize: MAX_PAGE_SIZE,
    ...(individus.length > 0 ? { individus: [...individus] } : {}),
  })

export const loadIndicateursEpingles = ({
  queryClient,
  individus,
}: {
  queryClient: QueryClient
  individus: ReadonlyArray<string>
}) => queryClient.fetchQuery(indicateursEpinglesQueryOptions({ individus }))

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

export const loadAllIndicateurs = ({ queryClient }: { queryClient: QueryClient }) =>
  queryClient.ensureQueryData(allIndicateursQueryOptions())

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

// Sans modalité, la clé reste celle d'un indicateur sans axe : même cache, mêmes requêtes.
const modalitesKey = (modalites: ReadonlyArray<string>) =>
  modalites.length > 0 ? [{ modalites }] : []

export const indicateurValeursQueryOptions = (
  indicateurId: string,
  individuId: string,
  modalites: ReadonlyArray<string> = [],
) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'valeurs', individuId, ...modalitesKey(modalites)],
    queryFn: () =>
      fetchValeursForIndicateur(indicateurId, {
        individus: [individuId],
        dateTrunc: 'month',
        modalites: [...modalites],
      }),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurValeursRemarquablesQueryOptions = (
  indicateurId: string,
  referentielId: string,
  modalites: ReadonlyArray<string> = [],
) =>
  queryOptions({
    queryKey: [
      'indicateur',
      indicateurId,
      'valeurs-remarquables',
      referentielId,
      ...modalitesKey(modalites),
    ],
    queryFn: () =>
      fetchValeursRemarquablesForIndicateur(indicateurId, {
        referentiels: [referentielId],
        dateTrunc: 'month',
        modalites: [...modalites],
      }),
    staleTime: DEFAULT_STALE_TIME,
  })

export const indicateurSyntheseIndividuQueryOptions = (
  indicateurId: string,
  individuId: string,
  modalites: ReadonlyArray<string> = [],
) =>
  queryOptions({
    queryKey: [
      'indicateur',
      indicateurId,
      'synthese-individus',
      individuId,
      ...modalitesKey(modalites),
    ],
    queryFn: () =>
      fetchSyntheseIndividus(indicateurId, {
        individus: [individuId],
        dateTrunc: 'month',
        modalites: [...modalites],
      }),
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
  modalites = [],
}: {
  queryClient: QueryClient
  indicateurId: string
  individuId: string
  referentielId: string
  modalites?: ReadonlyArray<string>
}): Promise<void> => {
  await Promise.all([
    queryClient.fetchQuery(indicateurValeursQueryOptions(indicateurId, individuId, modalites)),
    queryClient.fetchQuery(
      indicateurValeursRemarquablesQueryOptions(indicateurId, referentielId, modalites),
    ),
    queryClient.fetchQuery(
      indicateurSyntheseIndividuQueryOptions(indicateurId, individuId, modalites),
    ),
    queryClient.fetchQuery(indicateurTauxProgressionQueryOptions(indicateurId, individuId)),
  ])
}
