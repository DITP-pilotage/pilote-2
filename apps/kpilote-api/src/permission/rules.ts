import { err, ok, type Result } from 'neverthrow'

export type DoublonsError = { type: 'DOUBLONS'; ressource: 'indicateur' | 'collection' }

// Une ressource citée deux fois dans un remplacement complet aurait deux listes
// d'actions : on refuse plutôt que d'en garder une au hasard.
export const checkSansDoublon = ({
  ressource,
  publicIds,
}: {
  ressource: DoublonsError['ressource']
  publicIds: ReadonlyArray<string>
}): Result<void, DoublonsError> => {
  if (new Set(publicIds).size !== publicIds.length) return err({ type: 'DOUBLONS', ressource })
  return ok()
}
