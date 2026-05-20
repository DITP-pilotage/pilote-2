import type { ReactNode } from 'react'

type SectionProps = {
  title?: ReactNode
  description?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
}

export function Section({ title, description, toolbar, children }: SectionProps) {
  const hasHeader = title || description || toolbar
  return (
    <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
      {hasHeader && (
        <div className="space-y-3">
          {(title || description) && (
            <div className="space-y-1">
              {title && <h2 className="text-base font-semibold text-text">{title}</h2>}
              {description && <p className="text-sm text-text-muted">{description}</p>}
            </div>
          )}
          {toolbar && <div>{toolbar}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  )
}
