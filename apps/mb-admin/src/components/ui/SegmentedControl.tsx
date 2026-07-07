import { useId } from 'react'
import { RadioGroup } from 'radix-ui'

import { Field } from '@/components/ui/Field'
import { clsxm } from '@/lib/clsxm'

export type SegmentedControlOption<T extends string> = {
  value: T
  label: string
}

// Bascule segmentée (type toggle) basée sur radix RadioGroup : navigation clavier
// aux flèches ←/→ et rôle `radiogroup` natifs, contrairement à une rangée de
// `<button>`. Pour des choix courts et exclusifs (ex. visibilité PUBLIC/PRIVÉ).
export function SegmentedControl<T extends string>({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string
  value: T
  onValueChange: (value: T) => void
  options: readonly SegmentedControlOption<T>[]
}) {
  const labelId = useId()

  return (
    <Field label={label} labelId={labelId}>
      <RadioGroup.Root
        aria-labelledby={labelId}
        value={value}
        onValueChange={(next) => onValueChange(next as T)}
        className="flex overflow-hidden rounded-md border border-border text-sm"
      >
        {options.map((option) => (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            className={clsxm(
              'flex-1 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              value === option.value ? 'bg-primary font-semibold text-white' : 'text-text-muted',
            )}
          >
            {option.label}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </Field>
  )
}
