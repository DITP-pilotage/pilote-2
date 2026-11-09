import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'

import { ProgressBar } from '@pilote/kpilote-ui/ProgressBar'
import { Text } from '@pilote/kpilote-ui/Typography'
import { formatMonthYearNumericFr, formatNumberAvecUniteFr, formatNumberFr } from '@/lib/format'

// `taux` vaut null quand l'API ne calcule pas de taux alors qu'un objectif existe
// (indicateur à la baisse, cible à 0) : on garde le bloc et l'objectif, avec « — »
// et sans barre — une barre vide se lirait « 0 % ».
export function IndicateurProgression({
  taux,
  valeurCible,
  dateCible,
  unite,
}: {
  taux: number | null
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
        {taux === null ? (
          <span className="text-sm font-bold tabular-nums text-text-muted">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Progression non disponible</span>
          </span>
        ) : (
          <span className="text-sm font-bold tabular-nums text-text-muted">
            {formatNumberFr(taux)} %
          </span>
        )}
      </div>
      {taux !== null && (
        <ProgressBar
          value={taux}
          tone="neutral"
          label={`Progression vers l'objectif : ${formatNumberFr(taux)} %`}
          className="mt-2"
        />
      )}
      <div className="mt-2 text-right">
        <Text variant="caption" tone="muted">
          Objectif :{' '}
          <span className="font-semibold text-text-muted">
            {formatNumberAvecUniteFr(valeurCible, unite)}
          </span>
        </Text>
        <Text variant="caption" tone="muted">
          {formatMonthYearNumericFr(dateCible)}
        </Text>
      </div>
    </div>
  )
}
