import type { ReactNode } from 'react'

import { Body } from '@/components/ui/Body'

type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="space-y-1 py-8 text-center">
      <Body weight="medium">{title}</Body>
      {description && <Body tone="muted">{description}</Body>}
    </div>
  )
}
