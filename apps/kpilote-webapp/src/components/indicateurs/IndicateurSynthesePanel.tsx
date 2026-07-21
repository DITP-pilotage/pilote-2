import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries } from '@tanstack/react-query'

import { IndicateurProgression } from '@/components/indicateurs/IndicateurProgression'
import { Pill } from '@pilote/kpilote-ui/Pill'
import { Heading, Text } from '@pilote/kpilote-ui/Typography'
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
  referentielNom: string | null
}

export function IndicateurSynthesePanel({
  indicateurId,
  referentielId,
  individuId,
  unite,
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
      <div className="flex flex-col gap-6 sm:grid sm:grid-cols-[1fr_1px_1fr] sm:items-start sm:gap-x-11">
        {/* Gauche — la valeur, sa trajectoire, puis la progression */}
        <div className="flex flex-col gap-4 sm:col-start-1">
          <div>
            <Text variant="kicker" as="p">
              Valeur d&apos;avancement
            </Text>
            {derniere ? (
              <>
                <Heading as="p" size="display-sm" className="mt-3 text-blue-cumulus">
                  {formatNumberFr(derniere.valeur)}
                  {unite?.abbreviation && <span className="ml-2">{unite.abbreviation}</span>}
                </Heading>
                <Text variant="body" tone="subtle" className="mt-2">
                  {formatMonthYearNumericFr(derniere.date)}
                </Text>
                {variation !== null && variation !== 0 && (
                  <Pill tone={variation > 0 ? 'success' : 'warning'} className="mt-3 w-fit">
                    {variation > 0 ? '↑' : '↓'} {variation > 0 ? 'EN HAUSSE' : 'EN BAISSE'} :{' '}
                    {formatVariationFr(variation)}
                  </Pill>
                )}
              </>
            ) : (
              <Heading as="p" size="display-sm" tone="muted" className="mt-3">
                —
              </Heading>
            )}

            {precedente && (
              <Text variant="body" tone="muted" className="mt-3">
                Valeur précédente :{' '}
                <span className="font-semibold text-primary">
                  {formatNumberAvecUniteFr(precedente.valeur, unite)}
                </span>{' '}
                ({formatMonthYearNumericFr(precedente.date)})
              </Text>
            )}
          </div>

          {taux !== null && dernierPoint && (
            <IndicateurProgression
              taux={taux}
              valeurCible={dernierPoint.valeurCible}
              dateCible={dernierPoint.dateCible}
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
            <ComparaisonRow
              valueClassName="text-success-425"
              label="Valeur maximale observée"
              value={stats.max}
              unite={unite}
            />
            <ComparaisonRow
              valueClassName="text-blue-425"
              label="Valeur médiane observée"
              value={stats.mediane}
              unite={unite}
            />
            <ComparaisonRow
              valueClassName="text-warning-425"
              label="Valeur minimale observée"
              value={stats.min}
              unite={unite}
            />
          </ul>

          {ecartMediane !== null && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <Text variant="body" tone="muted">
                Écart à la médiane
              </Text>
              <Pill tone={ecartMediane > 0 ? 'success' : ecartMediane < 0 ? 'warning' : 'info'}>
                {formatVariationAvecUniteFr(ecartMediane, unite)} ·{' '}
                {ecartMediane > 0 ? 'en avance' : ecartMediane < 0 ? 'en retard' : 'à la médiane'}
              </Pill>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function ComparaisonRow({
  valueClassName,
  label,
  value,
  unite,
}: {
  valueClassName: string
  label: string
  value: number | null
  unite: UniteIndicateurApiModel | null
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-sm text-text-muted">{label}</span>
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
