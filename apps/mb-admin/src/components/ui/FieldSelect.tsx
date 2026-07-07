import type { ReactNode, Ref, SelectHTMLAttributes } from 'react'

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
  ref,
  ...props
}: FieldSelectProps) {
  return (
    <Field label={label} required={required} hint={hint} error={error} hideLabel={hideLabel}>
      <select
        ref={ref}
        className={clsxm(
          'w-full rounded-md border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </Field>
  )
}
