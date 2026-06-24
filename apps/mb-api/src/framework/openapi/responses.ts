import { errorApiModelSchema } from '@pilote/mb-shared/error'

export const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

export const errorResponse = (description: string) => ({
  content: { 'application/json': { schema: ErrorApiModelSchema } },
  description,
})

export const erreur400 = errorResponse('Requête invalide')
export const erreur403 = errorResponse('Permission insuffisante')
export const erreur404 = errorResponse('Introuvable')

// Réponses d'erreur d'une route qui retourne une entité unique
// (validation, permission, lookup).
export const erreursEntite = {
  400: erreur400,
  403: erreur403,
  404: erreur404,
}
