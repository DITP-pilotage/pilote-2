import { type ReactNode } from 'react'

import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { type Kind } from '@/lib/axeArbre'

export function Definition({
  term,
  kind,
  example,
  children,
}: {
  term: string
  kind?: Kind
  example?: string | undefined
  children: ReactNode
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 font-medium text-text">
        {kind ? <KindMarker kind={kind} shape="large-dot" /> : null}
        {term}
      </dt>
      <dd className="text-text-muted">
        {children}
        {example ? <span className="text-text-subtle"> Ex. : {example}.</span> : null}
      </dd>
    </div>
  )
}
