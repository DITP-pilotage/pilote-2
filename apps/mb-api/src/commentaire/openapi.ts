import {
  commentaireApiModelSchema,
  commentaireListApiModelSchema,
} from '@pilote/mb-shared/commentaire'
import { errorApiModelSchema } from '@pilote/mb-shared/error'

export const CommentaireApiModelSchema = commentaireApiModelSchema.openapi('CommentaireApiModel')
export const CommentaireListApiModelSchema =
  commentaireListApiModelSchema.openapi('CommentaireListApiModel')
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

export const reponseCommentaire = {
  200: {
    content: { 'application/json': { schema: CommentaireApiModelSchema } },
    description: 'Commentaire',
  },
  400: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Requête invalide',
  },
  403: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Permission insuffisante',
  },
  404: {
    content: { 'application/json': { schema: ErrorApiModelSchema } },
    description: 'Sujet introuvable',
  },
}

export const reponseListe = {
  200: {
    content: { 'application/json': { schema: CommentaireListApiModelSchema } },
    description: 'Liste paginée',
  },
}
