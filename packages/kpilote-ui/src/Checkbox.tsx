import { Check } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { useId, type ReactNode } from 'react'

import { clsxm } from './clsxm'

type CheckboxProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: ReactNode
  disabled?: boolean | undefined
  className?: string | undefined
}

export function Checkbox({ checked, onCheckedChange, label, disabled, className }: CheckboxProps) {
  const id = useId()
  return (
    <div className={clsxm('inline-flex items-center gap-2', className)}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        // Radix renvoie aussi 'indeterminate', état que ce composant n'expose pas.
        onCheckedChange={(state) => onCheckedChange(state === true)}
        disabled={disabled}
        className={clsxm(
          'flex size-4 shrink-0 items-center justify-center rounded border border-border-strong bg-surface',
          'hover:border-primary',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="size-3" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label htmlFor={id} className="text-sm text-text">
        {label}
      </label>
    </div>
  )
}
