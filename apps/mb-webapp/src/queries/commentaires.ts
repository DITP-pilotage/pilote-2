import { queryOptions } from '@tanstack/react-query'

import {
  fetchBrouillon,
  fetchCommentaires,
  type IndicateurIndividuCommentaireType,
} from '@/api/commentaires'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const commentairesKeys = {
  // Préfixe (publiés + brouillon) : sert à tout invalider d'un coup.
  parType: (indicateurId: string, individuId: string, type: IndicateurIndividuCommentaireType) =>
    ['indicateur', indicateurId, 'individu', individuId, 'commentaires', type] as const,
  publies: (indicateurId: string, individuId: string, type: IndicateurIndividuCommentaireType) =>
    [...commentairesKeys.parType(indicateurId, individuId, type), 'publies'] as const,
  brouillon: (indicateurId: string, individuId: string, type: IndicateurIndividuCommentaireType) =>
    [...commentairesKeys.parType(indicateurId, individuId, type), 'brouillon'] as const,
}

export const commentairesPubliesQueryOptions = (
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
) =>
  queryOptions({
    queryKey: commentairesKeys.publies(indicateurId, individuId, type),
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchCommentaires(indicateurId, individuId, { type, ...(cursor ? { cursor } : {}) }),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })

export const brouillonQueryOptions = (
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
) =>
  queryOptions({
    queryKey: commentairesKeys.brouillon(indicateurId, individuId, type),
    queryFn: () => fetchBrouillon(indicateurId, individuId, type),
    staleTime: DEFAULT_STALE_TIME,
  })
