import { ChevronRight } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'

export function Breadcrumb({ children }: { children: ReactNode }) {
  const items = Array.isArray(children) ? (children as ReactNode[]) : [children]
  return (
    <nav
      className="mb-5 flex items-center gap-1.5 text-xs text-text-muted"
      aria-label="Fil d'Ariane"
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? <ChevronRight className="size-3 text-text-subtle" aria-hidden /> : null}
          {item}
        </Fragment>
      ))}
    </nav>
  )
}
