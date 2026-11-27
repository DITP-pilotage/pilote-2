import { type DernierTauxProgressionApiModel } from '@pilote/kpilote-shared/valeurAvancement'
import { queryOptions } from '@tanstack/react-query'

import { fetchDerniersTauxProgression } from '@/api/indicateurs'
import { createBatchersBySelection } from '@/lib/batchersBySelection'

import { DEFAULT_STALE_TIME } from './utils'

const getBatcher = createBatchersBySelection<DernierTauxProgressionApiModel>(
  async ({ indicateurs, individus }) =>
    (await fetchDerniersTauxProgression({ indicateurs, individus })).items,
)

export const dernierTauxProgressionKeys = {
  all: ['dernier-taux-progression'] as const,
}

export const dernierTauxProgressionQueryOptions = ({
  individus,
  indicateurId,
}: {
  individus: ReadonlyArray<string> | undefined
  indicateurId: string
}) =>
  queryOptions({
    queryKey: [...dernierTauxProgressionKeys.all, individus ?? null, indicateurId],
    queryFn: (): Promise<DernierTauxProgressionApiModel | null> =>
      getBatcher(individus).fetch(indicateurId),
    staleTime: DEFAULT_STALE_TIME,
  })
