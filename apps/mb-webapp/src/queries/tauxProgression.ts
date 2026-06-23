import {
  type TauxProgressionIndividuApiModel,
  MAX_INDICATEURS_PAR_REQUETE,
} from '@pilote/mb-shared/valeurAvancement'
import { create, keyResolver, windowedFiniteBatchScheduler } from '@yornaath/batshit'
import { queryOptions } from '@tanstack/react-query'

import { fetchTauxProgressionForIndividu } from '@/api/individus'

import { DEFAULT_STALE_TIME } from './utils'

const batchersByIndividu = new Map<string, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const createBatcher = (individuId: string) =>
  create({
    fetcher: async (
      indicateurIds: string[],
    ): Promise<ReadonlyArray<TauxProgressionIndividuApiModel>> => {
      const { items } = await fetchTauxProgressionForIndividu(individuId, {
        indicateurs: indicateurIds,
      })
      return items
    },
    resolver: keyResolver('indicateur'),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 10,
      maxBatchSize: MAX_INDICATEURS_PAR_REQUETE,
    }),
  })

const getBatcher = (individuId: string): Batcher => {
  const existing = batchersByIndividu.get(individuId)
  if (existing) return existing
  const batcher = createBatcher(individuId)
  batchersByIndividu.set(individuId, batcher)
  return batcher
}

export const tauxProgressionIndividuQueryOptions = (individuId: string, indicateurId: string) =>
  queryOptions({
    queryKey: ['taux-progression', individuId, indicateurId],
    queryFn: (): Promise<TauxProgressionIndividuApiModel | null> =>
      getBatcher(individuId).fetch(indicateurId),
    staleTime: DEFAULT_STALE_TIME,
  })
