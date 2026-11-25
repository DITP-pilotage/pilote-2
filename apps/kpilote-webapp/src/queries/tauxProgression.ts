import {
  type DernierTauxProgressionApiModel,
  MAX_INDICATEURS_PAR_REQUETE,
} from '@pilote/kpilote-shared/valeurAvancement'
import { create, keyResolver, windowedFiniteBatchScheduler } from '@yornaath/batshit'
import { queryOptions } from '@tanstack/react-query'

import { fetchDerniersTauxProgression } from '@/api/indicateurs'

import { DEFAULT_STALE_TIME } from './utils'

// Un lot porte une seule sélection d'individus (ou aucune : chaque indicateur se
// lit alors sur ses individus racines). On instancie donc un batcher par sélection.
const RACINES = Symbol('racines')
const batchersBySelection = new Map<string | typeof RACINES, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const createBatcher = (individus: ReadonlyArray<string> | undefined) =>
  create({
    fetcher: async (
      indicateurIds: string[],
    ): Promise<ReadonlyArray<DernierTauxProgressionApiModel>> => {
      const { items } = await fetchDerniersTauxProgression({
        indicateurs: indicateurIds,
        individus,
      })
      return items
    },
    resolver: keyResolver('indicateur'),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 10,
      maxBatchSize: MAX_INDICATEURS_PAR_REQUETE,
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

export const dernierTauxProgressionQueryOptions = ({
  individus,
  indicateurId,
}: {
  individus: ReadonlyArray<string> | undefined
  indicateurId: string
}) =>
  queryOptions({
    queryKey: ['dernier-taux-progression', individus ?? null, indicateurId],
    queryFn: (): Promise<DernierTauxProgressionApiModel | null> =>
      getBatcher(individus).fetch(indicateurId),
    staleTime: DEFAULT_STALE_TIME,
  })
