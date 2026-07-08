import { Progress } from 'radix-ui'

import { formatNumberAvecUniteFr, formatNumberFr } from '@/lib/format'
import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'

export function ProgressionBar({
  taux,
  valeurCible,
  unite,
}: {
  taux: number
  valeurCible: number
  unite: UniteIndicateurApiModel | null
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Progress.Root
          value={taux}
          max={100}
          aria-label={`Progression vers l'objectif : ${formatNumberFr(taux)} %`}
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
      </div>
      <span className="text-xs text-text-muted text-right">
        Objectif : {formatNumberAvecUniteFr(valeurCible, unite)}
      </span>
    </div>
  )
}
