import type { ReactNode } from 'react'

import { Heading, Text } from './Typography'
import { clsxm } from './clsxm'

type SectionTone = 'plain' | 'tinted' | 'card'

type SectionProps = {
  kicker?: ReactNode
  title?: ReactNode
  description?: ReactNode
  toolbar?: ReactNode
  tone?: SectionTone
  children: ReactNode
}

const toneClasses: Record<SectionTone, string> = {
  plain: '',
  tinted: 'rounded-xl bg-surface-tinted p-8 sm:p-10',
  card: 'rounded-xl bg-surface p-6 sm:p-8 border border-border',
}

export function Section({
  kicker,
  title,
  description,
  toolbar,
  tone = 'card',
  children,
}: SectionProps) {
  const hasHeader = kicker || title || description || toolbar
  return (
    <section className={clsxm('space-y-6', toneClasses[tone])}>
      {hasHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {kicker && (
              <Text as="span" variant="kicker">
                {kicker}
              </Text>
            )}
            {title && (
              <Heading as="h2" size="lg">
                {title}
              </Heading>
            )}
            {description && <Text tone="muted">{description}</Text>}
          </div>
          {toolbar && <div className="shrink-0">{toolbar}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  )
}
