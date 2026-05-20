import type { ReactNode } from 'react'

import { Body } from '@/components/ui/Body'
import { Heading } from '@/components/ui/Heading'

type SectionProps = {
  title?: ReactNode
  description?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
}

export function Section({ title, description, toolbar, children }: SectionProps) {
  const hasHeader = title || description || toolbar
  return (
    <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
      {hasHeader && (
        <div className="space-y-3">
          {(title || description) && (
            <div className="space-y-1">
              {title && (
                <Heading as="h2" size="md">
                  {title}
                </Heading>
              )}
              {description && <Body tone="muted">{description}</Body>}
            </div>
          )}
          {toolbar && <div>{toolbar}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  )
}
