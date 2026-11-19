import { err, ok, type Result } from 'neverthrow'

export type IndicateurDejaAffecteError = { type: 'INDICATEUR_DEJA_AFFECTE' }

// Ajouter un indicateur déjà présent écraserait sa pondération sans le dire :
// on refuse, la pondération a sa propre route.
export const checkIndicateurNonAffecte = ({
  dejaAffecte,
}: {
  dejaAffecte: boolean
}): Result<void, IndicateurDejaAffecteError> => {
  if (dejaAffecte) return err({ type: 'INDICATEUR_DEJA_AFFECTE' })
  return ok()
}

export type ResponsableDejaAffecteError = { type: 'RESPONSABLE_DEJA_AFFECTE' }

export const checkResponsableNonAffecte = ({
  dejaAffecte,
}: {
  dejaAffecte: boolean
}): Result<void, ResponsableDejaAffecteError> => {
  if (dejaAffecte) return err({ type: 'RESPONSABLE_DEJA_AFFECTE' })
  return ok()
}
