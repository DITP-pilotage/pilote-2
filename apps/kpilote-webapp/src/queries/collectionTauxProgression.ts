import {
  type CollectionTauxProgressionSummaryApiModel,
  MAX_COLLECTIONS_PAR_REQUETE,
} from '@pilote/kpilote-shared/collectionTauxProgression'
import { create, keyResolver, windowedFiniteBatchScheduler } from '@yornaath/batshit'
import { queryOptions } from '@tanstack/react-query'

import { fetchCollectionTauxProgressionForIndividu } from '@/api/collections'

import { DEFAULT_STALE_TIME } from './utils'

const batchersByIndividu = new Map<string, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const createBatcher = (individuId: string) =>
  create({
    fetcher: async (
      collectionIds: string[],
    ): Promise<ReadonlyArray<CollectionTauxProgressionSummaryApiModel>> => {
      const { items } = await fetchCollectionTauxProgressionForIndividu(individuId, collectionIds)
      return items
    },
    resolver: keyResolver('collection'),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 10,
      maxBatchSize: MAX_COLLECTIONS_PAR_REQUETE,
    }),
  })

const getBatcher = (individuId: string): Batcher => {
  const existing = batchersByIndividu.get(individuId)
  if (existing) return existing
  const batcher = createBatcher(individuId)
  batchersByIndividu.set(individuId, batcher)
  return batcher
}

export const collectionTauxProgressionIndividuQueryOptions = (
  individuId: string,
  collectionId: string,
) =>
  queryOptions({
    queryKey: ['collection-taux-progression', individuId, collectionId],
    queryFn: (): Promise<CollectionTauxProgressionSummaryApiModel | null> =>
      getBatcher(individuId).fetch(collectionId),
    staleTime: DEFAULT_STALE_TIME,
  })
