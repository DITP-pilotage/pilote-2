import { type ModaliteApiModel } from '@pilote/kpilote-shared/axe'
import {
  type QueryClient,
  queryOptions,
  useSuspenseQueries,
  type UseSuspenseQueryResult,
} from '@tanstack/react-query'
import { useMemo } from 'react'

import { fetchModalitesForAxe } from '@/api/axes'
import { type AxeWithModalites } from '@/lib/axes/selection'

import { DEFAULT_STALE_TIME } from './utils'

export const axeModalitesQueryOptions = (axeId: string) =>
  queryOptions({
    queryKey: ['axe', axeId, 'modalites'],
    queryFn: async () => (await fetchModalitesForAxe(axeId)).items,
    staleTime: DEFAULT_STALE_TIME,
  })

type DeclaredAxe = { id: string; nom: string }

export const loadAxesWithModalites = ({
  queryClient,
  axes,
}: {
  queryClient: QueryClient
  axes: ReadonlyArray<DeclaredAxe>
}): Promise<AxeWithModalites[]> =>
  Promise.all(
    axes.map(async (axe) => ({
      id: axe.id,
      nom: axe.nom,
      modalites: await queryClient.ensureQueryData(axeModalitesQueryOptions(axe.id)),
    })),
  )

// Hors du hook : un `combine` stable laisse useSuspenseQueries mémoriser son résultat, et les
// dérivations des appelants (arbres, séries) ne se recalculent pas à chaque rendu.
const dataOf = (results: ReadonlyArray<UseSuspenseQueryResult<ModaliteApiModel[]>>) =>
  results.map((result) => result.data)

export const useAxesWithModalites = (
  axes: ReadonlyArray<DeclaredAxe>,
): ReadonlyArray<AxeWithModalites> => {
  const modalitesByAxe = useSuspenseQueries({
    queries: axes.map((axe) => axeModalitesQueryOptions(axe.id)),
    combine: dataOf,
  })
  return useMemo(
    () =>
      axes.map((axe, index) => ({
        id: axe.id,
        nom: axe.nom,
        modalites: modalitesByAxe[index] ?? [],
      })),
    [axes, modalitesByAxe],
  )
}
