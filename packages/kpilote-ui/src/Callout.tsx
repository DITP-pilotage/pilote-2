import { Info, CircleCheck, TriangleAlert, CircleX } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import { clsxm } from './clsxm'

export type CalloutColor = 'info' | 'success' | 'warning' | 'error'

export const COULEURS_CALLOUT: readonly CalloutColor[] = ['info', 'success', 'warning', 'error']

type CalloutIcon = ComponentType<{ className?: string }>

// Source unique des variantes : rendu, menu « / » et barre des types de l'éditeur.
export const CALLOUT_VARIANTES: Record<
  CalloutColor,
  { label: string; background: string; border: string; iconColor: string; Icon: CalloutIcon }
> = {
  info: {
    label: 'Info',
    background: 'bg-surface-tinted',
    border: 'border-l-primary',
    iconColor: 'text-primary',
    Icon: Info,
  },
  success: {
    label: 'Succès',
    background: 'bg-success-tinted',
    border: 'border-l-success',
    iconColor: 'text-success',
    Icon: CircleCheck,
  },
  warning: {
    label: 'Attention',
    background: 'bg-warning-tinted',
    border: 'border-l-warning',
    iconColor: 'text-warning',
    Icon: TriangleAlert,
  },
  error: {
    label: 'Alerte',
    background: 'bg-error-tinted',
    border: 'border-l-error',
    iconColor: 'text-error',
    Icon: CircleX,
  },
}

export function Callout({
  color = 'info',
  icon,
  children,
  className,
}: {
  color?: CalloutColor
  /** Remplace l'icône de la variante, par exemple par une version cliquable. */
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  const { background, border, iconColor, Icon } = CALLOUT_VARIANTES[color]
  return (
    <div
      data-color={color}
      className={clsxm('flex items-start gap-3 border-l-4 p-4', background, border, className)}
    >
      <div className={clsxm('mt-0.5 shrink-0', iconColor)}>
        {icon ?? <Icon className="size-5" />}
      </div>
      <div className="flex-1 text-sm leading-relaxed [&_p]:mb-0">{children}</div>
    </div>
  )
}
