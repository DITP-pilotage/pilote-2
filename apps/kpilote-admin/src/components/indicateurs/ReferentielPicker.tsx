import { useSuspenseQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { Picker } from '@/components/ui/Picker'
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
  const selected = data.find((referentiel) => referentiel.id === value)

  return (
    <Picker
      items={items}
      onSelect={(referentiel) => onChange(referentiel.id)}
      getKey={(referentiel) => referentiel.id}
      getSearchText={(referentiel) => `${referentiel.id} ${referentiel.nom}`}
      renderItem={(referentiel) => (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate text-sm text-text">{referentiel.nom}</span>
          <span className="shrink-0 font-mono text-xs text-text-muted">{referentiel.id}</span>
        </span>
      )}
      triggerLabel={selected ? `${selected.id} · ${selected.nom}` : placeholder}
      disabled={disabled ?? false}
    />
  )
}
