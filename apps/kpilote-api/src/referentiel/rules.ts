import { err, ok, type Result } from 'neverthrow'

export type IndividusDejaRattachesError = {
  type: 'INDIVIDUS_ALREADY_ATTACHED'
  individuIds: string[]
}

// Un individu appartient à un seul référentiel : l'upsert d'un référentiel
// n'en prend pas un à un autre référentiel.
export const checkIndividusLibres = ({
  referentielId,
  individusExistants,
}: {
  // null : le référentiel n'existe pas encore.
  referentielId: string | null
  // Les individus du body qui existent déjà.
  individusExistants: ReadonlyArray<{ publicId: string; referentielId: string }>
}): Result<void, IndividusDejaRattachesError> => {
  const rattachesAilleurs = individusExistants
    .filter((individu) => individu.referentielId !== referentielId)
    .map((individu) => individu.publicId)
    .sort()
  if (rattachesAilleurs.length > 0) {
    return err({ type: 'INDIVIDUS_ALREADY_ATTACHED', individuIds: rattachesAilleurs })
  }
  return ok()
}
