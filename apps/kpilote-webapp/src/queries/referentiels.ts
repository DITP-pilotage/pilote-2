import { type QueryClient, queryOptions, useSuspenseQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  fetchIndividusForReferentiel,
  fetchReferentielById,
  fetchReferentiels,
} from '@/api/referentiels'
import { buildOrderedNodes, type IndividuNode } from '@/lib/individus/hierarchy'
import { referentielsCollection, referentielsTableauDeBord } from '@/lib/individus/tableauDeBord'
import { allIndicateursQueryOptions, loadAllIndicateurs } from '@/queries/indicateurs'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const referentielQueryOptions = (referentielId: string) =>
  queryOptions({
    queryKey: ['referentiel', referentielId],
    queryFn: () => fetchReferentielById(referentielId),
    staleTime: DEFAULT_STALE_TIME,
  })

export const referentielIndividusQueryOptions = (referentielId: string) =>
  queryOptions({
    queryKey: ['referentiel', referentielId, 'individus'],
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchIndividusForReferentiel(referentielId, cursor ? { cursor } : {}),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })

// Scopé à l'utilisateur (`scope=me`) : uniquement les référentiels reliés à un
// indicateur qu'il peut lire, pour ne pas noyer le sélecteur d'individus sous
// l'intégralité du catalogue.
export const allReferentielsQueryOptions = queryOptions({
  queryKey: ['referentiels', 'scope', 'me'],
  queryFn: () =>
    fetchAllPaginatedItems((cursor) =>
      fetchReferentiels({ scope: 'me', ...(cursor ? { cursor } : {}) }),
    ),
  staleTime: DEFAULT_STALE_TIME,
})

export const loadAllReferentielIds = async ({
  queryClient,
}: {
  queryClient: QueryClient
}): Promise<string[]> => {
  const referentiels = await queryClient.fetchQuery(allReferentielsQueryOptions)
  for (const referentiel of referentiels) {
    queryClient.setQueryData(referentielQueryOptions(referentiel.id).queryKey, referentiel)
  }
  return referentiels.map((r) => r.id)
}

export const loadHierarchyFromReferentiels = async ({
  queryClient,
  referentielIds,
}: {
  queryClient: QueryClient
  referentielIds: ReadonlyArray<string>
}): Promise<IndividuNode[]> => {
  const groupes = await Promise.all(
    referentielIds.map(async (refId) => {
      const [referentiel, individus] = await Promise.all([
        queryClient.fetchQuery(referentielQueryOptions(refId)),
        queryClient.fetchQuery(referentielIndividusQueryOptions(refId)),
      ])
      return { referentiel, individus }
    }),
  )
  const referentielsById = new Map(groupes.map((g) => [g.referentiel.id, g.referentiel] as const))
  const allIndividus = groupes.flatMap((g) => [...g.individus])
  return buildOrderedNodes(allIndividus, referentielsById)
}

// Pendant composant de `loadHierarchyFromReferentiels` (données déjà en cache
// via le loader de la route).
export const useHierarchyFromReferentiels = (
  referentielIds: ReadonlyArray<string>,
): IndividuNode[] => {
  const referentiels = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })
  const individusByReferentiel = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielIndividusQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })
  return useMemo(() => {
    const referentielsById = new Map(referentiels.map((r) => [r.id, r] as const))
    return buildOrderedNodes(
      individusByReferentiel.flatMap((batch) => [...batch]),
      referentielsById,
    )
  }, [referentiels, individusByReferentiel])
}

// Référentiels du sélecteur des tableaux de bord (cf. lib/individus/tableauDeBord.ts).
// La liste de tous les indicateurs est aussi chargée par la route `_authenticated`
// (même requête, dédupliquée).
const loadReferentielsEtIndicateurs = async ({ queryClient }: { queryClient: QueryClient }) => {
  const [, indicateurs] = await Promise.all([
    loadAllReferentielIds({ queryClient }),
    loadAllIndicateurs({ queryClient }),
  ])
  const referentiels = await queryClient.fetchQuery(allReferentielsQueryOptions)
  return { referentiels, indicateurs }
}

export const loadReferentielIdsTableauDeBord = async ({
  queryClient,
}: {
  queryClient: QueryClient
}): Promise<string[]> => {
  const { referentiels, indicateurs } = await loadReferentielsEtIndicateurs({ queryClient })
  return referentielsTableauDeBord({ referentiels, indicateurs }).map((r) => r.id)
}

type IndicateursCollection = Parameters<typeof referentielsCollection>[0]['indicateursCollection']

export const loadReferentielIdsCollection = async ({
  queryClient,
  indicateursCollection,
}: {
  queryClient: QueryClient
  indicateursCollection: IndicateursCollection
}): Promise<{ referentielIds: string[]; referentielIdsParDefaut: string[] }> => {
  const { referentiels, indicateurs } = await loadReferentielsEtIndicateurs({ queryClient })
  return {
    referentielIds: referentielsCollection({
      referentiels,
      indicateurs,
      indicateursCollection,
    }).map((r) => r.id),
    referentielIdsParDefaut: referentielsTableauDeBord({ referentiels, indicateurs }).map(
      (r) => r.id,
    ),
  }
}

export const useReferentielIdsTableauDeBord = (): string[] => {
  const [{ data: referentiels }, { data: indicateurs }] = useSuspenseQueries({
    queries: [allReferentielsQueryOptions, allIndicateursQueryOptions()],
  })
  return useMemo(
    () => referentielsTableauDeBord({ referentiels, indicateurs }).map((r) => r.id),
    [referentiels, indicateurs],
  )
}

export const useReferentielIdsCollection = (
  indicateursCollection: IndicateursCollection,
): string[] => {
  const [{ data: referentiels }, { data: indicateurs }] = useSuspenseQueries({
    queries: [allReferentielsQueryOptions, allIndicateursQueryOptions()],
  })
  return useMemo(
    () =>
      referentielsCollection({ referentiels, indicateurs, indicateursCollection }).map((r) => r.id),
    [referentiels, indicateurs, indicateursCollection],
  )
}
