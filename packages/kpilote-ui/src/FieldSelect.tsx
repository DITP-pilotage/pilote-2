import { useId, type ReactNode } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'

import { clsxm } from './clsxm'
import { Field } from './Field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'

export type FieldSelectOption = { value: string; label: ReactNode }

// Radix Select interdit une <SelectItem> de value "" (réservée au vidage). On
// mappe donc l'option « vide » (value: '') sur un sentinel interne, retraduit
// en '' vers le formulaire — permet de garder une entrée sélectionnable
// (« Aucune », « Non renseignée »…).
const EMPTY_SENTINEL = ' empty'

type FieldSelectProps<TValues extends FieldValues> = {
  control: Control<TValues>
  name: FieldPath<TValues>
  label: string
  options: readonly FieldSelectOption[]
  placeholder?: string
  required?: boolean
  hint?: string
  hideLabel?: boolean
  disabled?: boolean
  className?: string
}

// Champ select branché sur react-hook-form (Controller interne) : Field
// (label + erreur) + Select radix custom. Remplace l'ancien <select> natif.
// Pour des listes longues/recherchables, préférer un Picker.
export function FieldSelect<TValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  required,
  hint,
  hideLabel,
  disabled,
  className,
}: FieldSelectProps<TValues>) {
  const labelId = useId()
  const hasEmptyOption = options.some((option) => option.value === '')

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const radixValue =
          field.value == null || field.value === ''
            ? hasEmptyOption
              ? EMPTY_SENTINEL
              : ''
            : String(field.value)

        return (
          <Field
            label={label}
            required={required}
            hint={hint}
            hideLabel={hideLabel}
            error={fieldState.error?.message}
            labelId={labelId}
          >
            <Select
              value={radixValue}
              onValueChange={(next) => field.onChange(next === EMPTY_SENTINEL ? '' : next)}
              disabled={disabled ?? false}
            >
              <SelectTrigger
                aria-labelledby={labelId}
                className={clsxm('w-full', className)}
                onBlur={field.onBlur}
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
      }}
    />
  )
}
