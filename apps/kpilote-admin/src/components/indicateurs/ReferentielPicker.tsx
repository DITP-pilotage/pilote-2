import { useSuspenseQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { Picker } from '@/components/ui/Picker'
import { PickerOptionNomId } from '@/components/ui/PickerOptionNomId'
import { referentielsAllQueryOptions } from '@/queries/referentiels'

// Contrôle d'ajout : sélectionner un référentiel appelle onSelect(id), le trigger
// affiche toujours son placeholder (comme le sélecteur d'ajout des responsables).
export function ReferentielPicker({
  excludedIds,
  onSelect,
  disabled,
  placeholder = 'Ajouter un référentiel',
}: {
  excludedIds: string[]
  onSelect: (id: string) => void
  disabled?: boolean
  placeholder?: ReactNode
}) {
  const { data } = useSuspenseQuery(referentielsAllQueryOptions())
  const excluded = new Set(excludedIds)
  const items = data.filter((referentiel) => !excluded.has(referentiel.id))

  return (
    <Picker
      items={items}
      onSelect={(referentiel) => onSelect(referentiel.id)}
      getKey={(referentiel) => referentiel.id}
      getSearchText={(referentiel) => `${referentiel.id} ${referentiel.nom}`}
      renderItem={(referentiel) => <PickerOptionNomId nom={referentiel.nom} id={referentiel.id} />}
      triggerLabel={placeholder}
      disabled={disabled ?? false}
    />
  )
}
