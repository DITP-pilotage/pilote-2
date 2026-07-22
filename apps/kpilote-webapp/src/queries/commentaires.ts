import {
  type BrouillonApiModel,
  type CommentaireApiModel,
} from '@pilote/kpilote-shared/commentaire'
import { type QueryKey, queryOptions } from '@tanstack/react-query'

import {
  fetchBrouillon,
  fetchBrouillonCollection,
  fetchCommentaires,
  fetchCommentairesCollection,
  type IndicateurIndividuCommentaireType,
  type CollectionCommentaireType,
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

// Le 4e générique `QueryKey` (à la place du tuple littéral inféré) est volontaire :
// les query options sont consommées via un Context React polymorphique (cf.
// CommentaireConfigContext), où le queryKey doit rester un type uniforme entre sujets
// (les types tanstack-query sont invariants sur le queryKey).
export const commentairesPubliesQueryOptions = (
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
) =>
  queryOptions<CommentaireApiModel[], Error, CommentaireApiModel[], QueryKey>({
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
  queryOptions<BrouillonApiModel, Error, BrouillonApiModel, QueryKey>({
    queryKey: commentairesKeys.brouillon(indicateurId, individuId, type),
    queryFn: () => fetchBrouillon(indicateurId, individuId, type),
    staleTime: DEFAULT_STALE_TIME,
  })

// --- Collection global -----------------------------------------------------------

export const commentairesCollectionKeys = {
  parType: (collectionId: string, type: CollectionCommentaireType) =>
    ['collection', collectionId, 'commentaires', type] as const,
  publies: (collectionId: string, type: CollectionCommentaireType) =>
    [...commentairesCollectionKeys.parType(collectionId, type), 'publies'] as const,
  brouillon: (collectionId: string, type: CollectionCommentaireType) =>
    [...commentairesCollectionKeys.parType(collectionId, type), 'brouillon'] as const,
}

export const commentairesCollectionPubliesQueryOptions = (
  collectionId: string,
  type: CollectionCommentaireType,
) =>
  queryOptions<CommentaireApiModel[], Error, CommentaireApiModel[], QueryKey>({
    queryKey: commentairesCollectionKeys.publies(collectionId, type),
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchCommentairesCollection(collectionId, { type, ...(cursor ? { cursor } : {}) }),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })

export const brouillonCollectionQueryOptions = (
  collectionId: string,
  type: CollectionCommentaireType,
) =>
  queryOptions<BrouillonApiModel, Error, BrouillonApiModel, QueryKey>({
    queryKey: commentairesCollectionKeys.brouillon(collectionId, type),
    queryFn: () => fetchBrouillonCollection(collectionId, type),
    staleTime: DEFAULT_STALE_TIME,
  })
