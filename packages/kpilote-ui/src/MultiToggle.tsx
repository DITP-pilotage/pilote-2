import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

import { clsxm } from './clsxm'

export type MultiToggleOption<TValue extends string> = {
  value: TValue
  label: ReactNode
}

type MultiToggleProps<TValue extends string> = {
  value: TValue[]
  onValueChange: (value: TValue[]) => void
  options: readonly MultiToggleOption<TValue>[]
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function MultiToggle<TValue extends string>({
  value,
  onValueChange,
  options,
  disabled,
  className,
  ...aria
}: MultiToggleProps<TValue>) {
  return (
    <ToggleGroupPrimitive.Root
      type="multiple"
      value={value}
      onValueChange={(next) => onValueChange(next as TValue[])}
      disabled={disabled ?? false}
      aria-label={aria['aria-label']}
      aria-labelledby={aria['aria-labelledby']}
      className={clsxm('inline-flex items-center gap-2', className)}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={clsxm(
            'inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-muted transition-colors',
            'hover:border-primary',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
            'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
          )}
        >
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
