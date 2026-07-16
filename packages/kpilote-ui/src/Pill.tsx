import { type ReactNode } from 'react'

import { clsxm } from './clsxm'

type PillTone = 'success' | 'warning' | 'neutral'

const pillToneClasses: Record<PillTone, string> = {
  success: 'bg-success-tinted text-success',
  warning: 'bg-warning-tinted text-warning',
  neutral: 'bg-surface-muted text-text-muted',
}

// Pastille tintée générique (tendance, écart à la médiane…). Reprend le pattern
// de `BadgeStatut` : bord arrondi, fond tinté + texte de la même famille de couleur.
export function Pill({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: PillTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={clsxm(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
        pillToneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
