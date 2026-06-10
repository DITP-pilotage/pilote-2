import { Popover as PopoverPrimitive } from 'radix-ui'
import { useSuspenseQueries } from '@tanstack/react-query'
import { Command } from 'cmdk'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { clsxm } from '@/lib/clsxm'
import { buildOrderedNodes } from '@/lib/individus/hierarchy'
import { referentielIndividusQueryOptions, referentielQueryOptions } from '@/queries/referentiels'

type IndividuSelectProps = {
  id?: string
  referentielIds: ReadonlyArray<string>
  value: string
  onChange: (next: { individu: string; referentiel: string }) => void
}

export function IndividuSelect({ id, referentielIds, value, onChange }: IndividuSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const referentiels = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })
  const individusByReferentiel = useSuspenseQueries({
    queries: referentielIds.map((refId) => referentielIndividusQueryOptions(refId)),
    combine: (results) => results.map((r) => r.data),
  })

  const nodes = useMemo(() => {
    const referentielsById = new Map(referentiels.map((r) => [r.id, r] as const))
    const allIndividus = individusByReferentiel.flatMap((batch) => [...batch])
    return buildOrderedNodes(allIndividus, referentielsById)
  }, [referentiels, individusByReferentiel])

  const selected = nodes.find((node) => node.individu.id === value)

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        id={id}
        className={clsxm(
          'inline-flex w-full min-w-[28rem] items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-left text-sm font-medium text-text',
          'hover:border-border-strong',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          'data-[state=open]:border-primary',
        )}
      >
        <span className="flex min-w-0 flex-col">
          {selected ? (
            <>
              <span className="flex items-baseline gap-2">
                <span className="truncate">{selected.individu.nom}</span>
                <span className="shrink-0 font-mono text-xs font-normal text-text-subtle">
                  {selected.individu.id}
                </span>
              </span>
              {selected.parentPath.length > 0 ? (
                <span className="truncate text-xs font-normal text-text-muted">
                  {selected.parentPath.join(' › ')}
                </span>
              ) : null}
            </>
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
          <Command
            label="Rechercher un individu"
            filter={(itemValue, query) => {
              const haystack = itemValue.toLowerCase()
              const needle = query.trim().toLowerCase()
              if (!needle) return 1
              return haystack.includes(needle) ? 1 : 0
            }}
          >
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 text-text-muted" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Rechercher…"
                className="h-10 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
              />
            </div>
            <Command.List className="max-h-[min(20rem,var(--radix-popover-content-available-height))] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-6 text-center text-sm text-text-muted">
                Aucun individu trouvé.
              </Command.Empty>
              {nodes.map((node) => {
                const isSelected = node.individu.id === value
                const searchableValue = [
                  node.individu.nom,
                  node.individu.id,
                  ...node.parentPath,
                  node.referentiel.nom,
                ].join(' ')
                return (
                  <Command.Item
                    key={node.individu.id}
                    value={searchableValue}
                    onSelect={() => {
                      onChange({
                        individu: node.individu.id,
                        referentiel: node.individu.referentiel,
                      })
                      setOpen(false)
                      setSearch('')
                    }}
                    className={clsxm(
                      'flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-text outline-none',
                      'data-[selected=true]:bg-surface-tinted data-[selected=true]:text-primary',
                      isSelected && 'bg-primary-tinted font-semibold text-primary',
                    )}
                    style={{ paddingLeft: `${0.625 + node.depth * 0.875}rem` }}
                  >
                    <Check
                      className={clsxm('size-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate">{node.individu.nom}</span>
                        <span className="shrink-0 font-mono text-[11px] font-normal text-text-subtle">
                          {node.individu.id}
                        </span>
                      </span>
                      {node.parentPath.length > 0 ? (
                        <span className="truncate text-xs font-normal text-text-muted">
                          {node.parentPath.join(' › ')}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 rounded-full bg-surface-tinted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      {node.referentiel.nom}
                    </span>
                  </Command.Item>
                )
              })}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
