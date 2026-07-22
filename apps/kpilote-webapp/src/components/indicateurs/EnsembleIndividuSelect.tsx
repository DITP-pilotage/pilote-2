import { Popover as PopoverPrimitive } from 'radix-ui'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { clsxm } from '@/lib/clsxm'
import { type ReferentielGroup } from '@/lib/individus/hierarchy'

import { ReferentielSelectCommandStep } from './IndividuSelect'

type EnsembleIndividuSelectProps = {
  id?: string
  group: ReferentielGroup
  value: string
  onChange: (next: { individu: string; referentiel: string }) => void
}

// Sélecteur d'individu scopé à un seul ensemble (référentiel racine + son
// sous-arbre). Contrairement à IndividuSelect, pas d'étape « choisir le
// référentiel racine » : la page affiche une rangée de ces sélecteurs, un par
// ensemble pertinent.
export function EnsembleIndividuSelect({
  id,
  group,
  value,
  onChange,
}: EnsembleIndividuSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = group.nodes.find((n) => n.individu.id === value)

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        id={id}
        className={clsxm(
          'inline-flex w-full min-w-[18rem] items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-left text-sm font-medium text-text sm:min-w-[25rem]',
          'hover:border-border-strong',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          'data-[state=open]:border-primary',
        )}
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-normal text-text-muted">
            {group.referentiel.nom}
          </span>
          {selected ? (
            <span className="truncate">{selected.individu.nom}</span>
          ) : (
            <span className="text-text-subtle">Sélectionner un individu…</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-text-muted" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[32rem] overflow-hidden rounded-lg border border-border bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
        >
          <ReferentielSelectCommandStep
            referentielNom={group.referentiel.nom}
            nodes={group.nodes}
            value={value}
            onBack={null}
            onSelect={(next) => {
              onChange(next)
              setOpen(false)
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
