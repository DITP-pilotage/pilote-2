import type { ReactNode } from 'react'

type FormFieldProps = {
  label: ReactNode
  htmlFor: string
  children: ReactNode
}

export function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
