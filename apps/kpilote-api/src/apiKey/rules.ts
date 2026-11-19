import { err, ok, type Result } from 'neverthrow'

export type CleApiNonRevocableError =
  { type: 'CLE_API_COURANTE' } | { type: 'CLE_API_DEJA_REVOQUEE' }

// Révoquer la clé de la requête couperait l'appelant en plein milieu ; une
// clé déjà révoquée garde sa date de révocation d'origine.
export const checkCleApiRevocable = ({
  cleApi,
  principalId,
}: {
  cleApi: { id: string; revokedAt: Date | null }
  principalId: string
}): Result<void, CleApiNonRevocableError> => {
  if (cleApi.id === principalId) return err({ type: 'CLE_API_COURANTE' })
  if (cleApi.revokedAt) return err({ type: 'CLE_API_DEJA_REVOQUEE' })
  return ok()
}
