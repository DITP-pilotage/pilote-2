import {
  brouillonApiModelSchema,
  commentaireApiModelSchema,
  commentaireListApiModelSchema,
} from '@pilote/kpilote-shared/commentaire'

import { type CreerCommentaireError } from '@/commentaire/commands/creerCommentaire'
import {
  erreur400,
  erreur403,
  erreur404,
  erreur409,
  succes200,
} from '@/framework/openapi/responses'

export const CommentaireApiModelSchema = commentaireApiModelSchema.openapi('CommentaireApiModel')
export const CommentaireListApiModelSchema =
  commentaireListApiModelSchema.openapi('CommentaireListApiModel')
export const BrouillonApiModelSchema = brouillonApiModelSchema.openapi('BrouillonApiModel')

export const reponseCommentaire = {
  200: succes200('Commentaire', CommentaireApiModelSchema),
  400: erreur400,
  403: erreur403,
  404: erreur404,
}

export const reponseCreationCommentaire = {
  ...reponseCommentaire,
  409: erreur409,
}

export const describeCreerCommentaireError = (
  error: CreerCommentaireError,
): { status: 409; message: string; details?: Record<string, unknown> } => {
  switch (error.type) {
    case 'BROUILLON_EXISTANT':
      return { status: 409, message: 'Un brouillon existe déjà pour ce type ; reprenez-le.' }
  }
}

export const reponseListe = {
  200: succes200('Liste paginée', CommentaireListApiModelSchema),
}

export const reponseBrouillon = {
  200: succes200('Brouillon courant, ou null', BrouillonApiModelSchema),
  403: erreur403,
}
