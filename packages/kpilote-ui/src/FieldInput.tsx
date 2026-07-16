import { useId, type InputHTMLAttributes, type Ref } from 'react'

import { Field } from './Field'
import { clsxm } from './clsxm'

export type FieldInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  required?: boolean
  hint?: string | undefined
  error?: string | undefined
  hideLabel?: boolean
  ref?: Ref<HTMLInputElement>
}

export function FieldInput({
  label,
  required,
  hint,
  error,
  hideLabel,
  className,
  readOnly,
  id,
  ref,
  ...props
}: FieldInputProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <Field
      label={label}
      required={required}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      htmlFor={fieldId}
    >
      <input
        id={fieldId}
        ref={ref}
        readOnly={readOnly}
        className={clsxm(
          'w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none',
          readOnly && 'bg-surface-muted text-text-muted',
          className,
        )}
        {...props}
      />
    </Field>
  )
}
