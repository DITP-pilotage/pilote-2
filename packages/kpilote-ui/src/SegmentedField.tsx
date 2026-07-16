import { useId } from 'react'

import { Field } from './Field'
import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl'

type SegmentedFieldProps<T extends string> = {
  label: string
  value: T
  onValueChange: (value: T) => void
  options: readonly SegmentedControlOption<T>[]
  required?: boolean | undefined
  hint?: string | undefined
  hideLabel?: boolean | undefined
  error?: string | undefined
}

// Champ « bascule segmentée » contrôlé (value/onValueChange) : Field (label +
// erreur) + SegmentedControl partagé, associés par aria-labelledby. S'utilise
// tel quel hors formulaire, ou dans un <Controller> RHF au call-site (comme les
// Pickers) en passant error={fieldState.error?.message}.
export function SegmentedField<T extends string>({
  label,
  value,
  onValueChange,
  options,
  required,
  hint,
  hideLabel,
  error,
}: SegmentedFieldProps<T>) {
  const labelId = useId()

  return (
    <Field
      label={label}
      required={required}
      hint={hint}
      hideLabel={hideLabel}
      error={error}
      labelId={labelId}
    >
      <SegmentedControl
        aria-labelledby={labelId}
        value={value}
        onValueChange={onValueChange}
        options={options}
        className="w-full"
      />
    </Field>
  )
}
