import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
    </div>
  )
}
