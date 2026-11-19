import { AlertTriangle } from 'lucide-react'
import { type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

export function Note({
  children,
  tone = 'info',
  icon,
}: {
  children: ReactNode
  tone?: 'warning' | 'info'
  icon?: ReactNode
}) {
  return (
    <div
      className={clsxm(
        'flex gap-2 rounded-md px-3 py-2.5 text-xs leading-relaxed',
        tone === 'warning' ? 'bg-warning-tinted text-warning' : 'bg-surface-tinted text-text',
      )}
    >
      <span className="mt-px shrink-0">{icon ?? <AlertTriangle className="size-3.5" />}</span>
      <span>{children}</span>
    </div>
  )
}
