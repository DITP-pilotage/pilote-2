import { type QueryClient, queryOptions, useSuspenseQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  fetchIndividusForReferentiel,
  fetchReferentielById,
  fetchReferentiels,
} from '@/api/referentiels'
import {
  buildOrderedNodes,
  groupNodesByRootReferentiel,
  type IndividuNode,
  type ReferentielGroup,
} from '@/lib/individus/hierarchy'

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

// Hiérarchie des individus des référentiels donnés, et ses stacks (un par
// référentiel racine). Mêmes requêtes que loadHierarchyFromReferentiels.
export const useIndividuHierarchy = (
  referentielIds: ReadonlyArray<string>,
): { nodes: IndividuNode[]; groups: ReferentielGroup[] } => {
  const referentiels = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielQueryOptions(refId)),
    combine: (results) => results.map((result) => result.data),
  })
  const individusByReferentiel = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielIndividusQueryOptions(refId)),
    combine: (results) => results.map((result) => result.data),
  })
  return useMemo(() => {
    const referentielsById = new Map(referentiels.map((r) => [r.id, r] as const))
    const nodes = buildOrderedNodes(individusByReferentiel.flat(), referentielsById)
    return { nodes, groups: groupNodesByRootReferentiel(nodes) }
  }, [referentiels, individusByReferentiel])
}
