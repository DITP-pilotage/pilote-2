import type { ReactNode } from 'react'

import { Heading, Text } from '@/components/ui/Typography'

type PageProps = {
  kicker?: ReactNode
  title: ReactNode
  description?: ReactNode
  back?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function Page({ kicker, title, description, back, actions, children }: PageProps) {
  return (
    <div className="space-y-2 sm:space-y-4">
      {back && <div>{back}</div>}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-4">
          {kicker && (
            <Text as="span" variant="kicker">
              {kicker}
            </Text>
          )}
          <Heading as="h1" size="display-lg" className="text-balance">
            {title}
          </Heading>
          {description && (
            <Text variant="lead" tone="muted" className="text-balance">
              {description}
            </Text>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
      </header>
      <div className="space-y-10 sm:space-y-12">{children}</div>
    </div>
  )
}
