import {
  type CommentaireApiModel,
  commentaireApiModelSchema,
  type CommentaireListApiModel,
  commentaireListApiModelSchema,
  type CreerCommentaireBody,
  indicateurIndividuCommentaireTypeSchema,
  type ListerCommentairesQuery,
  type ModifierCommentaireBody,
} from '@pilote/mb-shared/commentaire'
import { z } from 'zod'

import { apiClient } from '@/api/client'

export type IndicateurIndividuCommentaireType = z.infer<
  typeof indicateurIndividuCommentaireTypeSchema
>

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

export const createCommentaire = async (
  indicateurId: string,
  individuId: string,
  body: CreerCommentaireBody<IndicateurIndividuCommentaireType>,
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
