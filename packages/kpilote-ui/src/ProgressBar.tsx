import { Progress } from 'radix-ui'

import { clsxm } from './clsxm'

type ProgressTone = 'primary' | 'neutral'

const trackToneClasses: Record<ProgressTone, string> = {
  primary: 'bg-primary/20',
  neutral: 'bg-text-muted/20',
}

const barToneClasses: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  neutral: 'bg-text-muted',
}

export function ProgressBar({
  value,
  label,
  tone = 'primary',
  className,
}: {
  value: number
  label: string
  tone?: ProgressTone
  className?: string
}) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <Progress.Root
      value={clamped}
      max={100}
      aria-label={label}
      className={clsxm('h-2 overflow-hidden rounded-full', trackToneClasses[tone], className)}
    >
      <Progress.Indicator
        className={clsxm(
          'h-full rounded-full transition-transform duration-300',
          barToneClasses[tone],
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </Progress.Root>
  )
}
