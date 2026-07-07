import type { Ref, TextareaHTMLAttributes } from 'react'

import { clsxm } from '@/lib/clsxm'

export type FieldTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  required?: boolean
  hint?: string | undefined
  error?: string | undefined
  ref?: Ref<HTMLTextAreaElement>
}

// Champ textarea avec label + message d'erreur, jumeau de `Input` pour les
// zones de texte multi-lignes (description, méthode de calcul…).
export function FieldTextarea({
  label,
  required,
  hint,
  error,
  className,
  ref,
  ...props
}: FieldTextareaProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
        {hint ? <span className="ml-2 text-xs font-normal text-text-muted">{hint}</span> : null}
      </label>
      <textarea
        ref={ref}
        className={clsxm(
          'w-full resize-y rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none',
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-accent">{error}</p> : null}
    </div>
  )
}
