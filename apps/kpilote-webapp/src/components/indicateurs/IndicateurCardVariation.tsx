import { type SensSouhaite, type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type DerniereValeurApiModel } from '@pilote/kpilote-shared/valeurAvancement'

import { IndicateurCardRow } from '@/components/indicateurs/IndicateurCardRow'
import { Pill } from '@pilote/kpilote-ui/Pill'
import { formatDifferenceFr, formatMonthYearNumericFr, formatNumberFr } from '@/lib/format'
import {
  describeVariation,
  TEXT_CLASS_BY_INTERPRETATION,
  TONE_BY_INTERPRETATION,
} from '@/lib/variation'

// Les deux lignes restent en place même sans valeur précédente : les cartes
// voisines restent alignées et aucune évolution n'est inventée.
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
  const lecture =
    variation === null ? null : { variation, ...describeVariation({ variation, sensSouhaite }) }
  return (
    <div className="flex flex-col gap-2">
      <IndicateurCardRow label="Évolution">
        {lecture === null ? (
          <span className="text-text-muted">{derniereValeur ? 'Non disponible' : '-'}</span>
        ) : (
          <>
            <span className="font-semibold tabular-nums text-text">
              <span
                aria-hidden="true"
                className={TEXT_CLASS_BY_INTERPRETATION[lecture.interpretation]}
              >
                {lecture.arrow}
              </span>{' '}
              {formatDifferenceFr(lecture.variation, unite)}
            </span>
            {/* Forme du badge DSFR : coins peu arrondis, capitales. */}
            <Pill
              tone={TONE_BY_INTERPRETATION[lecture.interpretation]}
              className="rounded px-1.5 py-0.5"
            >
              {lecture.label}
            </Pill>
          </>
        )}
      </IndicateurCardRow>
      <IndicateurCardRow label="Valeur précédente">
        {precedente ? (
          <>
            <span className="font-semibold tabular-nums text-text">
              {formatNumberFr(precedente.valeur, unite)}
            </span>
            <span className="text-xs tabular-nums text-text-muted">
              {formatMonthYearNumericFr(precedente.date)}
            </span>
          </>
        ) : (
          <span className="text-text-muted">-</span>
        )}
      </IndicateurCardRow>
    </div>
  )
}
