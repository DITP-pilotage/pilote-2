import {
  commentaireApiModelSchema,
  commentaireListApiModelSchema,
} from '@pilote/mb-shared/commentaire'

import { erreursEntite } from '@/framework/openapi/responses'

export const CommentaireApiModelSchema = commentaireApiModelSchema.openapi('CommentaireApiModel')
export const CommentaireListApiModelSchema =
  commentaireListApiModelSchema.openapi('CommentaireListApiModel')

export const reponseCommentaire = {
  200: {
    content: { 'application/json': { schema: CommentaireApiModelSchema } },
    description: 'Commentaire',
  },
  ...erreursEntite,
}

export const reponseListe = {
  200: {
    content: { 'application/json': { schema: CommentaireListApiModelSchema } },
    description: 'Liste paginée',
  },
}
