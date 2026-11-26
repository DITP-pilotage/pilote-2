import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type ComponentProps } from 'react'

import { ProgressBar } from '@pilote/kpilote-ui/ProgressBar'
import { Text } from '@pilote/kpilote-ui/Typography'
import { formatMonthYearNumericFr, formatNumberFr } from '@/lib/format'

// `taux` vaut null quand l'API ne calcule pas de taux alors qu'un objectif existe
// (indicateur à la baisse, cible à 0) : on garde le bloc et l'objectif, avec « - »
// et sans barre, car une barre vide se lirait « 0 % ».
export function IndicateurProgression({
  taux,
  valeurCible,
  dateCible,
  unite,
  label = 'Progression',
  tone = 'neutral',
  compact = false,
}: {
  taux: number | null
  valeurCible: number
  dateCible: string
  unite: UniteIndicateurApiModel | null
  label?: string
  tone?: ComponentProps<typeof ProgressBar>['tone']
  // Objectif et date sur une seule ligne : le bloc garde la même hauteur qu'avec
  // « Pas de cible », les cartes voisines restent alignées.
  compact?: boolean
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Text variant="kicker" tone="muted" as="p">
          {label}
        </Text>
        {taux === null ? (
          <span className="text-sm font-bold tabular-nums text-text-muted">
            <span aria-hidden="true">-</span>
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
          tone={tone}
          label={`Progression vers l'objectif : ${formatNumberFr(taux)} %`}
          className="mt-2"
        />
      )}
      <div className="mt-2 text-right">
        <Text variant="caption" tone="muted">
          Objectif :{' '}
          <span className="font-semibold text-text-muted">
            {formatNumberFr(valeurCible, unite)}
          </span>
          {compact && <> · {formatMonthYearNumericFr(dateCible)}</>}
        </Text>
        {!compact && (
          <Text variant="caption" tone="muted">
            {formatMonthYearNumericFr(dateCible)}
          </Text>
        )}
      </div>
    </div>
  )
}
