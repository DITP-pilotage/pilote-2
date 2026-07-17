import { Command } from 'cmdk'
import { ChevronDown, Search } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { clsxm } from './clsxm'
import { searchUnaccent } from '@pilote/kpilote-shared/texte'

// Filtre par sous-chaîne insensible à la casse ET aux accents, prévisible plutôt
// que le scoring fuzzy par défaut de cmdk. `getSearchText` peut donc renvoyer le
// texte brut : la normalisation est centralisée ici pour tous les Pickers.
const commandFilter = (itemValue: string, query: string): number => {
  const needle = searchUnaccent(query)
  if (!needle) return 1
  return searchUnaccent(itemValue).includes(needle) ? 1 : 0
}

type PickerProps<T> = {
  items: T[]
  onSelect: (item: T) => void
  getKey: (item: T) => string
  getSearchText: (item: T) => string
  renderItem: (item: T) => ReactNode
  triggerLabel: ReactNode
  searchPlaceholder?: string
  emptyLabel?: string
  disabled?: boolean
  // Mode contrôlé optionnel : passer la clé sélectionnée pour l'utiliser comme
  // champ de formulaire (ex. via <Controller> de react-hook-form). Le trigger
  // affiche alors l'élément sélectionné ; `triggerLabel` sert de placeholder.
  value?: string
}

export function Picker<T>({
  items,
  onSelect,
  getKey,
  getSearchText,
  renderItem,
  triggerLabel,
  searchPlaceholder = 'Rechercher…',
  emptyLabel = 'Aucun résultat.',
  disabled = false,
  value,
}: PickerProps<T>) {
  const [open, setOpen] = useState(false)
  const selected = value !== undefined ? items.find((item) => getKey(item) === value) : undefined

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        disabled={disabled}
        className={clsxm(
          'flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-left text-sm',
          'hover:border-primary focus-visible:border-primary focus-visible:outline-none',
          'data-[state=open]:border-primary disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        <Search className="size-4 shrink-0 text-text-muted" />
        <span className={clsxm('flex-1 truncate', selected ? 'text-text' : 'text-text-subtle')}>
          {selected ? renderItem(selected) : triggerLabel}
        </span>
        <ChevronDown className="size-4 shrink-0 text-text-muted" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border bg-surface shadow-lg"
        >
          <Command filter={commandFilter}>
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-text-muted" />
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
                  onSelect={() => {
                    onSelect(item)
                    setOpen(false)
                  }}
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
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
