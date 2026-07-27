import type { IndividuApiModel } from '@pilote/kpilote-shared/individu'
import { useSuspenseQuery } from '@tanstack/react-query'

import { Picker } from '@pilote/kpilote-ui/Picker'
import { PickerOptionNomId } from '@pilote/kpilote-ui/PickerOptionNomId'
import { individusAllQueryOptions } from '@/queries/individus'

// Sert à la fois de contrôle d'ajout (sans `value`, le trigger réaffiche son
// placeholder) et de cellule d'édition du parent (avec `value`).
export function IndividuPicker({
  excludedIds,
  onSelect,
  value,
  disabled,
  placeholder = 'Choisir un individu',
  filtre,
}: {
  excludedIds: string[]
  onSelect: (id: string) => void
  value?: string
  disabled?: boolean
  placeholder?: string
  filtre?: (individu: IndividuApiModel) => boolean
}) {
  const { data } = useSuspenseQuery(individusAllQueryOptions())
  const excluded = new Set(excludedIds)
  const items = data
    .filter((individu) => !excluded.has(individu.id))
    .filter((individu) => (filtre ? filtre(individu) : true))

  return (
    <Picker
      items={items}
      onSelect={(individu) => onSelect(individu.id)}
      getKey={(individu) => individu.id}
      getSearchText={(individu) => `${individu.id} ${individu.nom} ${individu.referentiel}`}
      renderItem={(individu) => <PickerOptionNomId nom={individu.nom} id={individu.id} />}
      triggerLabel={placeholder}
      searchPlaceholder="Rechercher un individu…"
      emptyLabel="Aucun individu."
      disabled={disabled ?? false}
      {...(value !== undefined ? { value } : {})}
    />
  )
}
