import type { ReactNode } from 'react'

type PageProps = {
  title: ReactNode
  description?: ReactNode
  back?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function Page({ title, description, back, actions, children }: PageProps) {
  return (
    <div className="space-y-8">
      {back && <div>{back}</div>}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-text">{title}</h1>
          {description && <p className="text-sm text-text-muted">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="space-y-6">{children}</div>
    </div>
  )
}
