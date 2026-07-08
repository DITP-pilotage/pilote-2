import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

export type SegmentedControlOption<TValue extends string> = {
  value: TValue
  label: ReactNode
  icon?: ReactNode
}

type SegmentedControlProps<TValue extends string> = {
  value: TValue
  onValueChange: (value: TValue) => void
  options: SegmentedControlOption<TValue>[]
  'aria-label': string
  className?: string
}

export function SegmentedControl<TValue extends string>({
  value,
  onValueChange,
  options,
  className,
  ...props
}: SegmentedControlProps<TValue>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        // Radix renvoie une chaîne vide quand on reclique le segment actif : on ignore pour rester non-déselectionnable
        if (next) onValueChange(next as TValue)
      }}
      aria-label={props['aria-label']}
      className={clsxm(
        'inline-flex items-center gap-1 rounded-lg border border-border bg-surface-tinted p-1',
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={clsxm(
            'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-text-muted transition-colors',
            'hover:text-text',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:font-semibold data-[state=on]:shadow-sm',
            '[&_svg]:size-4 [&_svg]:shrink-0',
          )}
        >
          {option.icon}
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
