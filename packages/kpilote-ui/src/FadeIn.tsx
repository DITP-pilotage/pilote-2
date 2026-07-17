import type { ReactNode } from 'react'

import { clsxm } from './clsxm'

type FadeInProps = { children: ReactNode; delayMs?: number; className?: string }

export function FadeIn({ children, delayMs = 0, className }: FadeInProps) {
  return (
    <div
      className={clsxm('motion-safe:animate-[fadeInUp_.4s_ease-out_both]', className)}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}
