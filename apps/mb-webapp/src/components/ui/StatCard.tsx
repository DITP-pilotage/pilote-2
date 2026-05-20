import type { ReactNode } from 'react'

import { Heading, Text } from '@/components/ui/Typography'

type Tone = 'neutral' | 'positive' | 'negative' | 'muted'

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
}

export function StatCard({ label, value, caption, tone = 'neutral' }: StatCardProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-surface p-6">
      <Text weight="medium" tone="muted">
        {label}
      </Text>
      <Heading as="p" size="xl" className={toneClasses[tone]}>
        {value}
      </Heading>
      {caption && <Text variant="caption">{caption}</Text>}
    </div>
  )
}
