import { type SensSouhaite, type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries } from '@tanstack/react-query'

import { IndicateurProgression } from '@/components/indicateurs/IndicateurProgression'
import {
  type Interpretation,
  interpreterSelonSens,
  interpreterValeursExtremes,
} from '@/components/indicateurs/interpreterSelonSens'
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

type ValeurDate = { date: string; valeur: number }

// Série mensuelle triée du plus récent au plus ancien : [0] = dernière valeur,
// [1] = valeur précédente. La « valeur précédente » du ticket est dérivée ici,
// sans appel API dédié (la série est déjà en cache).
const valeursTrieesDesc = (items: ReadonlyArray<ValeurDate>): ValeurDate[] =>
  [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

// Lecture selon le sens souhaité (PIL-1778) : vert favorable, orange défavorable,
// bleu neutre. Le texte masqué donne la même information aux lecteurs d'écran.
const TON_PAR_INTERPRETATION: Record<Interpretation, PillTone> = {
  favorable: 'success',
  defavorable: 'warning',
  neutre: 'info',
}

const CLASSE_TEXTE_PAR_INTERPRETATION: Record<Interpretation, string> = {
  favorable: 'text-success-425',
  defavorable: 'text-warning-425',
  neutre: 'text-blue-425',
}

const LIBELLE_INTERPRETATION: Record<Interpretation, string | null> = {
  favorable: 'favorable',
  defavorable: 'défavorable',
  neutre: null,
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

  const serie = valeursTrieesDesc(valeurs.items)
  const derniere = serie[0]
  const precedente = serie[1]

  const variation = synthese.items[0]?.variation ?? null
  const ecartMediane = synthese.items[0]?.ecartMediane ?? null
  const stats = remarquables.items[0] ?? { min: null, max: null, mediane: null }

  const dernierPoint = tauxProgression.items[tauxProgression.items.length - 1]
  const taux = dernierPoint?.tauxProgression ?? null

  const { max: interpretationMax, min: interpretationMin } = interpreterValeursExtremes(
    stats,
    sensSouhaite,
  )

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
                {variation !== null && (
                  <PastilleVariation variation={variation} sensSouhaite={sensSouhaite} />
                )}
              </>
            ) : (
              <Heading as="p" size="display-sm" tone="muted" className="mt-3">
                —
              </Heading>
            )}

            {precedente && (
              <Text variant="body" tone="muted" className="mt-3">
                <span className="font-bold">Valeur précédente :</span>{' '}
                <span className="font-semibold text-primary">
                  {formatNumberFr(precedente.valeur, unite)}
                </span>{' '}
                ({formatMonthYearNumericFr(precedente.date)})
              </Text>
            )}
          </div>

          {dernierPoint && (
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
              valueClassName={CLASSE_TEXTE_PAR_INTERPRETATION[interpretationMax]}
              label="Valeur maximale observée"
              value={stats.max}
              unite={unite}
              srText={LIBELLE_INTERPRETATION[interpretationMax]}
            />
            <ComparaisonRow
              valueClassName="text-blue-425"
              label="Valeur médiane observée"
              value={stats.mediane}
              unite={unite}
            />
            <ComparaisonRow
              valueClassName={CLASSE_TEXTE_PAR_INTERPRETATION[interpretationMin]}
              label="Valeur minimale observée"
              value={stats.min}
              unite={unite}
              srText={LIBELLE_INTERPRETATION[interpretationMin]}
            />
          </ul>

          {ecartMediane !== null && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <Text variant="body" tone="muted" className="font-bold">
                Écart à la médiane
              </Text>
              <PastilleEcartMediane
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

// Flèche et libellé décrivent le mouvement réel ; seule la couleur l'interprète.
// Tous suivent le signe affiché : une variation lue « 0 » est stable.
function PastilleVariation({
  variation,
  sensSouhaite,
}: {
  variation: number
  sensSouhaite: SensSouhaite
}) {
  const signe = displayedDifferenceSign(variation)
  const interpretation = interpreterSelonSens(signe, sensSouhaite)
  const libelle = LIBELLE_INTERPRETATION[interpretation]
  return (
    <Pill tone={TON_PAR_INTERPRETATION[interpretation]} className="mt-3 w-fit text-sm">
      {signe === 0 ? (
        <span>
          <span aria-hidden="true">→</span> STABLE
        </span>
      ) : (
        <span>
          <span aria-hidden="true">{signe > 0 ? '↑' : '↓'}</span>{' '}
          {signe > 0 ? 'EN HAUSSE' : 'EN BAISSE'} : {formatDifferenceFr(variation)}
          {libelle && <span className="sr-only"> (évolution {libelle})</span>}
        </span>
      )}
    </Pill>
  )
}

// Même libellé dans les deux sens ; le signe est conservé, la couleur suit le sens.
function PastilleEcartMediane({
  ecartMediane,
  unite,
  sensSouhaite,
}: {
  ecartMediane: number
  unite: UniteIndicateurApiModel | null
  sensSouhaite: SensSouhaite
}) {
  const signe = displayedDifferenceSign(ecartMediane)
  const interpretation = interpreterSelonSens(signe, sensSouhaite)
  const libelle = LIBELLE_INTERPRETATION[interpretation]
  const position =
    signe > 0 ? 'au-dessus de la médiane' : signe < 0 ? 'au-dessous de la médiane' : 'à la médiane'
  return (
    <Pill tone={TON_PAR_INTERPRETATION[interpretation]}>
      <span>
        {formatDifferenceFr(ecartMediane, unite)} · {position}
        {libelle && <span className="sr-only"> (position {libelle})</span>}
      </span>
    </Pill>
  )
}

function ComparaisonRow({
  valueClassName,
  label,
  value,
  unite,
  srText,
}: {
  valueClassName: string
  label: string
  value: number | null
  unite: UniteIndicateurApiModel | null
  srText?: string | null
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
              <span className="ml-1 font-medium text-text-subtle">{unite.abbreviation}</span>
            )}
            {srText && <span className="sr-only"> ({srText})</span>}
          </>
        )}
      </span>
    </li>
  )
}
