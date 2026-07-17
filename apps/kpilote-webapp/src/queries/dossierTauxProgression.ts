import {
  type DossierTauxProgressionSummaryApiModel,
  MAX_DOSSIERS_PAR_REQUETE,
} from '@pilote/kpilote-shared/dossierTauxProgression'
import { create, keyResolver, windowedFiniteBatchScheduler } from '@yornaath/batshit'
import { queryOptions } from '@tanstack/react-query'

import { fetchDossierTauxProgressionForIndividu } from '@/api/dossiers'

import { DEFAULT_STALE_TIME } from './utils'

const batchersByIndividu = new Map<string, Batcher>()

type Batcher = ReturnType<typeof createBatcher>

const createBatcher = (individuId: string) =>
  create({
    fetcher: async (
      dossierIds: string[],
    ): Promise<ReadonlyArray<DossierTauxProgressionSummaryApiModel>> => {
      const { items } = await fetchDossierTauxProgressionForIndividu(individuId, dossierIds)
      return items
    },
    resolver: keyResolver('dossier'),
    scheduler: windowedFiniteBatchScheduler({
      windowMs: 10,
      maxBatchSize: MAX_DOSSIERS_PAR_REQUETE,
    }),
  })

const getBatcher = (individuId: string): Batcher => {
  const existing = batchersByIndividu.get(individuId)
  if (existing) return existing
  const batcher = createBatcher(individuId)
  batchersByIndividu.set(individuId, batcher)
  return batcher
}

export const dossierTauxProgressionIndividuQueryOptions = (individuId: string, dossierId: string) =>
  queryOptions({
    queryKey: ['dossier-taux-progression', individuId, dossierId],
    queryFn: (): Promise<DossierTauxProgressionSummaryApiModel | null> =>
      getBatcher(individuId).fetch(dossierId),
    staleTime: DEFAULT_STALE_TIME,
  })
