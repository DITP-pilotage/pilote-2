import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'

import { ProgressBar } from '@pilote/kpilote-ui/ProgressBar'
import { Text } from '@pilote/kpilote-ui/Typography'
import { formatDateFr, formatNumberAvecUniteFr, formatNumberFr } from '@/lib/format'

export function IndicateurProgression({
  taux,
  valeurCible,
  dateCible,
  unite,
}: {
  taux: number
  valeurCible: number
  dateCible: string
  unite: UniteIndicateurApiModel | null
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Text variant="kicker" tone="muted" as="p">
          Progression
        </Text>
        <span className="text-sm font-bold tabular-nums text-text-muted">
          {formatNumberFr(taux)} %
        </span>
      </div>
      <ProgressBar
        value={taux}
        tone="neutral"
        label={`Progression vers l'objectif : ${formatNumberFr(taux)} %`}
        className="mt-2"
      />
      <div className="mt-2 text-right">
        <Text variant="caption" tone="muted">
          Objectif :{' '}
          <span className="font-semibold text-text-muted">
            {formatNumberAvecUniteFr(valeurCible, unite)}
          </span>
        </Text>
        <Text variant="caption" tone="muted">
          {formatDateFr(dateCible)}
        </Text>
      </div>
    </div>
  )
}
