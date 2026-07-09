import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'

import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatNumberAvecUniteFr, formatNumberFr } from '@/lib/format'

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
        <ProgressBar
          value={taux}
          label={`Progression vers l'objectif : ${formatNumberFr(taux)} %`}
          className="flex-1"
        />
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
