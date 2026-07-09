import { Progress } from 'radix-ui'

import { clsxm } from '@/lib/clsxm'

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className?: string
}) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <Progress.Root
      value={clamped}
      max={100}
      aria-label={label}
      className={clsxm('h-2 overflow-hidden rounded-full bg-primary/20', className)}
    >
      <Progress.Indicator
        className="h-full rounded-full bg-primary transition-transform duration-300"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </Progress.Root>
  )
}
