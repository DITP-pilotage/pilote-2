import { Popover as PopoverPrimitive } from 'radix-ui'
import { useSuspenseQueries } from '@tanstack/react-query'
import { Command } from 'cmdk'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { clsxm } from '@/lib/clsxm'
import {
  buildOrderedNodes,
  groupNodesByRootReferentiel,
  type IndividuNode,
  type ReferentielGroup,
} from '@/lib/individus/hierarchy'
import { referentielIndividusQueryOptions, referentielQueryOptions } from '@/queries/referentiels'

type IndividuSelectProps = {
  id?: string
  referentielIds: ReadonlyArray<string>
  value: string
  onChange: (next: { individu: string; referentiel: string }) => void
}

const commandFilter = (itemValue: string, query: string) => {
  const haystack = itemValue.toLowerCase()
  const needle = query.trim().toLowerCase()
  if (!needle) return 1
  return haystack.includes(needle) ? 1 : 0
}

const listClassName =
  'max-h-[min(20rem,var(--radix-popover-content-available-height))] overflow-y-auto p-1.5'
const emptyClassName = 'px-3 py-6 text-center text-sm text-text-muted'
const itemClassName = clsxm(
  'flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-text outline-none',
  'data-[selected=true]:bg-surface-tinted data-[selected=true]:text-primary',
)

function CommandSearchInput({
  value,
  onValueChange,
  placeholder,
}: {
  value: string
  onValueChange: (next: string) => void
  placeholder: string
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3">
      <Search className="size-4 text-text-muted" />
      <Command.Input
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        className="h-10 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
      />
    </div>
  )
}

// Étape 1 : choix du référentiel racine parmi la forêt.
function RootReferentielsCommandStep({
  groups,
  onSelect,
}: {
  groups: ReadonlyArray<ReferentielGroup>
  onSelect: (referentielId: string) => void
}) {
  const [search, setSearch] = useState('')
  return (
    <Command label="Choisir un référentiel" filter={commandFilter}>
      <CommandSearchInput
        value={search}
        onValueChange={setSearch}
        placeholder="Rechercher un référentiel…"
      />
      <Command.List className={listClassName}>
        <Command.Empty className={emptyClassName}>Aucun référentiel trouvé.</Command.Empty>
        {groups.map((group) => (
          <Command.Item
            key={group.referentiel.id}
            value={group.referentiel.nom}
            onSelect={() => onSelect(group.referentiel.id)}
            className={itemClassName}
          >
            <span className="min-w-0 flex-1 truncate font-medium">{group.referentiel.nom}</span>
            <span className="shrink-0 rounded-full bg-surface-tinted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {group.nodes.length}
            </span>
            <ChevronRight className="size-4 shrink-0 text-text-muted" />
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  )
}

// Étape 2 : choix d'un individu dans la hiérarchie complète du référentiel racine.
export function ReferentielSelectCommandStep({
  referentielNom,
  nodes,
  value,
  onBack,
  onSelect,
}: {
  referentielNom: string
  nodes: ReadonlyArray<IndividuNode>
  value: string
  onBack: (() => void) | null
  onSelect: (next: { individu: string; referentiel: string }) => void
}) {
  const [search, setSearch] = useState('')
  return (
    <Command label="Rechercher un individu" filter={commandFilter}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center gap-1.5 border-b border-border px-3 py-2 text-left text-xs font-semibold text-text-muted hover:text-text"
        >
          <ChevronLeft className="size-4 shrink-0" />
          <span className="truncate">{referentielNom}</span>
        </button>
      ) : null}
      <CommandSearchInput value={search} onValueChange={setSearch} placeholder="Rechercher…" />
      <Command.List className={listClassName}>
        <Command.Empty className={emptyClassName}>Aucun individu trouvé.</Command.Empty>
        {nodes.map((node) => {
          const isSelected = node.individu.id === value
          const searchableValue = [node.individu.nom, node.individu.id, ...node.parentPath].join(
            ' ',
          )
          return (
            <Command.Item
              key={node.individu.id}
              value={searchableValue}
              onSelect={() =>
                onSelect({ individu: node.individu.id, referentiel: node.individu.referentiel })
              }
              className={clsxm(
                itemClassName,
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
            </Command.Item>
          )
        })}
      </Command.List>
    </Command>
  )
}

export function IndividuSelect({ id, referentielIds, value, onChange }: IndividuSelectProps) {
  const [open, setOpen] = useState(false)
  const [activeReferentielId, setActiveReferentielId] = useState<string | null>(null)

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

  // Groupes par référentiel *racine* : chaque groupe porte tout le sous-arbre de
  // sa racine, hiérarchie transverse comprise (ex. France → régions → départements).
  const groups = useMemo(() => groupNodesByRootReferentiel(nodes), [nodes])

  const selected = nodes.find((node) => node.individu.id === value)
  const hasSingleRootReferentiel = groups.length === 1
  const activeGroup = groups.find((group) => group.referentiel.id === activeReferentielId)

  // Étape d'ouverture : on ouvre directement sur le référentiel racine de l'arbre
  // de l'individu déjà sélectionné, ou sur l'unique référentiel racine ; sinon on
  // liste les référentiels racines.
  const resolveInitialReferentiel = () => {
    if (selected) {
      const group = groups.find((g) => g.nodes.some((n) => n.individu.id === value))
      if (group) return group.referentiel.id
    }
    if (hasSingleRootReferentiel) return groups[0]?.referentiel.id ?? null
    return null
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setActiveReferentielId(resolveInitialReferentiel())
      }}
    >
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
          {activeGroup ? (
            <ReferentielSelectCommandStep
              referentielNom={activeGroup.referentiel.nom}
              nodes={activeGroup.nodes}
              value={value}
              onBack={hasSingleRootReferentiel ? null : () => setActiveReferentielId(null)}
              onSelect={(next) => {
                onChange(next)
                setOpen(false)
              }}
            />
          ) : (
            <RootReferentielsCommandStep groups={groups} onSelect={setActiveReferentielId} />
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
