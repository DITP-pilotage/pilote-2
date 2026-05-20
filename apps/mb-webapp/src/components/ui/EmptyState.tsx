import type { ReactNode } from 'react'

import { Text } from '@/components/ui/Typography'

type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="space-y-1 py-8 text-center">
      <Text weight="medium">{title}</Text>
      {description && <Text tone="muted">{description}</Text>}
    </div>
  )
}
