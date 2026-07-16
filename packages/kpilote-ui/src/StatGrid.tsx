import type { ReactNode } from 'react'

import { clsxm } from './clsxm'

type StatGridProps = {
  columns?: 2 | 3 | 4
  children: ReactNode
}

const columnClasses = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const

export function StatGrid({ columns = 3, children }: StatGridProps) {
  return <div className={clsxm('grid gap-4', columnClasses[columns])}>{children}</div>
}
