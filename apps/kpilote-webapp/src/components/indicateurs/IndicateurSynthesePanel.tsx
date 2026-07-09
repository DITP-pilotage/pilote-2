import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQuery } from '@tanstack/react-query'

import { IndicateurProgression } from '@/components/indicateurs/IndicateurProgression'
import { Pill } from '@/components/ui/Pill'
import { PositionRelative } from '@/components/ui/PositionRelative'
import { Heading, Text } from '@/components/ui/Typography'
import { clsxm } from '@/lib/clsxm'
import {
  formatMonthYearNumericFr,
  formatNumberAvecUniteFr,
  formatNumberFr,
  formatVariationAvecUniteFr,
  formatVariationFr,
} from '@/lib/format'
import {
  indicateurSyntheseIndividuQueryOptions,
  indicateurTauxProgressionQueryOptions,
  indicateurValeursQueryOptions,
  indicateurValeursRemarquablesQueryOptions,
} from '@/queries/indicateurs'

type ValeurDate = { date: string; valeur: number }

// Série mensuelle triée du plus récent au plus ancien : [0] = dernière valeur,
// [1] = valeur précédente. La « valeur précédente » du ticket est dérivée ici,
// sans appel API dédié (la série est déjà en cache).
const valeursTrieesDesc = (items: ReadonlyArray<ValeurDate>): ValeurDate[] =>
  [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

type IndicateurSynthesePanelProps = {
  indicateurId: string
  referentielId: string
  individuId: string
  unite: UniteIndicateurApiModel | null
}

export function IndicateurSynthesePanel({
  indicateurId,
  referentielId,
  individuId,
  unite,
}: IndicateurSynthesePanelProps) {
  const { data: remarquables } = useSuspenseQuery(
    indicateurValeursRemarquablesQueryOptions(indicateurId, referentielId),
  )
  const { data: synthese } = useSuspenseQuery(
    indicateurSyntheseIndividuQueryOptions(indicateurId, individuId),
  )
  const { data: valeurs } = useSuspenseQuery(
    indicateurValeursQueryOptions(indicateurId, individuId),
  )
  const { data: tauxProgression } = useSuspenseQuery(
    indicateurTauxProgressionQueryOptions(indicateurId, individuId),
  )

  const serie = valeursTrieesDesc(valeurs.items)
  const derniere = serie[0]
  const precedente = serie[1]

  const variation = synthese.items[0]?.variation ?? null
  const ecartMediane = synthese.items[0]?.ecartMediane ?? null
  const stats = remarquables.items[0] ?? { min: null, max: null, mediane: null }

  const dernierPoint = tauxProgression.items[tauxProgression.items.length - 1]
  const taux = dernierPoint?.tauxProgression ?? null

  return (
    <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:grid sm:grid-cols-[1fr_1px_1fr] sm:items-start sm:gap-x-11 sm:gap-y-7">
        {/* Rangée 1 · gauche — la valeur & sa trajectoire */}
        <div className="sm:col-start-1 sm:row-start-1">
          <Text variant="kicker" as="p">
            Valeur d&apos;avancement
          </Text>
          {derniere ? (
            <>
              <Heading as="p" size="display-xl" className="mt-3">
                {formatNumberFr(derniere.valeur)}
                {unite?.abbreviation && (
                  <span className="ml-[0.06em] text-[0.46em] font-bold text-text-muted">
                    {unite.abbreviation}
                  </span>
                )}
              </Heading>
              <Text variant="caption" tone="subtle" className="mt-2">
                au {formatMonthYearNumericFr(derniere.date)}
              </Text>
            </>
          ) : (
            <Heading as="p" size="display-xl" tone="muted" className="mt-3">
              —
            </Heading>
          )}

          {variation !== null && variation !== 0 && (
            <div className="mt-4">
              <Pill tone={variation > 0 ? 'success' : 'warning'}>
                {variation > 0 ? '↑' : '↓'} {variation > 0 ? 'En hausse' : 'En baisse'} :{' '}
                {formatVariationFr(variation)}
              </Pill>
            </div>
          )}

          {precedente && (
            <Text variant="body" tone="muted" className="mt-3">
              Valeur précédente :{' '}
              <span className="font-semibold text-text">
                {formatNumberAvecUniteFr(precedente.valeur, unite)}
              </span>{' '}
              ({formatMonthYearNumericFr(precedente.date)})
            </Text>
          )}
        </div>

        {/* Séparateur vertical pleine hauteur (desktop) */}
        <div
          aria-hidden
          className="hidden bg-border sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:block sm:self-stretch"
        />

        {/* Rangée 1 · droite — la distribution de référence */}
        <div className="sm:col-start-3 sm:row-start-1">
          <Text variant="kicker" tone="subtle" as="p">
            Données de comparaison
          </Text>
          <ul className="mt-3 flex flex-col gap-0.5">
            <ComparaisonRow
              dotClassName="bg-success"
              label="Valeur maximale observée"
              value={stats.max}
              unite={unite}
            />
            <ComparaisonRow
              dotClassName="bg-text-subtle"
              label="Valeur médiane observée"
              value={stats.mediane}
              unite={unite}
            />
            <ComparaisonRow
              dotClassName="bg-accent-rouge"
              label="Valeur minimale observée"
              value={stats.min}
              unite={unite}
            />
          </ul>
          {ecartMediane !== null && (
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <Text variant="body" tone="muted">
                Écart à la médiane
              </Text>
              <Pill tone={ecartMediane > 0 ? 'success' : ecartMediane < 0 ? 'warning' : 'neutral'}>
                {formatVariationAvecUniteFr(ecartMediane, unite)} ·{' '}
                {ecartMediane > 0 ? 'en avance' : ecartMediane < 0 ? 'en retard' : 'à la médiane'}
              </Pill>
            </div>
          )}
        </div>

        {/* Rangée 2 · gauche — progression (alignée avec la position relative) */}
        {taux !== null && dernierPoint && (
          <div className="sm:col-start-1 sm:row-start-2">
            <IndicateurProgression
              taux={taux}
              valeurCible={dernierPoint.valeurCible}
              dateCible={dernierPoint.dateCible}
              unite={unite}
            />
          </div>
        )}

        {/* Rangée 2 · droite — position relative */}
        <div className="sm:col-start-3 sm:row-start-2">
          <Text variant="kicker" tone="subtle" as="p" className="mb-3">
            Position relative
          </Text>
          <PositionRelative
            min={stats.min}
            mediane={stats.mediane}
            max={stats.max}
            valeur={derniere?.valeur ?? null}
            unite={unite}
          />
        </div>
      </div>
    </section>
  )
}

function ComparaisonRow({
  dotClassName,
  label,
  value,
  unite,
}: {
  dotClassName: string
  label: string
  value: number | null
  unite: UniteIndicateurApiModel | null
}) {
  return (
    <li className="flex items-baseline justify-between py-1.5">
      <span className="flex items-center gap-2.5 text-sm text-text-muted">
        <span className={clsxm('size-2 rounded-full', dotClassName)} aria-hidden />
        {label}
      </span>
      <span className="whitespace-nowrap text-base font-bold tabular-nums text-text">
        {value === null ? (
          '—'
        ) : (
          <>
            {formatNumberFr(value)}
            {unite?.abbreviation && (
              <span className="ml-0.5 text-xs font-medium text-text-subtle">
                {unite.abbreviation}
              </span>
            )}
          </>
        )}
      </span>
    </li>
  )
}
