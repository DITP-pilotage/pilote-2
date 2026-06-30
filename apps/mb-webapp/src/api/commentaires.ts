import {
  type BrouillonApiModel,
  brouillonApiModelSchema,
  type CommentaireApiModel,
  commentaireApiModelSchema,
  type CommentaireListApiModel,
  commentaireListApiModelSchema,
  type CreerCommentaireBody,
  indicateurIndividuCommentaireTypeSchema,
  type ListerCommentairesQuery,
  type ModifierCommentaireBody,
  panierCommentaireTypeSchema,
} from '@pilote/mb-shared/commentaire'
import { z } from 'zod'

import { apiClient } from '@/api/client'

export type IndicateurIndividuCommentaireType = z.infer<
  typeof indicateurIndividuCommentaireTypeSchema
>

export type PanierCommentaireType = z.infer<typeof panierCommentaireTypeSchema>

export const fetchCommentaires = async (
  indicateurId: string,
  individuId: string,
  query: ListerCommentairesQuery,
): Promise<CommentaireListApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/individus/${individuId}/commentaires`, {
      searchParams: query,
    })
    .json()
  return commentaireListApiModelSchema.parse(json)
}

export const fetchBrouillon = async (
  indicateurId: string,
  individuId: string,
  type: IndicateurIndividuCommentaireType,
): Promise<BrouillonApiModel> => {
  const json = await apiClient
    .get(`indicateurs/${indicateurId}/individus/${individuId}/commentaires/brouillon`, {
      searchParams: { type },
    })
    .json()
  return brouillonApiModelSchema.parse(json)
}

export const createCommentaire = async (
  indicateurId: string,
  individuId: string,
  body: CreerCommentaireBody,
): Promise<CommentaireApiModel> => {
  const json = await apiClient
    .post(`indicateurs/${indicateurId}/individus/${individuId}/commentaires`, { json: body })
    .json()
  return commentaireApiModelSchema.parse(json)
}

export const updateCommentaire = async (
  commentaireId: string,
  body: ModifierCommentaireBody,
): Promise<CommentaireApiModel> => {
  const json = await apiClient.put(`commentaires/${commentaireId}`, { json: body }).json()
  return commentaireApiModelSchema.parse(json)
}

// --- Panier global -----------------------------------------------------------

export const fetchCommentairesPanier = async (
  panierId: string,
  query: ListerCommentairesQuery,
): Promise<CommentaireListApiModel> => {
  const json = await apiClient
    .get(`paniers/${panierId}/commentaires`, { searchParams: query })
    .json()
  return commentaireListApiModelSchema.parse(json)
}

export const fetchBrouillonPanier = async (
  panierId: string,
  type: PanierCommentaireType,
): Promise<BrouillonApiModel> => {
  const json = await apiClient
    .get(`paniers/${panierId}/commentaires/brouillon`, { searchParams: { type } })
    .json()
  return brouillonApiModelSchema.parse(json)
}

export const createCommentairePanier = async (
  panierId: string,
  body: CreerCommentaireBody,
): Promise<CommentaireApiModel> => {
  const json = await apiClient.post(`paniers/${panierId}/commentaires`, { json: body }).json()
  return commentaireApiModelSchema.parse(json)
}
