import { IndividuSelectors } from '@/components/indicateurs/IndividuSelectors'
import { type ReferentielGroup } from '@/lib/individus/hierarchy'

// Barre sticky du tableau de bord : seuls les sélecteurs d'individus restent visibles au
// défilement. La bascule indicateurs / collections est en tête de page, hors de la barre.
export function DashboardStickybar({
  groups,
  selection,
  onSelectionChange,
}: {
  groups: ReadonlyArray<ReferentielGroup>
  selection: ReadonlyArray<string>
  onSelectionChange: (selection: string[]) => void
}) {
  return (
    <div className="w-full">
      <IndividuSelectors groups={groups} selection={selection} onChange={onSelectionChange} />
    </div>
  )
}
