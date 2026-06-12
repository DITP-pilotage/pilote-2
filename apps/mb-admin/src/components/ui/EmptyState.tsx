import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

import { Text } from '@/components/ui/Typography'

type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-tinted px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface text-primary">
        {icon ?? <Inbox className="size-5" aria-hidden />}
      </div>
      <Text weight="medium">{title}</Text>
      {description && <Text tone="muted">{description}</Text>}
    </div>
  )
}
