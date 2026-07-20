import { HTTPError } from 'ky'
import { z } from 'zod'

const errorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
})

export const extractApiError = async (error: unknown): Promise<string> => {
  if (error instanceof HTTPError) {
    try {
      const body = errorBodySchema.parse(error.data)
      const details = body.details as
        | { unknownReferentielIds?: string[]; individuIds?: string[] }
        | undefined

      const unknownRefs = details?.unknownReferentielIds
      if (unknownRefs && unknownRefs.length > 0) {
        return `Référentiels inconnus : ${unknownRefs.join(', ')}`
      }

      const conflictIndividus = details?.individuIds
      if (conflictIndividus && conflictIndividus.length > 0) {
        return `Individus déjà rattachés à un autre référentiel : ${conflictIndividus.join(', ')}`
      }

      return body.message
    } catch {
      return 'Erreur côté serveur.'
    }
  }
  return 'Une erreur est survenue.'
}
