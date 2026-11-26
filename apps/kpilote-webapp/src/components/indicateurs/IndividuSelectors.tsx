import { FieldIndividuSelect } from '@/components/indicateurs/FieldIndividuSelect'
import { type ReferentielGroup } from '@/lib/individus/hierarchy'
import { buildSelectors } from '@/lib/individus/selection'

// Un sélecteur d'individu par stack de référentiels, chacun limité aux
// référentiels de son stack.
export function IndividuSelectors({
  groups,
  selection,
  onSelect,
}: {
  groups: ReadonlyArray<ReferentielGroup>
  selection: ReadonlyArray<string>
  onSelect: (next: { individu: string; referentiel: string }) => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {buildSelectors({ groups, selection }).map((selector) => (
        <FieldIndividuSelect
          key={selector.group.referentiel.id}
          label={selector.group.referentiel.nom}
          referentielIds={selector.referentielIds}
          value={selector.value}
          placeholder={selector.placeholder}
          onChange={onSelect}
        />
      ))}
    </div>
  )
}
