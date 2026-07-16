import { ArrowRight } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type BarCardProps = {
  icon: ComponentType<{ className?: string }>
  title: string
  description: ReactNode
  tone?: 'primary' | 'danger'
  topRibbon?: ReactNode
  onClick?: () => void
}

export function BarCard({
  icon: Icon,
  title,
  description,
  tone = 'primary',
  topRibbon,
  onClick,
}: BarCardProps) {
  const danger = tone === 'danger'
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsxm(
        'group flex w-full max-w-[280px] flex-col overflow-hidden border bg-surface text-left',
        'transition-all duration-150 hover:-translate-y-0.5',
        danger
          ? 'border-[#f0d2d2] hover:border-red-marianne'
          : 'border-border hover:border-primary',
      )}
    >
      {topRibbon ? (
        <div className="flex items-center justify-center gap-1.5 bg-red-marianne px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
          {topRibbon}
        </div>
      ) : (
        <div className="h-[30px]" />
      )}
      <div className="flex flex-1 flex-col items-center px-6 pt-1.5 text-center">
        <span
          className={clsxm(
            'flex size-14 items-center justify-center rounded-full',
            danger ? 'bg-[#fdecec]' : 'bg-surface-tinted',
          )}
        >
          <Icon className={clsxm('size-6', danger ? 'text-red-marianne' : 'text-primary')} />
        </span>
        <span className={clsxm('mt-4 text-lg font-extrabold', danger && 'text-red-marianne')}>
          {title}
        </span>
        <span
          className={clsxm(
            'mt-2.5 text-sm leading-relaxed',
            danger ? 'text-[#a01419]' : 'text-text-muted',
          )}
        >
          {description}
        </span>
      </div>
      <div className="flex justify-end px-6 pb-4 pt-6">
        <ArrowRight className={clsxm('size-5', danger ? 'text-red-marianne' : 'text-primary')} />
      </div>
      <div className={clsxm('h-[5px]', danger ? 'bg-red-marianne' : 'bg-primary')} />
    </button>
  )
}
