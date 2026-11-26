import { type DernierNiveauConfianceApiModel } from '@pilote/kpilote-shared/niveauConfiance'
import { MAX_INDICATEURS_PAR_REQUETE } from '@pilote/kpilote-shared/valeurAvancement'
import { create, keyResolver, windowedFiniteBatchScheduler } from '@yornaath/batshit'
import { queryOptions } from '@tanstack/react-query'

import { fetchDerniersNiveauxConfiance } from '@/api/niveauConfiance'

import { DEFAULT_STALE_TIME } from './utils'

// Même découpage que les dernières valeurs : un lot porte une seule sélection
// d'individus (ou aucune : chaque indicateur se lit sur son individu racine).
const RACINES = Symbol('racines')
const batchersBySelection = new Map<string | typeof RACINES, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const createBatcher = (individus: ReadonlyArray<string> | undefined) =>
  create({
    fetcher: async (
      indicateurIds: string[],
    ): Promise<ReadonlyArray<DernierNiveauConfianceApiModel>> => {
      const { items } = await fetchDerniersNiveauxConfiance({
        indicateurs: indicateurIds,
        individus,
      })
      return items
    },
    // Indicateur sans niveau publié : l'API omet l'item, la carte reçoit `null`.
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

export const dernierNiveauConfianceKeys = {
  all: ['dernier-niveau-confiance'] as const,
}

export const dernierNiveauConfianceQueryOptions = ({
  individus,
  indicateurId,
}: {
  individus: ReadonlyArray<string> | undefined
  indicateurId: string
}) =>
  queryOptions({
    queryKey: [...dernierNiveauConfianceKeys.all, individus ?? null, indicateurId],
    queryFn: (): Promise<DernierNiveauConfianceApiModel | null> =>
      getBatcher(individus).fetch(indicateurId),
    staleTime: DEFAULT_STALE_TIME,
  })
