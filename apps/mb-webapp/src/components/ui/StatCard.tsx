import type { ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

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
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p className={clsxm('mt-2 text-3xl font-semibold', toneClasses[tone])}>{value}</p>
      {caption && <p className="mt-1 text-xs text-text-muted">{caption}</p>}
    </div>
  )
}
