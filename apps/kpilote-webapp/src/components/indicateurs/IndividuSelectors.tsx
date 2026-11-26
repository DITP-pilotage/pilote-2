import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'

import { analytics } from '@/analytics/tracker'
import { FieldIndividuSelect } from '@/components/indicateurs/FieldIndividuSelect'
import { type ReferentielGroup } from '@/lib/individus/hierarchy'
import { buildSelectors, removeIndividu, selectIndividu } from '@/lib/individus/selection'

// Un sélecteur d'individu par stack de référentiels, sur une ligne à colonnes
// égales (empilés sur mobile). Choisir un individu remplace celui de son stack ;
// le retirer libère le stack.
export function IndividuSelectors({
  groups,
  selection,
  onChange,
}: {
  groups: ReadonlyArray<ReferentielGroup>
  selection: ReadonlyArray<string>
  onChange: (selection: string[]) => void
}) {
  return (
    <div className="grid gap-3 md:auto-cols-fr md:grid-flow-col">
      {buildSelectors({ groups, selection }).map((selector) => (
        <FieldIndividuSelect
          key={selector.group.referentiel.id}
          label={selector.group.referentiel.nom}
          referentielIds={selector.referentielIds}
          value={selector.value}
          placeholder={selector.placeholder}
          className="min-w-0 sm:min-w-0"
          onChange={({ individu, referentiel }) => {
            analytics.trackEvent(
              analyticsEvents.dashboard.individuChange({ referentiel_id: referentiel }),
            )
            onChange(selectIndividu({ selection, groups, individu }))
          }}
          onClear={() => onChange(removeIndividu({ selection, individu: selector.value }))}
        />
      ))}
    </div>
  )
}
