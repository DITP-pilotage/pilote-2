import { type SensSouhaite, type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import {
  type Interpretation,
  interpretDifference,
  interpretExtremes,
} from '@pilote/kpilote-shared/interpretation'
import { useSuspenseQueries } from '@tanstack/react-query'

import { IndicateurProgression } from '@/components/indicateurs/IndicateurProgression'
import { Pill, type PillTone } from '@pilote/kpilote-ui/Pill'
import { Heading, Text } from '@pilote/kpilote-ui/Typography'
import { clsxm } from '@/lib/clsxm'
import {
  displayedDifferenceSign,
  formatDifferenceFr,
  formatMonthYearNumericFr,
  formatNumberFr,
} from '@/lib/format'
import {
  indicateurSyntheseIndividuQueryOptions,
  indicateurTauxProgressionQueryOptions,
  indicateurValeursQueryOptions,
  indicateurValeursRemarquablesQueryOptions,
} from '@/queries/indicateurs'

type DatedValue = { date: string; valeur: number }

// Série mensuelle triée du plus récent au plus ancien : [0] = dernière valeur,
// [1] = valeur précédente. La « valeur précédente » du ticket est dérivée ici,
// sans appel API dédié (la série est déjà en cache).
const sortByDateDesc = (items: ReadonlyArray<DatedValue>): DatedValue[] =>
  [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

// Lecture selon le sens souhaité (PIL-1778) : vert favorable, rouge défavorable,
// bleu neutre. Le mot affiché porte la même information sans la couleur (RGAA 3.1).
const TONE_BY_INTERPRETATION: Record<Interpretation, PillTone> = {
  favorable: 'success',
  unfavorable: 'error',
  neutral: 'info',
}

const TEXT_CLASS_BY_INTERPRETATION: Record<Interpretation, string> = {
  favorable: 'text-success',
  unfavorable: 'text-error',
  neutral: 'text-blue-cumulus',
}

const INTERPRETATION_LABEL: Record<Interpretation, string | null> = {
  favorable: 'favorable',
  unfavorable: 'défavorable',
  neutral: null,
}

type IndicateurSynthesePanelProps = {
  indicateurId: string
  referentielId: string
  individuId: string
  unite: UniteIndicateurApiModel | null
  sensSouhaite: SensSouhaite
  referentielNom: string | null
}

export function IndicateurSynthesePanel({
  indicateurId,
  referentielId,
  individuId,
  unite,
  sensSouhaite,
  referentielNom,
}: IndicateurSynthesePanelProps) {
  const [{ data: remarquables }, { data: synthese }, { data: valeurs }, { data: tauxProgression }] =
    useSuspenseQueries({
      queries: [
        indicateurValeursRemarquablesQueryOptions(indicateurId, referentielId),
        indicateurSyntheseIndividuQueryOptions(indicateurId, individuId),
        indicateurValeursQueryOptions(indicateurId, individuId),
        indicateurTauxProgressionQueryOptions(indicateurId, individuId),
      ],
    })

  const series = sortByDateDesc(valeurs.items)
  const latest = series[0]
  const previous = series[1]

  const variation = synthese.items[0]?.variation ?? null
  const ecartMediane = synthese.items[0]?.ecartMediane ?? null
  const stats = remarquables.items[0] ?? { min: null, max: null, mediane: null }

  const lastPoint = tauxProgression.items[tauxProgression.items.length - 1]
  const taux = lastPoint?.tauxProgression ?? null

  const extremes = interpretExtremes({
    sensSouhaite,
    sameValue: stats.min !== null && stats.min === stats.max,
  })

  return (
    <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:grid sm:grid-cols-[1fr_1px_1fr] sm:items-start sm:gap-x-11">
        {/* Gauche — la valeur, sa trajectoire, puis la progression */}
        <div className="flex flex-col gap-4 sm:col-start-1">
          <div>
            <Text variant="kicker" as="p">
              Valeur d&apos;avancement
            </Text>
            {latest ? (
              <>
                <Heading as="p" size="display-sm" className="mt-3 text-blue-cumulus">
                  {formatNumberFr(latest.valeur)}
                  {unite?.abbreviation && <span className="ml-2">{unite.abbreviation}</span>}
                </Heading>
                <Text variant="body" tone="subtle" className="mt-2">
                  {formatMonthYearNumericFr(latest.date)}
                </Text>
                {variation !== null && (
                  <VariationPill variation={variation} sensSouhaite={sensSouhaite} />
                )}
              </>
            ) : (
              <Heading as="p" size="display-sm" tone="muted" className="mt-3">
                —
              </Heading>
            )}

            {previous && (
              <Text variant="body" tone="muted" className="mt-3">
                <span className="font-bold">Valeur précédente :</span>{' '}
                <span className="font-semibold text-primary">
                  {formatNumberFr(previous.valeur, unite)}
                </span>{' '}
                ({formatMonthYearNumericFr(previous.date)})
              </Text>
            )}
          </div>

          {lastPoint && (
            <IndicateurProgression
              taux={taux}
              valeurCible={lastPoint.valeurCible}
              dateCible={lastPoint.dateCible}
              unite={unite}
            />
          )}
        </div>

        {/* Séparateur vertical pleine hauteur (desktop) */}
        <div aria-hidden className="hidden bg-border sm:col-start-2 sm:block sm:self-stretch" />

        {/* Droite — données de comparaison */}
        <div className="max-sm:border-t max-sm:border-border max-sm:pt-6 sm:col-start-3">
          <Text variant="kicker" as="p">
            Données de comparaison
            {referentielNom && <span className="text-primary"> · {referentielNom}</span>}
          </Text>
          <ul className="mt-3 flex flex-col gap-0.5">
            <ComparisonRow
              valueClassName={TEXT_CLASS_BY_INTERPRETATION[extremes.max]}
              label="Valeur maximale observée"
              value={stats.max}
              unite={unite}
              isBestValue={extremes.max === 'favorable'}
            />
            <ComparisonRow
              valueClassName="text-blue-cumulus"
              label="Valeur médiane observée"
              value={stats.mediane}
              unite={unite}
            />
            <ComparisonRow
              valueClassName={TEXT_CLASS_BY_INTERPRETATION[extremes.min]}
              label="Valeur minimale observée"
              value={stats.min}
              unite={unite}
              isBestValue={extremes.min === 'favorable'}
            />
          </ul>

          {ecartMediane !== null && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <Text variant="body" tone="muted" className="font-bold">
                Écart à la médiane
              </Text>
              <MedianGapPill
                ecartMediane={ecartMediane}
                unite={unite}
                sensSouhaite={sensSouhaite}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// Flèche et libellé décrivent le mouvement réel ; la couleur et le mot l'interprètent.
// Tous suivent le signe affiché : une variation lue « 0 » est stable.
function VariationPill({
  variation,
  sensSouhaite,
}: {
  variation: number
  sensSouhaite: SensSouhaite
}) {
  const sign = displayedDifferenceSign(variation)
  const interpretation = interpretDifference(sign, sensSouhaite)
  const label = INTERPRETATION_LABEL[interpretation]
  return (
    <Pill tone={TONE_BY_INTERPRETATION[interpretation]} className="mt-3 w-fit text-sm">
      {sign === 0 ? (
        <span>
          <span aria-hidden="true">→</span> STABLE
        </span>
      ) : (
        <span>
          <span aria-hidden="true">{sign > 0 ? '↑' : '↓'}</span>{' '}
          {sign > 0 ? 'EN HAUSSE' : 'EN BAISSE'} : {formatDifferenceFr(variation)}
          {label && <> · {label}</>}
        </span>
      )}
    </Pill>
  )
}

// Même libellé dans les deux sens ; le signe est conservé, la couleur suit le sens.
function MedianGapPill({
  ecartMediane,
  unite,
  sensSouhaite,
}: {
  ecartMediane: number
  unite: UniteIndicateurApiModel | null
  sensSouhaite: SensSouhaite
}) {
  const sign = displayedDifferenceSign(ecartMediane)
  const interpretation = interpretDifference(sign, sensSouhaite)
  const label = INTERPRETATION_LABEL[interpretation]
  const position =
    sign > 0 ? 'au-dessus de la médiane' : sign < 0 ? 'au-dessous de la médiane' : 'à la médiane'
  return (
    <Pill tone={TONE_BY_INTERPRETATION[interpretation]}>
      <span>
        {formatDifferenceFr(ecartMediane, unite)} · {position}
        {label && <> · {label}</>}
      </span>
    </Pill>
  )
}

function ComparisonRow({
  valueClassName,
  label,
  value,
  unite,
  isBestValue = false,
}: {
  valueClassName: string
  label: string
  value: number | null
  unite: UniteIndicateurApiModel | null
  isBestValue?: boolean
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-sm font-bold text-text-muted">{label}</span>
      <span
        className={clsxm(
          'whitespace-nowrap text-base font-bold tabular-nums',
          value === null ? 'text-text-subtle' : valueClassName,
        )}
      >
        {value === null ? (
          '—'
        ) : (
          <>
            {formatNumberFr(value)}
            {unite?.abbreviation && (
              <span className="ml-1 font-medium text-text-muted">{unite.abbreviation}</span>
            )}
            {isBestValue && (
              <span className="ml-2 text-xs font-medium text-text-muted">meilleure valeur</span>
            )}
          </>
        )}
      </span>
    </li>
  )
}
