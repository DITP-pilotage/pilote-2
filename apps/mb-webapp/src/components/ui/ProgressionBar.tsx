import { Progress } from 'radix-ui'

import { formatNumberFr } from '@/lib/format'

export function ProgressionBar({ taux }: { taux: number }) {
  return (
    <span className="flex items-center gap-2">
      <Progress.Root
        value={taux}
        max={100}
        className="flex-1 h-2 rounded-full overflow-hidden bg-primary/20"
      >
        <Progress.Indicator
          className="h-full bg-primary transition-transform duration-300"
          style={{ transform: `translateX(-${100 - taux}%)` }}
        />
      </Progress.Root>
      <span className="text-sm font-medium tabular-nums shrink-0 text-primary">
        {formatNumberFr(taux)} %
      </span>
    </span>
  )
}
