import { pickRoot, type ReferentielGroup } from '@/lib/individus/hierarchy'

import { EnsembleIndividuSelect } from './EnsembleIndividuSelect'

type IndividusSelectorBarProps = {
  groups: ReadonlyArray<ReferentielGroup>
  selected: ReadonlyMap<string, string>
  onSelect: (rootReferentielId: string, individuId: string) => void
}

// Rangée de sélecteurs : un par ensemble de référentiels pertinent. Quand l'URL
// ne porte pas de choix pour un ensemble, on affiche le défaut (niveau le plus
// haut, premier de la liste) via pickRoot.
export function IndividusSelectorBar({ groups, selected, onSelect }: IndividusSelectorBarProps) {
  if (groups.length === 0) return null

  return (
    <div className="flex flex-wrap items-end gap-3">
      {groups.map((group) => {
        const rootId = group.referentiel.id
        const value = selected.get(rootId) ?? pickRoot(group.nodes)?.individu.id ?? ''
        return (
          <EnsembleIndividuSelect
            key={rootId}
            group={group}
            value={value}
            onChange={({ individu }) => onSelect(rootId, individu)}
          />
        )
      })}
    </div>
  )
}
