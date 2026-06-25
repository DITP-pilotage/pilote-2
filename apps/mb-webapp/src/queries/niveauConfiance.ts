import { queryOptions } from '@tanstack/react-query'

import { fetchHistoriqueNiveauConfiance } from '@/api/niveauConfiance'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const niveauConfianceKeys = {
  historique: (indicateurId: string, individuId: string) =>
    ['indicateur', indicateurId, 'individu', individuId, 'niveau-confiance', 'historique'] as const,
}

export const niveauConfianceHistoriqueQueryOptions = (indicateurId: string, individuId: string) =>
  queryOptions({
    queryKey: niveauConfianceKeys.historique(indicateurId, individuId),
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchHistoriqueNiveauConfiance(indicateurId, individuId, cursor ? { cursor } : {}),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })
