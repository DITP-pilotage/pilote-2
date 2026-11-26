import { DashboardSwitch } from '@/components/DashboardSwitch'
import { IndividuSelectors } from '@/components/indicateurs/IndividuSelectors'
import { type ReferentielGroup } from '@/lib/individus/hierarchy'

// Barre du tableau de bord : les sélecteurs d'individus sur une ligne, la bascule
// indicateurs / collections sur la suivante.
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
    <div className="flex w-full flex-col gap-3">
      <IndividuSelectors groups={groups} selection={selection} onChange={onSelectionChange} />
      <div>
        <DashboardSwitch />
      </div>
    </div>
  )
}
