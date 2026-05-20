import { createElement, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type HeadingSize = 'sm' | 'md' | 'lg' | 'xl'
type HeadingTone = 'neutral' | 'muted'
type HeadingAs = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'

type HeadingProps = {
  size?: HeadingSize
  as?: HeadingAs
  tone?: HeadingTone
  children: ReactNode
  className?: string
}

const headingSizeClasses: Record<HeadingSize, string> = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-semibold',
  xl: 'text-3xl font-semibold',
}

const headingToneClasses: Record<HeadingTone, string> = {
  neutral: 'text-text',
  muted: 'text-text-muted',
}

export function Heading({
  size = 'md',
  as = 'h2',
  tone = 'neutral',
  children,
  className,
}: HeadingProps) {
  return createElement(
    as,
    { className: clsxm(headingSizeClasses[size], headingToneClasses[tone], className) },
    children,
  )
}

type TextVariant = 'body' | 'caption' | 'kicker'
type TextTone = 'neutral' | 'muted' | 'positive' | 'negative'
type TextWeight = 'normal' | 'medium' | 'semibold'
type TextAs = 'p' | 'span' | 'div' | 'label' | 'dt' | 'dd' | 'li'

type TextProps = {
  variant?: TextVariant
  tone?: TextTone
  weight?: TextWeight
  as?: TextAs
  children: ReactNode
  className?: string
}

const textVariantClasses: Record<TextVariant, string> = {
  body: 'text-sm',
  caption: 'text-xs',
  kicker: 'text-xs uppercase tracking-wide',
}

const textToneClasses: Record<TextTone, string> = {
  neutral: 'text-text',
  muted: 'text-text-muted',
  positive: 'text-emerald-600',
  negative: 'text-rose-600',
}

const textWeightClasses: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
}

const textVariantDefaults: Record<TextVariant, { tone: TextTone; weight: TextWeight }> = {
  body: { tone: 'neutral', weight: 'normal' },
  caption: { tone: 'muted', weight: 'normal' },
  kicker: { tone: 'muted', weight: 'medium' },
}

export function Text({
  variant = 'body',
  tone,
  weight,
  as = 'p',
  children,
  className,
}: TextProps) {
  const defaults = textVariantDefaults[variant]
  return createElement(
    as,
    {
      className: clsxm(
        textVariantClasses[variant],
        textToneClasses[tone ?? defaults.tone],
        textWeightClasses[weight ?? defaults.weight],
        className,
      ),
    },
    children,
  )
}
