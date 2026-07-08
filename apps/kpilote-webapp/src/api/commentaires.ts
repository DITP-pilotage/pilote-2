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
  dossierCommentaireTypeSchema,
} from '@pilote/kpilote-shared/commentaire'
import { z } from 'zod'

import { apiClient } from '@/api/client'

export type IndicateurIndividuCommentaireType = z.infer<
  typeof indicateurIndividuCommentaireTypeSchema
>

export type DossierCommentaireType = z.infer<typeof dossierCommentaireTypeSchema>

// Seul le type CONFIANCE (synthèse des résultats) porte un niveau de confiance.
export const typeAvecNiveauConfiance = (type: string): boolean => type === 'CONFIANCE'

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

// --- Dossier global -----------------------------------------------------------

export const fetchCommentairesDossier = async (
  dossierId: string,
  query: ListerCommentairesQuery,
): Promise<CommentaireListApiModel> => {
  const json = await apiClient
    .get(`dossiers/${dossierId}/commentaires`, { searchParams: query })
    .json()
  return commentaireListApiModelSchema.parse(json)
}

export const fetchBrouillonDossier = async (
  dossierId: string,
  type: DossierCommentaireType,
): Promise<BrouillonApiModel> => {
  const json = await apiClient
    .get(`dossiers/${dossierId}/commentaires/brouillon`, { searchParams: { type } })
    .json()
  return brouillonApiModelSchema.parse(json)
}

export const createCommentaireDossier = async (
  dossierId: string,
  body: CreerCommentaireBody,
): Promise<CommentaireApiModel> => {
  const json = await apiClient.post(`dossiers/${dossierId}/commentaires`, { json: body }).json()
  return commentaireApiModelSchema.parse(json)
}
