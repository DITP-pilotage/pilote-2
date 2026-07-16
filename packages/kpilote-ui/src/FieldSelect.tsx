import { useId, type ReactNode } from 'react'

import { clsxm } from './clsxm'
import { Field } from './Field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'

export type FieldSelectOption = { value: string; label: ReactNode }

// Radix Select interdit une <SelectItem> de value "" (réservée au vidage). On
// mappe donc l'option « vide » (value: '') sur un sentinel interne, retraduit
// en '' en sortie — permet de garder une entrée sélectionnable (« Aucune »…).
const EMPTY_SENTINEL = ' empty'

type FieldSelectProps = {
  value: string
  onValueChange: (value: string) => void
  label: string
  options: readonly FieldSelectOption[]
  placeholder?: string | undefined
  required?: boolean | undefined
  hint?: string | undefined
  hideLabel?: boolean | undefined
  disabled?: boolean | undefined
  error?: string | undefined
  className?: string | undefined
  onBlur?: (() => void) | undefined
}

// Champ select contrôlé (value/onValueChange) : Field (label + erreur) + Select
// radix custom. S'utilise tel quel, ou dans un <Controller> RHF au call-site
// (comme les Pickers) en passant value/onValueChange/onBlur/error du field.
// Pour des listes longues/recherchables, préférer un Picker.
export function FieldSelect({
  value,
  onValueChange,
  label,
  options,
  placeholder,
  required,
  hint,
  hideLabel,
  disabled,
  error,
  className,
  onBlur,
}: FieldSelectProps) {
  const labelId = useId()
  const hasEmptyOption = options.some((option) => option.value === '')
  const radixValue = value === '' ? (hasEmptyOption ? EMPTY_SENTINEL : '') : value

  return (
    <Field
      label={label}
      required={required}
      hint={hint}
      hideLabel={hideLabel}
      error={error}
      labelId={labelId}
    >
      <Select
        value={radixValue}
        onValueChange={(next) => onValueChange(next === EMPTY_SENTINEL ? '' : next)}
        disabled={disabled ?? false}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          className={clsxm('w-full', className)}
          onBlur={onBlur}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value === '' ? EMPTY_SENTINEL : option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
