import { type z } from '@hono/zod-openapi'

import { errorApiModelSchema } from '@pilote/kpilote-shared/error'

export const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

const errorResponse = (description: string) => ({
  content: { 'application/json': { schema: ErrorApiModelSchema } },
  description,
})

export const succes200 = <S extends z.ZodTypeAny>(description: string, schema: S) => ({
  content: { 'application/json': { schema } },
  description,
})

export const erreur400 = errorResponse('Requête invalide')
export const erreur403 = errorResponse('Permission insuffisante')
export const erreur404 = errorResponse('Introuvable')
export const erreur409 = errorResponse('Conflit')
