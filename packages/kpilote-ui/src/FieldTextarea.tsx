import { useId, type Ref, type TextareaHTMLAttributes } from 'react'

import { Field } from './Field'
import { clsxm } from './clsxm'

export type FieldTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  required?: boolean
  hint?: string | undefined
  error?: string | undefined
  hideLabel?: boolean
  ref?: Ref<HTMLTextAreaElement>
}

// Champ textarea avec label + message d'erreur, jumeau de `FieldInput` pour les
// zones de texte multi-lignes (description, méthode de calcul…).
export function FieldTextarea({
  label,
  required,
  hint,
  error,
  hideLabel,
  className,
  id,
  ref,
  ...props
}: FieldTextareaProps) {
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
      <textarea
        id={fieldId}
        ref={ref}
        className={clsxm(
          'w-full resize-y rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none',
          className,
        )}
        {...props}
      />
    </Field>
  )
}
