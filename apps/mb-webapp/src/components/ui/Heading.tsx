import { createElement, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type Size = 'sm' | 'md' | 'lg' | 'xl'
type Tone = 'neutral' | 'muted'
type As = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'

type HeadingProps = {
  size?: Size
  as?: As
  tone?: Tone
  children: ReactNode
  className?: string
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-semibold',
  xl: 'text-3xl font-semibold',
}

const toneClasses: Record<Tone, string> = {
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
    { className: clsxm(sizeClasses[size], toneClasses[tone], className) },
    children,
  )
}
