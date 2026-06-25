import { queryOptions } from '@tanstack/react-query'

import { fetchCommentaires, type IndicateurIndividuCommentaireType } from '@/api/commentaires'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const commentairesKeys = {
  liste: (indicateurId: string, individuId: string, type: IndicateurIndividuCommentaireType) =>
    ['indicateur', indicateurId, 'individu', individuId, 'commentaires', type] as const,
}

export const commentairesQueryOptions = (
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
) =>
  queryOptions({
    queryKey: commentairesKeys.liste(indicateurId, individuId, type),
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchCommentaires(indicateurId, individuId, { type, ...(cursor ? { cursor } : {}) }),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })
