import { err, ok, type Result } from 'neverthrow'

export type IndividuInconnuError = { type: 'INDIVIDU_INCONNU'; individu: string }

// On n'écrit sur un individu que s'il appartient à un référentiel lié à
// l'indicateur. Un individu inconnu et un individu hors de ces référentiels
// renvoient la même erreur : on ne révèle pas qu'il existe.
export const checkIndividuRattache = <I extends { referentielId: string }>({
  individuPublicId,
  individu,
  referentielIdsLies,
}: {
  individuPublicId: string
  individu: I | undefined
  referentielIdsLies: ReadonlySet<string>
}): Result<I, IndividuInconnuError> => {
  if (!individu) return err({ type: 'INDIVIDU_INCONNU', individu: individuPublicId })
  if (!referentielIdsLies.has(individu.referentielId)) {
    return err({ type: 'INDIVIDU_INCONNU', individu: individuPublicId })
  }
  return ok(individu)
}
