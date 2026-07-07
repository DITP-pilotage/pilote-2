import type { InputHTMLAttributes, Ref } from 'react'

import { Field } from '@/components/ui/Field'
import { clsxm } from '@/lib/clsxm'

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
  ref,
  ...props
}: FieldInputProps) {
  return (
    <Field label={label} required={required} hint={hint} error={error} hideLabel={hideLabel}>
      <input
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
