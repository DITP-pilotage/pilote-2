import { useSuspenseQuery } from '@tanstack/react-query'

import { Picker } from '@/components/ui/Picker'
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
      renderItem={(panier) => (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate text-sm text-text">{panier.nom}</span>
          <span className="shrink-0 font-mono text-xs text-text-muted">{panier.id}</span>
        </span>
      )}
      triggerLabel="Ajouter un panier"
      disabled={disabled ?? false}
    />
  )
}
