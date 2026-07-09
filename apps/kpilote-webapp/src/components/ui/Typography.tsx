import { createElement, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type HeadingSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'display-sm'
  | 'display-md'
  | 'display-lg'
  | 'display-xl'
type HeadingTone = 'neutral' | 'muted' | 'primary'
type HeadingAs = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'

type HeadingProps = {
  size?: HeadingSize
  as?: HeadingAs
  tone?: HeadingTone
  children: ReactNode
  className?: string
}

const headingSizeClasses: Record<HeadingSize, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-lg font-semibold',
  lg: 'text-2xl font-semibold tracking-tight sm:text-3xl',
  xl: 'text-3xl font-bold tracking-tight sm:text-4xl',
  'display-sm': 'text-3xl font-bold tracking-tight sm:text-display-sm',
  'display-md': 'text-display-sm sm:text-display-md',
  'display-lg': 'text-display-md sm:text-display-lg',
  'display-xl': 'text-display-lg sm:text-display-xl',
}

const headingToneClasses: Record<HeadingTone, string> = {
  neutral: 'text-text',
  muted: 'text-text-muted',
  primary: 'text-primary',
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

type TextVariant = 'body' | 'lead' | 'caption' | 'kicker'
type TextTone = 'neutral' | 'muted' | 'subtle' | 'primary' | 'positive' | 'negative'
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
  body: 'text-sm leading-relaxed',
  lead: 'text-lg leading-relaxed',
  caption: 'text-xs leading-normal',
  kicker: 'text-xs uppercase tracking-[0.12em] font-semibold',
}

const textToneClasses: Record<TextTone, string> = {
  neutral: 'text-text',
  muted: 'text-text-muted',
  subtle: 'text-text-subtle',
  primary: 'text-primary',
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
  lead: { tone: 'muted', weight: 'normal' },
  caption: { tone: 'muted', weight: 'normal' },
  kicker: { tone: 'primary', weight: 'semibold' },
}

export function Text({ variant = 'body', tone, weight, as = 'p', children, className }: TextProps) {
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
