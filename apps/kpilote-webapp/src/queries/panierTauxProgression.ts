import {
  type PanierTauxProgressionSummaryApiModel,
  MAX_PANIERS_PAR_REQUETE,
} from '@pilote/kpilote-shared/panierTauxProgression'
import { create, keyResolver, windowedFiniteBatchScheduler } from '@yornaath/batshit'
import { queryOptions } from '@tanstack/react-query'

import { fetchPanierTauxProgressionForIndividu } from '@/api/paniers'

import { DEFAULT_STALE_TIME } from './utils'

const batchersByIndividu = new Map<string, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const createBatcher = (individuId: string) =>
  create({
    fetcher: async (
      panierIds: string[],
    ): Promise<ReadonlyArray<PanierTauxProgressionSummaryApiModel>> => {
      const { items } = await fetchPanierTauxProgressionForIndividu(individuId, panierIds)
      return items
    },
    resolver: keyResolver('panier'),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 10,
      maxBatchSize: MAX_PANIERS_PAR_REQUETE,
    }),
  })

const getBatcher = (individuId: string): Batcher => {
  const existing = batchersByIndividu.get(individuId)
  if (existing) return existing
  const batcher = createBatcher(individuId)
  batchersByIndividu.set(individuId, batcher)
  return batcher
}

export const panierTauxProgressionIndividuQueryOptions = (individuId: string, panierId: string) =>
  queryOptions({
    queryKey: ['panier-taux-progression', individuId, panierId],
    queryFn: (): Promise<PanierTauxProgressionSummaryApiModel | null> =>
      getBatcher(individuId).fetch(panierId),
    staleTime: DEFAULT_STALE_TIME,
  })
