import { type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

export function TableurHeaderCell({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <th
      className={clsxm(
        'sticky top-0 z-20 border-r border-b border-r-border border-b-border-strong bg-surface-muted px-3 py-2 text-xs font-semibold whitespace-nowrap text-text-muted',
        className,
      )}
    >
      {children}
    </th>
  )
}
