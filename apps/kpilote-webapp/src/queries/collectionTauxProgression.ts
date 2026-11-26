import {
  type CollectionTauxProgressionSummaryApiModel,
  MAX_COLLECTIONS_PAR_REQUETE,
} from '@pilote/kpilote-shared/collectionTauxProgression'
import { create, keyResolver, windowedFiniteBatchScheduler } from '@yornaath/batshit'
import { queryOptions } from '@tanstack/react-query'

import { fetchCollectionsTauxProgression } from '@/api/collections'

import { DEFAULT_STALE_TIME } from './utils'

// Un lot porte une seule sélection d'individus (ou aucune : chaque indicateur de la collection se
// lit alors sur ses individus racines). On instancie donc un batcher par sélection.
const RACINES = Symbol('racines')
const batchersBySelection = new Map<string | typeof RACINES, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const createBatcher = (individus: ReadonlyArray<string> | undefined) =>
  create({
    fetcher: async (
      collectionIds: string[],
    ): Promise<ReadonlyArray<CollectionTauxProgressionSummaryApiModel>> => {
      const { items } = await fetchCollectionsTauxProgression({
        collections: collectionIds,
        individus,
      })
      return items
    },
    resolver: keyResolver('collection'),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 10,
      maxBatchSize: MAX_COLLECTIONS_PAR_REQUETE,
    }),
  })

const getBatcher = (individus: ReadonlyArray<string> | undefined): Batcher => {
  const key = individus?.join(',') ?? RACINES
  const existing = batchersBySelection.get(key)
  if (existing) return existing
  const batcher = createBatcher(individus)
  batchersBySelection.set(key, batcher)
  return batcher
}

export const collectionTauxProgressionQueryOptions = ({
  individus,
  collectionId,
}: {
  individus: ReadonlyArray<string> | undefined
  collectionId: string
}) =>
  queryOptions({
    queryKey: ['collection-taux-progression', individus ?? null, collectionId],
    queryFn: (): Promise<CollectionTauxProgressionSummaryApiModel | null> =>
      getBatcher(individus).fetch(collectionId),
    staleTime: DEFAULT_STALE_TIME,
  })
