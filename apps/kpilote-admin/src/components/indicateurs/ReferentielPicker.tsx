import { useSuspenseQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { Picker } from '@/components/ui/Picker'
import { PickerOptionNomId } from '@/components/ui/PickerOptionNomId'
import { referentielsAllQueryOptions } from '@/queries/referentiels'

// Champ contrôlé (value/onChange) : s'utilise tel quel dans un <Controller> RHF.
export function ReferentielPicker({
  value,
  onChange,
  excludedIds,
  disabled,
  placeholder = 'Choisir un référentiel…',
}: {
  value: string
  onChange: (id: string) => void
  excludedIds?: string[]
  disabled?: boolean
  placeholder?: ReactNode
}) {
  const { data } = useSuspenseQuery(referentielsAllQueryOptions())
  const excluded = new Set(excludedIds ?? [])
  // On garde toujours le référentiel courant sélectionnable, on n'exclut que les autres déjà pris.
  const items = data.filter(
    (referentiel) => referentiel.id === value || !excluded.has(referentiel.id),
  )

  return (
    <Picker
      items={items}
      value={value}
      onSelect={(referentiel) => onChange(referentiel.id)}
      getKey={(referentiel) => referentiel.id}
      getSearchText={(referentiel) => `${referentiel.id} ${referentiel.nom}`}
      renderItem={(referentiel) => <PickerOptionNomId nom={referentiel.nom} id={referentiel.id} />}
      triggerLabel={placeholder}
      disabled={disabled ?? false}
    />
  )
}
