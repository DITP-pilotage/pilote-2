import type { ReactNode } from 'react'

import { Body } from '@/components/ui/Body'
import { Heading } from '@/components/ui/Heading'

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
      <Body weight="medium" tone="muted">
        {label}
      </Body>
      <Heading as="p" size="xl" className={toneClasses[tone]}>
        {value}
      </Heading>
      {caption && <Body variant="caption">{caption}</Body>}
    </div>
  )
}
