import { type DernierNiveauConfianceApiModel } from '@pilote/kpilote-shared/niveauConfiance'
import { type QueryKey, queryOptions } from '@tanstack/react-query'

import { fetchDerniersNiveauxConfiance } from '@/api/niveauConfiance'
import { createBatchersBySelection } from '@/lib/batchersBySelection'

import { DEFAULT_STALE_TIME } from './utils'

const getBatcher = createBatchersBySelection<DernierNiveauConfianceApiModel>(
  async ({ indicateurs, individus }) =>
    (await fetchDerniersNiveauxConfiance({ indicateurs, individus })).items,
)

export const dernierNiveauConfianceKeys = {
  all: ['dernier-niveau-confiance'] as const,
}

// Clé : [...all, individus, indicateurId].
export const isDernierNiveauConfianceQueryFor = (
  queryKey: QueryKey,
  indicateurId: string,
): boolean => queryKey[2] === indicateurId

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
