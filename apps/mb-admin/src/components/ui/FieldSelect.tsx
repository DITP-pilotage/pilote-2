import type { ReactNode, Ref, SelectHTMLAttributes } from 'react'

import { clsxm } from '@/lib/clsxm'

export type FieldSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  required?: boolean
  hint?: string | undefined
  error?: string | undefined
  ref?: Ref<HTMLSelectElement>
  children: ReactNode
}

// Champ select avec label + message d'erreur, jumeau de `Input`. Les `<option>`
// sont passées en enfants.
export function FieldSelect({
  label,
  required,
  hint,
  error,
  className,
  children,
  ref,
  ...props
}: FieldSelectProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
        {hint ? <span className="ml-2 text-xs font-normal text-text-muted">{hint}</span> : null}
      </label>
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
      {error ? <p className="mt-1 text-xs text-accent">{error}</p> : null}
    </div>
  )
}
