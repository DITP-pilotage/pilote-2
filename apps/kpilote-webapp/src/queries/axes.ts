import { type QueryClient, queryOptions, useSuspenseQueries } from '@tanstack/react-query'

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

export const useAxesWithModalites = (
  axes: ReadonlyArray<DeclaredAxe>,
): ReadonlyArray<AxeWithModalites> =>
  useSuspenseQueries({
    queries: axes.map((axe) => axeModalitesQueryOptions(axe.id)),
    combine: (results) =>
      axes.map((axe, index) => ({
        id: axe.id,
        nom: axe.nom,
        modalites: results[index]?.data ?? [],
      })),
  })
