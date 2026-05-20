import { createElement, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type Variant = 'body' | 'caption' | 'kicker'
type Tone = 'neutral' | 'muted' | 'positive' | 'negative'
type Weight = 'normal' | 'medium' | 'semibold'
type As = 'p' | 'span' | 'div' | 'label' | 'dt' | 'dd' | 'li'

type BodyProps = {
  variant?: Variant
  tone?: Tone
  weight?: Weight
  as?: As
  children: ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  body: 'text-sm',
  caption: 'text-xs',
  kicker: 'text-xs uppercase tracking-wide',
}

const toneClasses: Record<Tone, string> = {
  neutral: 'text-text',
  muted: 'text-text-muted',
  positive: 'text-emerald-600',
  negative: 'text-rose-600',
}

const weightClasses: Record<Weight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
}

const variantDefaults: Record<Variant, { tone: Tone; weight: Weight }> = {
  body: { tone: 'neutral', weight: 'normal' },
  caption: { tone: 'muted', weight: 'normal' },
  kicker: { tone: 'muted', weight: 'medium' },
}

export function Body({ variant = 'body', tone, weight, as = 'p', children, className }: BodyProps) {
  const defaults = variantDefaults[variant]
  return createElement(
    as,
    {
      className: clsxm(
        variantClasses[variant],
        toneClasses[tone ?? defaults.tone],
        weightClasses[weight ?? defaults.weight],
        className,
      ),
    },
    children,
  )
}
