import { Info, CircleCheck, TriangleAlert, CircleX } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import { clsxm } from '../clsxm'
import type { CalloutColor } from './types'

const variantes: Record<
  CalloutColor,
  { conteneur: string; icone: string; Icone: ComponentType<{ className?: string }> }
> = {
  info: { conteneur: 'bg-surface-tinted border-l-primary', icone: 'text-primary', Icone: Info },
  success: {
    conteneur: 'bg-success-tinted border-l-success',
    icone: 'text-success',
    Icone: CircleCheck,
  },
  warning: {
    conteneur: 'bg-warning-tinted border-l-warning',
    icone: 'text-warning',
    Icone: TriangleAlert,
  },
  error: { conteneur: 'bg-error-tinted border-l-error', icone: 'text-error', Icone: CircleX },
}

export function Callout({
  color = 'info',
  children,
  className,
}: {
  color?: CalloutColor
  children: ReactNode
  className?: string
}) {
  const variante = variantes[color]
  return (
    <div
      data-color={color}
      className={clsxm('flex items-start gap-3 border-l-4 p-4', variante.conteneur, className)}
    >
      <variante.Icone className={clsxm('mt-0.5 size-5 shrink-0', variante.icone)} />
      <div className="flex-1 text-sm leading-relaxed [&_p]:mb-0">{children}</div>
    </div>
  )
}
