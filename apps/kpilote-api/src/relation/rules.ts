import { err, ok, type Result } from 'neverthrow'

export type AutoParentError = { type: 'AUTO_PARENT' }

export const checkPasAutoParent = ({
  enfantPublicId,
  parentPublicId,
}: {
  enfantPublicId: string
  parentPublicId: string
}): Result<void, AutoParentError> => {
  if (enfantPublicId === parentPublicId) return err({ type: 'AUTO_PARENT' })
  return ok()
}

export type CycleDetecteError = { type: 'CYCLE_DETECTE' }

// Un individu ne prend pas pour parent l'un de ses descendants.
export const checkSansCycle = ({
  enfantId,
  cheminDuParent,
}: {
  enfantId: string
  // Le parent puis tous ses ancêtres.
  cheminDuParent: ReadonlyArray<string>
}): Result<void, CycleDetecteError> => {
  if (cheminDuParent.includes(enfantId)) return err({ type: 'CYCLE_DETECTE' })
  return ok()
}
