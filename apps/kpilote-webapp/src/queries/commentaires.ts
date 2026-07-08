import {
  type BrouillonApiModel,
  type CommentaireApiModel,
} from '@pilote/kpilote-shared/commentaire'
import { type QueryKey, queryOptions } from '@tanstack/react-query'

import {
  fetchBrouillon,
  fetchBrouillonDossier,
  fetchCommentaires,
  fetchCommentairesDossier,
  type IndicateurIndividuCommentaireType,
  type DossierCommentaireType,
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

// --- Dossier global -----------------------------------------------------------

export const commentairesDossierKeys = {
  parType: (dossierId: string, type: DossierCommentaireType) =>
    ['dossier', dossierId, 'commentaires', type] as const,
  publies: (dossierId: string, type: DossierCommentaireType) =>
    [...commentairesDossierKeys.parType(dossierId, type), 'publies'] as const,
  brouillon: (dossierId: string, type: DossierCommentaireType) =>
    [...commentairesDossierKeys.parType(dossierId, type), 'brouillon'] as const,
}

export const commentairesDossierPubliesQueryOptions = (
  dossierId: string,
  type: DossierCommentaireType,
) =>
  queryOptions<CommentaireApiModel[], Error, CommentaireApiModel[], QueryKey>({
    queryKey: commentairesDossierKeys.publies(dossierId, type),
    queryFn: () =>
      fetchAllPaginatedItems((cursor) =>
        fetchCommentairesDossier(dossierId, { type, ...(cursor ? { cursor } : {}) }),
      ),
    staleTime: DEFAULT_STALE_TIME,
  })

export const brouillonDossierQueryOptions = (dossierId: string, type: DossierCommentaireType) =>
  queryOptions<BrouillonApiModel, Error, BrouillonApiModel, QueryKey>({
    queryKey: commentairesDossierKeys.brouillon(dossierId, type),
    queryFn: () => fetchBrouillonDossier(dossierId, type),
    staleTime: DEFAULT_STALE_TIME,
  })
