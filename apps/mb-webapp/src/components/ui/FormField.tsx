import type { ReactNode } from 'react'

type FormFieldProps = {
  label: ReactNode
  htmlFor: string
  children: ReactNode
}

export function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={htmlFor} className="text-sm text-text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}
