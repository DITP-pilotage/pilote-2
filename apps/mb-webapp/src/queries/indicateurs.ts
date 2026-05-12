import { type IndividuApiModel } from '@pilote/mb-shared/individu'
import { queryOptions } from '@tanstack/react-query'

import {
  fetchIndicateurById,
  fetchIndicateurs,
  fetchIndividusForIndicateur,
  fetchIndividusForReferentiel,
  fetchValeursForIndicateur,
  fetchValeursRemarquablesForIndicateur,
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

const fetchAuthorizedIndividusForIndicateur = async (
  referentielIds: ReadonlyArray<string>,
): Promise<IndividuApiModel[]> => {
  const lists = await Promise.all(
    referentielIds.map((refId) =>
      fetchAllPaginatedItems((cursor) =>
        fetchIndividusForReferentiel(refId, cursor ? { cursor } : {}),
      ),
    ),
  )
  const dedup = new Map<string, IndividuApiModel>()
  for (const list of lists) for (const ind of list) if (!dedup.has(ind.id)) dedup.set(ind.id, ind)
  return [...dedup.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export const indicateurAuthorizedIndividusQueryOptions = (
  indicateurId: string,
  referentielIds: ReadonlyArray<string>,
) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'individus-autorises', [...referentielIds].sort()],
    queryFn: () => fetchAuthorizedIndividusForIndicateur(referentielIds),
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
  individuId: string,
) =>
  queryOptions({
    queryKey: ['indicateur', indicateurId, 'valeurs-remarquables', individuId],
    queryFn: () => fetchValeursRemarquablesForIndicateur(indicateurId, { individus: [individuId] }),
    staleTime: DEFAULT_STALE_TIME,
  })
