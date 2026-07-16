import { useSuspenseQuery } from '@tanstack/react-query'

import { Picker } from '@/components/ui/Picker'
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
      renderItem={(indicateur) => (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate text-sm text-text">{indicateur.nom}</span>
          <span className="shrink-0 font-mono text-xs text-text-muted">{indicateur.id}</span>
        </span>
      )}
      triggerLabel="Ajouter un indicateur"
      disabled={disabled ?? false}
    />
  )
}
