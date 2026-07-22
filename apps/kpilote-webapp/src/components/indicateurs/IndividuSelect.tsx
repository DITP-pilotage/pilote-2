import { Popover as PopoverPrimitive } from 'radix-ui'
import { useSuspenseQueries } from '@tanstack/react-query'
import { Command } from 'cmdk'
import { Check, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'
import {
  buildOrderedNodes,
  findRootReferentielIdForIndividu,
  groupNodesByRootReferentiel,
  type IndividuNode,
} from '@/lib/individus/hierarchy'
import { referentielIndividusQueryOptions, referentielQueryOptions } from '@/queries/referentiels'

type IndividuSelection = { individu: string; referentiel: string }

type IndividuSelectProps = {
  id?: string
  referentielIds: ReadonlyArray<string>
  value: string
  onChange: (next: IndividuSelection) => void
}

const commandFilter = (itemValue: string, query: string) => {
  const haystack = itemValue.toLowerCase()
  const needle = query.trim().toLowerCase()
  if (!needle) return 1
  return haystack.includes(needle) ? 1 : 0
}

// Valeur textuelle sur laquelle on filtre un individu : nom + id + chemin parent.
const searchableValue = (node: IndividuNode) =>
  [node.individu.nom, node.individu.id, ...node.parentPath].join(' ')

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

// Un individu dans la liste : coche de sélection, nom, id monospace, breadcrumb du
// chemin parent, indentation selon la profondeur dans la hiérarchie.
function IndividuCommandItem({
  node,
  value,
  onSelect,
}: {
  node: IndividuNode
  value: string
  onSelect: (next: IndividuSelection) => void
}) {
  const isSelected = node.individu.id === value
  return (
    <Command.Item
      value={node.individu.id}
      onSelect={() =>
        onSelect({ individu: node.individu.id, referentiel: node.individu.referentiel })
      }
      className={clsxm(itemClassName, isSelected && 'bg-primary-tinted font-semibold text-primary')}
      style={{ paddingLeft: `${0.625 + node.depth * 0.875}rem` }}
    >
      <Check className={clsxm('size-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
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
}

// En-tête repliable d'un groupe (référentiel racine) : chevron animé, nom, badge
// du nombre total d'individus du groupe. Les items ne sont rendus que si déplié.
function ReferentielGroupSection({
  referentielNom,
  count,
  isExpanded,
  onToggle,
  children,
}: {
  referentielNom: string
  count: number
  isExpanded: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium text-text hover:bg-surface-tinted"
      >
        <ChevronRight
          className={clsxm(
            'size-4 shrink-0 text-text-muted transition-transform',
            isExpanded && 'rotate-90',
          )}
        />
        <span className="min-w-0 flex-1 truncate">{referentielNom}</span>
        <span className="shrink-0 rounded-full bg-surface-tinted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {count}
        </span>
      </button>
      {isExpanded ? children : null}
    </div>
  )
}

export function IndividuSelect({ id, referentielIds, value, onChange }: IndividuSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(new Set())

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
  const hasSearch = search.trim() !== ''
  const nodeMatches = (node: IndividuNode) => commandFilter(searchableValue(node), search) > 0

  const handleSelect = (next: IndividuSelection) => {
    onChange(next)
    setOpen(false)
  }

  const toggleGroup = (referentielId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(referentielId)) next.delete(referentielId)
      else next.add(referentielId)
      return next
    })
  }

  // À l'ouverture : recherche vide et seul le groupe de l'individu sélectionné déplié.
  const resolveInitialExpanded = (): ReadonlySet<string> => {
    const referentielId = findRootReferentielIdForIndividu(groups, value)
    return referentielId ? new Set([referentielId]) : new Set()
  }

  const singleGroup = groups.length === 1 ? groups[0] : null
  const isEmpty = hasSearch && groups.every((group) => !group.nodes.some(nodeMatches))

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setSearch('')
          setExpandedGroups(resolveInitialExpanded())
        }
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
          <Command label="Rechercher un individu" shouldFilter={false}>
            <CommandSearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Rechercher un individu…"
            />
            <Command.List className={listClassName}>
              {isEmpty ? <p className={emptyClassName}>Aucun individu trouvé.</p> : null}

              {singleGroup
                ? (hasSearch ? singleGroup.nodes.filter(nodeMatches) : singleGroup.nodes).map(
                    (node) => (
                      <IndividuCommandItem
                        key={node.individu.id}
                        node={node}
                        value={value}
                        onSelect={handleSelect}
                      />
                    ),
                  )
                : groups.map((group) => {
                    const visibleNodes = hasSearch
                      ? group.nodes.filter(nodeMatches)
                      : group.nodes
                    if (hasSearch && visibleNodes.length === 0) return null
                    const isExpanded = hasSearch ? true : expandedGroups.has(group.referentiel.id)
                    return (
                      <ReferentielGroupSection
                        key={group.referentiel.id}
                        referentielNom={group.referentiel.nom}
                        count={group.nodes.length}
                        isExpanded={isExpanded}
                        onToggle={() => toggleGroup(group.referentiel.id)}
                      >
                        {visibleNodes.map((node) => (
                          <IndividuCommandItem
                            key={node.individu.id}
                            node={node}
                            value={value}
                            onSelect={handleSelect}
                          />
                        ))}
                      </ReferentielGroupSection>
                    )
                  })}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
