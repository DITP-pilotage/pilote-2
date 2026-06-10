import {
  type DernierValeurIndividuApiModel,
  MAX_INDICATEURS_PAR_REQUETE,
} from '@pilote/mb-shared/valeurAvancement'
import { create, keyResolver, windowedFiniteBatchScheduler } from '@yornaath/batshit'
import { queryOptions } from '@tanstack/react-query'

import { fetchDernieresValeursForIndividu } from '@/api/individus'

import { DEFAULT_STALE_TIME } from './utils'

// L'endpoint /individus/{id}/dernieres-valeurs est paramétré par individu.
// On instancie un batcher par individuId pour ne pas mélanger les requêtes
// de plusieurs individus actifs simultanément (rare en pratique : un seul
// individu observé est sélectionné à la fois).
const batchersByIndividu = new Map<string, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const createBatcher = (individuId: string) =>
  create({
    fetcher: async (
      indicateurIds: string[],
    ): Promise<ReadonlyArray<DernierValeurIndividuApiModel>> => {
      const { items } = await fetchDernieresValeursForIndividu(individuId, {
        indicateurs: indicateurIds,
      })
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

const getBatcher = (individuId: string): Batcher => {
  const existing = batchersByIndividu.get(individuId)
  if (existing) return existing
  const batcher = createBatcher(individuId)
  batchersByIndividu.set(individuId, batcher)
  return batcher
}

export const dernierValeurIndividuQueryOptions = (individuId: string, indicateurId: string) =>
  queryOptions({
    queryKey: ['dernier-valeur', individuId, indicateurId],
    queryFn: (): Promise<DernierValeurIndividuApiModel | null> =>
      getBatcher(individuId).fetch(indicateurId),
    staleTime: DEFAULT_STALE_TIME,
  })
