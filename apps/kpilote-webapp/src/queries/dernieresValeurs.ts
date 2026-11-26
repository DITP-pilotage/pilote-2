import {
  type DerniereValeurApiModel,
  MAX_INDICATEURS_PAR_REQUETE,
} from '@pilote/kpilote-shared/valeurAvancement'
import { create, keyResolver, windowedFiniteBatchScheduler } from '@yornaath/batshit'
import { queryOptions } from '@tanstack/react-query'

import { fetchDernieresValeurs } from '@/api/indicateurs'

import { DEFAULT_STALE_TIME } from './utils'

// Un lot porte une seule sélection d'individus (ou aucune : chaque indicateur se
// lit alors sur ses individus racines). On instancie donc un batcher par sélection.
const RACINES = Symbol('racines')
const batchersBySelection = new Map<string | typeof RACINES, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const createBatcher = (individus: ReadonlyArray<string> | undefined) =>
  create({
    fetcher: async (indicateurIds: string[]): Promise<ReadonlyArray<DerniereValeurApiModel>> => {
      const { items } = await fetchDernieresValeurs({ indicateurs: indicateurIds, individus })
      return items
    },
    // Indicateur sans valeur connue : l'API omet l'item. `keyResolver` renvoie
    // alors `null` au consommateur, ce qui permet à la card d'afficher un
    // placeholder.
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

export const derniereValeurQueryOptions = ({
  individus,
  indicateurId,
}: {
  individus: ReadonlyArray<string> | undefined
  indicateurId: string
}) =>
  queryOptions({
    queryKey: ['derniere-valeur', individus ?? null, indicateurId],
    queryFn: (): Promise<DerniereValeurApiModel | null> =>
      getBatcher(individus).fetch(indicateurId),
    staleTime: DEFAULT_STALE_TIME,
  })
