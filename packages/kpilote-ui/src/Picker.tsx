import { ChevronDown, Search } from 'lucide-react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { clsxm } from './clsxm'
import { PickerList } from './PickerList'

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
          <PickerList
            items={items}
            onSelect={(item) => {
              onSelect(item)
              setOpen(false)
            }}
            getKey={getKey}
            getSearchText={getSearchText}
            renderItem={renderItem}
            searchPlaceholder={searchPlaceholder}
            emptyLabel={emptyLabel}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
