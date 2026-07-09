import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'

import { ProgressBar } from '@/components/ui/ProgressBar'
import { Text } from '@/components/ui/Typography'
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
        <Text variant="kicker" tone="subtle" as="p">
          Progression
        </Text>
        <span className="text-sm font-bold tabular-nums text-text">{formatNumberFr(taux)} %</span>
      </div>
      <ProgressBar
        value={taux}
        label={`Progression vers l'objectif : ${formatNumberFr(taux)} %`}
        className="mt-2"
      />
      <Text variant="caption" tone="subtle" className="mt-2 text-right">
        Objectif :{' '}
        <span className="font-semibold text-text-muted">
          {formatNumberAvecUniteFr(valeurCible, unite)}
        </span>{' '}
        · au {formatDateFr(dateCible)}
      </Text>
    </div>
  )
}
