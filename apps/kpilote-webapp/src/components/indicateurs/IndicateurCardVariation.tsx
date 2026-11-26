import { type SensSouhaite, type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type DerniereValeurApiModel } from '@pilote/kpilote-shared/valeurAvancement'

import { Pill } from '@pilote/kpilote-ui/Pill'
import { Text } from '@pilote/kpilote-ui/Typography'
import {
  formatDifferenceFr,
  formatMonthYearNumericFr,
  formatNumberFr,
  INTERPRETATION_LABEL_FR,
} from '@/lib/format'
import { describeVariation, TONE_BY_INTERPRETATION } from '@/lib/variation'

// Le bloc garde ses deux lignes même sans valeur précédente : les cartes voisines
// restent alignées et aucune évolution n'est inventée.
export function IndicateurCardVariation({
  derniereValeur,
  unite,
  sensSouhaite,
}: {
  derniereValeur: DerniereValeurApiModel | null
  unite: UniteIndicateurApiModel | null
  sensSouhaite: SensSouhaite
}) {
  const variation = derniereValeur?.variation ?? null
  const precedente = derniereValeur?.precedente ?? null
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Text variant="kicker" tone="muted" as="p">
          Évolution
        </Text>
        {variation === null ? (
          <Text variant="body" tone="muted" className="mt-1">
            Tendance non disponible
          </Text>
        ) : (
          <VariationRow variation={variation} unite={unite} sensSouhaite={sensSouhaite} />
        )}
      </div>
      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-semibold text-text-muted">Valeur précédente</span>
        {precedente ? (
          <>
            <span className="font-bold text-text">{formatNumberFr(precedente.valeur)}</span>
            <span className="text-xs text-text-muted">
              {formatMonthYearNumericFr(precedente.date)}
            </span>
          </>
        ) : (
          <span className="font-bold text-text-muted">-</span>
        )}
      </p>
    </div>
  )
}

function VariationRow({
  variation,
  unite,
  sensSouhaite,
}: {
  variation: number
  unite: UniteIndicateurApiModel | null
  sensSouhaite: SensSouhaite
}) {
  const { arrow, direction, interpretation } = describeVariation({ variation, sensSouhaite })
  const label = INTERPRETATION_LABEL_FR[interpretation]
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-text">
        <span aria-hidden="true">{arrow}</span> {formatDifferenceFr(variation, unite)}
      </span>
      <Pill tone={TONE_BY_INTERPRETATION[interpretation]}>
        {direction}
        {label && <> · {label}</>}
      </Pill>
    </div>
  )
}
