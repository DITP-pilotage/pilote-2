import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl'
import { useId } from 'react'

import { Field } from './Field'

// Variante « champ de formulaire » du SegmentedControl partagé : ajoute un label
// (via Field) associé au groupe par aria-labelledby. Pour des choix courts et
// exclusifs dans un formulaire (ex. visibilité PUBLIC/PRIVÉ, état d'une feature).
export function SegmentedField<T extends string>({
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
