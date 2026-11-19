import { ChevronsDownUp, ChevronsUpDown, Search } from 'lucide-react'

import { Button } from '@pilote/kpilote-ui/Button'
import { searchSummaryOf } from '@/lib/axeGraphe'

export function ModaliteSearchBar({
  search,
  matchCount,
  canCollapseAll,
  canExpandAll,
  onSearchChange,
  onCollapseAll,
  onExpandAll,
}: {
  search: string
  // null : pas de recherche en cours.
  matchCount: number | null
  canCollapseAll: boolean
  canExpandAll: boolean
  onSearchChange: (search: string) => void
  onCollapseAll: () => void
  onExpandAll: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-6 py-2">
      <label className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-subtle" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher une modalité"
          aria-label="Rechercher une modalité"
          className="w-72 rounded-md border border-border bg-surface py-1.5 pr-2.5 pl-8 text-sm text-text focus:border-primary focus:outline-none"
        />
      </label>
      {matchCount === null ? (
        <>
          <Button size="sm" variant="tertiary" disabled={!canCollapseAll} onClick={onCollapseAll}>
            <ChevronsDownUp /> Tout replier
          </Button>
          <Button size="sm" variant="tertiary" disabled={!canExpandAll} onClick={onExpandAll}>
            <ChevronsUpDown /> Tout déplier
          </Button>
        </>
      ) : (
        <span className="text-xs text-text-muted">{searchSummaryOf(matchCount)}</span>
      )}
    </div>
  )
}
