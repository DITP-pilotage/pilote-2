import { type IndividuApiModel } from '@pilote/mb-shared/individu'
import { type ReferentielApiModel } from '@pilote/mb-shared/referentiel'
import { type QueryClient, queryOptions } from '@tanstack/react-query'

import { fetchIndividusForReferentiel, fetchReferentielById } from '@/api/referentiels'

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

type ReferentielGroupe = {
  referentiel: ReferentielApiModel
  individus: ReadonlyArray<IndividuApiModel>
}

const flattenAndSort = (groupes: ReadonlyArray<ReferentielGroupe>): IndividuApiModel[] =>
  groupes
    .flatMap((groupe) => [...groupe.individus])
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

export const loadIndividusFromReferentiels = async ({
  queryClient,
  referentielIds,
}: {
  queryClient: QueryClient
  referentielIds: ReadonlyArray<string>
}): Promise<IndividuApiModel[]> => {
  const groupes = await Promise.all(
    referentielIds.map(async (refId) => {
      const [referentiel, individus] = await Promise.all([
        queryClient.fetchQuery(referentielQueryOptions(refId)),
        queryClient.fetchQuery(referentielIndividusQueryOptions(refId)),
      ])
      return { referentiel, individus }
    }),
  )
  return flattenAndSort(groupes)
}
