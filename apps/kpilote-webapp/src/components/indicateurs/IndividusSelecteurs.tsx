import { FieldIndividuSelect } from '@/components/indicateurs/FieldIndividuSelect'
import { type ReferentielGroup } from '@/lib/individus/hierarchy'
import { buildSelecteurs } from '@/lib/individus/selection'

// Un sélecteur d'individu par stack de référentiels, chacun limité aux
// référentiels de son stack.
export function IndividusSelecteurs({
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
      {buildSelecteurs({ groups, selection }).map((selecteur) => (
        <FieldIndividuSelect
          key={selecteur.group.referentiel.id}
          label={selecteur.group.referentiel.nom}
          referentielIds={selecteur.referentielIds}
          value={selecteur.value}
          placeholder={selecteur.placeholder}
          onChange={onSelect}
        />
      ))}
    </div>
  )
}
