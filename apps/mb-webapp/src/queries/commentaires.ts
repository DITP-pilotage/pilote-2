import { type CommentaireStatut } from '@pilote/mb-shared/commentaire'
import { queryOptions } from '@tanstack/react-query'

import { fetchCommentaires, type IndicateurIndividuCommentaireType } from '@/api/commentaires'

import { DEFAULT_STALE_TIME, fetchAllPaginatedItems } from './utils'

export const commentairesKeys = {
  // Préfixe (tous statuts confondus) : sert à invalider les deux listes d'un coup.
  parType: (indicateurId: string, individuId: string, type: IndicateurIndividuCommentaireType) =>
    ['indicateur', indicateurId, 'individu', individuId, 'commentaires', type] as const,
  liste: (
    indicateurId: string,
    individuId: string,
    type: IndicateurIndividuCommentaireType,
    statut: CommentaireStatut,
  ) => [...commentairesKeys.parType(indicateurId, individuId, type), statut] as const,
}

export const commentairesQueryOptions = (
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
  statut: CommentaireStatut,
) =>
  queryOptions({
    queryKey: commentairesKeys.liste(indicateurId, individuId, type, statut),
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchCommentaires(indicateurId, individuId, {
          type,
          statut,
          ...(cursor ? { cursor } : {}),
        }),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })
