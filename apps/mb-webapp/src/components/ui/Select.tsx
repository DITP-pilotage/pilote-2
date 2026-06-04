import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { clsxm } from '@/lib/clsxm'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value
export const SelectGroup = SelectPrimitive.Group

export function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={clsxm(
        'px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-subtle',
        className,
      )}
      {...props}
    />
  )
}

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={clsxm(
        'inline-flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text',
        'hover:border-border-strong',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground',
        'data-[placeholder]:font-normal data-[placeholder]:text-text-subtle',
        'data-[state=open]:border-primary',
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
        sideOffset={6}
        className={clsxm(
          'z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="max-h-[var(--radix-select-content-available-height)] overflow-y-auto p-1.5">
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
        'relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm text-text outline-none',
        'data-[highlighted]:bg-surface-tinted data-[highlighted]:text-primary',
        'data-[state=checked]:bg-primary-tinted data-[state=checked]:font-semibold data-[state=checked]:text-primary',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
