import { ChevronDown } from 'lucide-react'
import { useId, type ReactNode, type Ref, type SelectHTMLAttributes } from 'react'

import { Field } from '@/components/ui/Field'
import { clsxm } from '@/lib/clsxm'

export type FieldSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  required?: boolean
  hint?: string | undefined
  error?: string | undefined
  hideLabel?: boolean
  ref?: Ref<HTMLSelectElement>
  children: ReactNode
}

// Champ select avec label + message d'erreur, jumeau de `FieldInput`. Les
// `<option>` sont passées en enfants. `hideLabel` masque le libellé (sr-only)
// pour les selects en grille où l'intitulé est implicite.
export function FieldSelect({
  label,
  required,
  hint,
  error,
  hideLabel,
  className,
  children,
  id,
  ref,
  ...props
}: FieldSelectProps) {
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
      <div className="relative">
        <select
          id={fieldId}
          ref={ref}
          className={clsxm(
            'w-full appearance-none rounded-md border border-border bg-white px-3 py-2.5 pr-9 text-sm focus:border-primary focus:outline-none',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
      </div>
    </Field>
  )
}
