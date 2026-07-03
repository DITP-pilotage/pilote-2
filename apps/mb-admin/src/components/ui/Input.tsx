import type { InputHTMLAttributes, Ref } from 'react'

import { clsxm } from '@/lib/clsxm'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  required?: boolean
  hint?: string | undefined
  error?: string | undefined
  ref?: Ref<HTMLInputElement>
}

export function Input({
  label,
  required,
  hint,
  error,
  className,
  readOnly,
  ref,
  ...props
}: InputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
        {hint ? <span className="ml-2 text-xs font-normal text-text-muted">{hint}</span> : null}
      </label>
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
      {error ? <p className="mt-1 text-xs text-accent">{error}</p> : null}
    </div>
  )
}
