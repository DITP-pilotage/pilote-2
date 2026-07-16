import type { ReactNode } from 'react'

import { Heading, Text } from '@pilote/kpilote-ui/Typography'
import { clsxm } from '@/lib/clsxm'

type Tone = 'neutral' | 'positive' | 'negative' | 'muted' | 'primary'

type StatCardProps = {
  label: ReactNode
  value: ReactNode
  caption?: ReactNode
  tone?: Tone
}

const toneClasses: Record<Tone, string> = {
  neutral: 'text-text',
  positive: 'text-emerald-600',
  negative: 'text-rose-600',
  muted: 'text-text-muted',
  primary: 'text-primary',
}

export function StatCard({ label, value, caption, tone = 'neutral' }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-tinted p-6 sm:p-8">
      <Text as="span" variant="kicker">
        {label}
      </Text>
      <Heading as="p" size="display-md" className={clsxm(toneClasses[tone])}>
        {value}
      </Heading>
      {caption && (
        <Text variant="caption" tone="muted">
          {caption}
        </Text>
      )}
    </div>
  )
}
