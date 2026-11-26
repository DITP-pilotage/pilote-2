import { type DerniereValeurApiModel } from '@pilote/kpilote-shared/valeurAvancement'
import { queryOptions } from '@tanstack/react-query'

import { fetchDernieresValeurs } from '@/api/indicateurs'
import { createBatchersBySelection } from '@/lib/batchersBySelection'

import { DEFAULT_STALE_TIME } from './utils'

const getBatcher = createBatchersBySelection<DerniereValeurApiModel>(
  async ({ indicateurs, individus }) =>
    (await fetchDernieresValeurs({ indicateurs, individus })).items,
)

export const derniereValeurKeys = {
  all: ['derniere-valeur'] as const,
}

export const derniereValeurQueryOptions = ({
  individus,
  indicateurId,
}: {
  individus: ReadonlyArray<string> | undefined
  indicateurId: string
}) =>
  queryOptions({
    queryKey: [...derniereValeurKeys.all, individus ?? null, indicateurId],
    queryFn: (): Promise<DerniereValeurApiModel | null> =>
      getBatcher(individus).fetch(indicateurId),
    staleTime: DEFAULT_STALE_TIME,
  })
