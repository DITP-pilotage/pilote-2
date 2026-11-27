import { MAX_INDICATEURS_PAR_REQUETE } from '@pilote/kpilote-shared/valeurAvancement'
import { type Batcher, create, windowedFiniteBatchScheduler } from '@yornaath/batshit'

type Selection = ReadonlyArray<string> | undefined

type FetchItems<T> = (params: {
  indicateurs: string[]
  individus: Selection
}) => Promise<ReadonlyArray<T>>

const RACINES = Symbol('racines')

// Lectures par lot des cartes indicateur : un lot porte une seule sélection
// d'individus (ou aucune, chaque indicateur se lit alors sur son individu
// racine), donc un batcher par sélection. Un indicateur absent de la réponse
// est résolu à `null`.
export const createBatchersBySelection = <T extends { indicateur: string }>(
  fetchItems: FetchItems<T>,
): ((individus: Selection) => Batcher<ReadonlyArray<T>, string, T | null>) => {
  const batchersBySelection = new Map<
    string | typeof RACINES,
    Batcher<ReadonlyArray<T>, string, T | null>
  >()
  return (individus) => {
    const key = individus?.join(',') ?? RACINES
    const existing = batchersBySelection.get(key)
    if (existing) return existing
    const batcher = create<ReadonlyArray<T>, string, T | null>({
      fetcher: (indicateurs) => fetchItems({ indicateurs, individus }),
      resolver: (items, indicateur) => items.find((item) => item.indicateur === indicateur) ?? null,
      scheduler: windowedFiniteBatchScheduler({
        windowMs: 10,
        maxBatchSize: MAX_INDICATEURS_PAR_REQUETE,
      }),
    })
    batchersBySelection.set(key, batcher)
    return batcher
  }
}
