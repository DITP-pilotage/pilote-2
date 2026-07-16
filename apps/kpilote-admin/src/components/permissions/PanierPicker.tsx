import { useSuspenseQuery } from '@tanstack/react-query'

import { Picker } from '@pilote/kpilote-ui/Picker'
import { PickerOptionNomId } from '@pilote/kpilote-ui/PickerOptionNomId'
import { paniersAllQueryOptions } from '@/queries/paniers'

export function PanierPicker({
  excludedIds,
  onSelect,
  disabled,
}: {
  excludedIds: string[]
  onSelect: (publicId: string) => void
  disabled?: boolean
}) {
  const { data } = useSuspenseQuery(paniersAllQueryOptions())
  const excluded = new Set(excludedIds)
  const items = data.filter((panier) => !excluded.has(panier.id))

  return (
    <Picker
      items={items}
      onSelect={(panier) => onSelect(panier.id)}
      getKey={(panier) => panier.id}
      getSearchText={(panier) => `${panier.id} ${panier.nom}`}
      renderItem={(panier) => <PickerOptionNomId nom={panier.nom} id={panier.id} />}
      triggerLabel="Ajouter un panier"
      disabled={disabled ?? false}
    />
  )
}
