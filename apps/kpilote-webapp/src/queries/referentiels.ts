import { type QueryClient, queryOptions } from '@tanstack/react-query'

import {
  fetchIndividusForReferentiel,
  fetchReferentielById,
  fetchReferentiels,
} from '@/api/referentiels'
import { buildOrderedNodes, type IndividuNode } from '@/lib/individus/hierarchy'

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

export const allReferentielsQueryOptions = queryOptions({
  queryKey: ['referentiels', 'all'],
  queryFn: () => fetchAllPaginatedItems((cursor) => fetchReferentiels(cursor ? { cursor } : {})),
  staleTime: DEFAULT_STALE_TIME,
})

// Référentiels pertinents pour la page selon le scope (`me` = indicateurs
// lisibles par l'utilisateur, `panier:<publicId>` = indicateurs du panier).
export const pertinentReferentielsQueryOptions = (scope: string) =>
  queryOptions({
    queryKey: ['referentiels', 'pertinents', scope],
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchReferentiels({ scope, ...(cursor ? { cursor } : {}) }),
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
