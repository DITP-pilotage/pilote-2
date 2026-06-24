import {
  commentaireApiModelSchema,
  commentaireListApiModelSchema,
} from '@pilote/mb-shared/commentaire'

import { erreur400, erreur403, erreur404 } from '@/framework/openapi/responses'

export const CommentaireApiModelSchema = commentaireApiModelSchema.openapi('CommentaireApiModel')
export const CommentaireListApiModelSchema =
  commentaireListApiModelSchema.openapi('CommentaireListApiModel')

export const reponseCommentaire = {
  200: {
    content: { 'application/json': { schema: CommentaireApiModelSchema } },
    description: 'Commentaire',
  },
  400: erreur400,
  403: erreur403,
  404: erreur404,
}

export const reponseListe = {
  200: {
    content: { 'application/json': { schema: CommentaireListApiModelSchema } },
    description: 'Liste paginée',
  },
}
