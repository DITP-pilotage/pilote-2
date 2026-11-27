import { type ErrorApiModel, errorApiModelSchema } from '@pilote/kpilote-shared/error'
import { HTTPError } from 'ky'

// L'erreur métier renvoyée par l'API (code, message en français), ou `undefined`
// pour une erreur réseau ou une réponse qui n'en porte pas.
export const apiErrorOf = (error: unknown): ErrorApiModel | undefined => {
  if (!(error instanceof HTTPError)) return undefined
  return errorApiModelSchema.safeParse(error.data).data
}
