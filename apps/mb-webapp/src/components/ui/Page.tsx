import type { ReactNode } from 'react'

import { Body } from '@/components/ui/Body'
import { Heading } from '@/components/ui/Heading'

type PageProps = {
  title: ReactNode
  description?: ReactNode
  back?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function Page({ title, description, back, actions, children }: PageProps) {
  return (
    <div className="space-y-8">
      {back && <div>{back}</div>}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Heading as="h1" size="lg">
            {title}
          </Heading>
          {description && <Body tone="muted">{description}</Body>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="space-y-6">{children}</div>
    </div>
  )
}
