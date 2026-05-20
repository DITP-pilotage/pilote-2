import { type IndividuApiModel } from '@pilote/mb-shared/individu'
import { type ReferentielApiModel } from '@pilote/mb-shared/referentiel'
import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { indicateurQueryOptions } from '@/queries/indicateurs'
import { referentielIndividusQueryOptions, referentielQueryOptions } from '@/queries/referentiels'

type Groupe = {
  referentiel: ReferentielApiModel
  individus: ReadonlyArray<IndividuApiModel>
}

const flattenAndSort = (groupes: ReadonlyArray<Groupe>): IndividuApiModel[] =>
  groupes
    .flatMap((groupe) => [...groupe.individus])
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

type IndividuSelectProps = {
  id?: string
  indicateurId: string
  value: string
  onChange: (next: { individu: string; referentiel: string }) => void
}

export function IndividuSelect({ id, indicateurId, value, onChange }: IndividuSelectProps) {
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(indicateurId))
  const referentiels = useSuspenseQueries({
    queries: indicateur.referentielIds.map((refId) => referentielQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })
  const individusByReferentiel = useSuspenseQueries({
    queries: indicateur.referentielIds.map((refId) => referentielIndividusQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })
  const groupes: Groupe[] = indicateur.referentielIds.map((_, i) => ({
    referentiel: referentiels[i]!,
    individus: individusByReferentiel[i]!,
  }))

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const individu = flattenAndSort(groupes).find((i) => i.id === next)
        if (individu) onChange({ individu: individu.id, referentiel: individu.referentiel })
      }}
    >
      <SelectTrigger id={id} className="min-w-[16rem]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {groupes.map((groupe) => (
          <SelectGroup key={groupe.referentiel.id}>
            <SelectLabel className="bg-background">{groupe.referentiel.nom}</SelectLabel>
            {groupe.individus.map((individu) => (
              <SelectItem key={individu.id} value={individu.id}>
                {individu.nom}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
