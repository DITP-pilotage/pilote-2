import type { PermissionRow } from '@/components/permissions/formValues'

const memesActions = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

// Compte les lignes retirées, ajoutées, et celles dont les actions d'écriture
// ont changé. `formState.dirtyFields` ne convient pas : react-hook-form marque
// tout un tableau comme sale dès que sa longueur change.
export const compterModifications = (
  initiales: readonly PermissionRow[],
  courantes: readonly PermissionRow[],
): number => {
  const initialesParId = new Map(initiales.map((row) => [row.publicId, row.writeActions]))
  const idsCourants = new Set(courantes.map((row) => row.publicId))

  const retirees = initiales.filter((row) => !idsCourants.has(row.publicId)).length
  const ajouteesOuModifiees = courantes.filter((row) => {
    const precedentes = initialesParId.get(row.publicId)
    return precedentes === undefined || !memesActions(precedentes, row.writeActions)
  }).length

  return retirees + ajouteesOuModifiees
}
