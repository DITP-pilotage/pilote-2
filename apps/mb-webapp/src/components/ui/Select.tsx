import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={clsxm(
        'inline-flex items-center justify-between gap-2 rounded border border-secondary-border bg-surface px-3 py-2 text-sm text-text',
        'hover:bg-secondary-hover',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground',
        'data-[placeholder]:text-text-muted',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 text-text-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={4}
        className={clsxm(
          'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded border border-border bg-surface shadow-md',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={clsxm(
        'relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm text-text outline-none',
        'data-[highlighted]:bg-secondary-hover',
        'data-[state=checked]:font-medium',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
