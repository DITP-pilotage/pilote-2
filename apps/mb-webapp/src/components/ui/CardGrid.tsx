import type { ReactNode } from 'react'

type CardGridProps = {
  children: ReactNode
}

export function CardGrid({ children }: CardGridProps) {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}
