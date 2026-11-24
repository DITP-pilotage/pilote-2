import { Command } from 'cmdk'
import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

import { clsxm } from './clsxm'
import { commandFilter } from './commandFilter'

export type PickerListProps<T> = {
  items: ReadonlyArray<T>
  onSelect: (item: T) => void
  getKey: (item: T) => string
  getSearchText: (item: T) => string
  renderItem: (item: T) => ReactNode
  searchPlaceholder?: string
  emptyLabel?: string
  // Affiché au-dessus du champ de recherche, pour situer le choix.
  header?: ReactNode
  className?: string
}

// Liste filtrable au clavier, sans déclencheur : le contenu du popover de
// `Picker`, à poser dans n'importe quel popover ou panneau.
export function PickerList<T>({
  items,
  onSelect,
  getKey,
  getSearchText,
  renderItem,
  searchPlaceholder = 'Rechercher…',
  emptyLabel = 'Aucun résultat.',
  header,
  className,
}: PickerListProps<T>) {
  return (
    <Command filter={commandFilter} className={className}>
      {header ? (
        <div className="border-b border-border px-3 py-2 text-xs text-text-muted">{header}</div>
      ) : null}
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search aria-hidden className="size-4 shrink-0 text-text-muted" />
        <Command.Input
          autoFocus
          placeholder={searchPlaceholder}
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-text-subtle"
        />
      </div>
      <Command.List className="max-h-72 overflow-y-auto p-1.5">
        <Command.Empty className="px-3 py-6 text-center text-sm text-text-muted">
          {emptyLabel}
        </Command.Empty>
        {items.map((item) => (
          <Command.Item
            key={getKey(item)}
            value={getSearchText(item)}
            onSelect={() => onSelect(item)}
            className={clsxm(
              'flex cursor-pointer select-none items-center gap-3 rounded-md px-2.5 py-2 text-sm outline-none',
              'data-[selected=true]:bg-surface-tinted data-[selected=true]:text-primary',
            )}
          >
            {renderItem(item)}
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  )
}
