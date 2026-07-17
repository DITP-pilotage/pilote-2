import { useSuspenseQuery } from '@tanstack/react-query'

import { Picker } from '@pilote/kpilote-ui/Picker'
import { PickerOptionNomId } from '@pilote/kpilote-ui/PickerOptionNomId'
import { indicateursAllQueryOptions } from '@/queries/indicateurs'

export function IndicateurPicker({
  excludedIds,
  onSelect,
  disabled,
}: {
  excludedIds: string[]
  onSelect: (publicId: string) => void
  disabled?: boolean
}) {
  const { data } = useSuspenseQuery(indicateursAllQueryOptions())
  const excluded = new Set(excludedIds)
  const items = data.filter((indicateur) => !excluded.has(indicateur.id))

  return (
    <Picker
      items={items}
      onSelect={(indicateur) => onSelect(indicateur.id)}
      getKey={(indicateur) => indicateur.id}
      getSearchText={(indicateur) => `${indicateur.id} ${indicateur.nom}`}
      renderItem={(indicateur) => <PickerOptionNomId nom={indicateur.nom} id={indicateur.id} />}
      triggerLabel="Ajouter un indicateur"
      disabled={disabled ?? false}
    />
  )
}
