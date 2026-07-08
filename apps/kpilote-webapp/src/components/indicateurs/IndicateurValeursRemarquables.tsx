import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { type ValeurDateApiModel } from '@pilote/kpilote-shared/valeurAvancement'
import { useSuspenseQuery } from '@tanstack/react-query'

import { StatCard } from '@/components/ui/StatCard'
import { StatGrid } from '@/components/ui/StatGrid'
import {
  formatDateFr,
  formatNumberAvecUniteFr,
  formatNumberFr,
  formatVariationAvecUniteFr,
  formatVariationFr,
} from '@/lib/format'
import {
  indicateurSyntheseIndividuQueryOptions,
  indicateurTauxProgressionQueryOptions,
  indicateurValeursQueryOptions,
} from '@/queries/indicateurs'

const derniereValeurFromItems = (
  items: ReadonlyArray<{ date: string; valeur: number }>,
): ValeurDateApiModel | undefined => {
  if (items.length === 0) return undefined
  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return { date: sorted[0]!.date, valeur: sorted[0]!.valeur }
}

const variationTone = (variation: number | null): 'positive' | 'negative' | 'muted' => {
  if (variation === null || variation === 0) return 'muted'
  return variation > 0 ? 'positive' : 'negative'
}

type IndicateurValeursRemarquablesProps = {
  indicateurId: string
  individuId: string
  unite: UniteIndicateurApiModel | null
}

export function IndicateurValeursRemarquables({
  indicateurId,
  individuId,
  unite,
}: IndicateurValeursRemarquablesProps) {
  const { data: synthese } = useSuspenseQuery(
    indicateurSyntheseIndividuQueryOptions(indicateurId, individuId),
  )
  const { data: valeurs } = useSuspenseQuery(
    indicateurValeursQueryOptions(indicateurId, individuId),
  )
  const { data: tauxProgression } = useSuspenseQuery(
    indicateurTauxProgressionQueryOptions(indicateurId, individuId),
  )

  const derniereValeur = derniereValeurFromItems(valeurs.items)
  const variation = synthese.items[0]?.variation ?? null
  const ecartMediane = synthese.items[0]?.ecartMediane ?? null

  const dernierPoint = tauxProgression.items[tauxProgression.items.length - 1]
  const hasTaux = dernierPoint !== undefined
  const columns = hasTaux ? 4 : 3

  return (
    <StatGrid columns={columns}>
      <StatCard
        label="Valeur d'avancement"
        tone={derniereValeur ? 'neutral' : 'muted'}
        value={derniereValeur ? formatNumberAvecUniteFr(derniereValeur.valeur, unite) : '—'}
        caption={derniereValeur ? `au ${formatDateFr(derniereValeur.date)}` : undefined}
      />
      <StatCard
        label="Variation depuis la dernière MAJ"
        tone={variationTone(variation)}
        value={variation === null ? '—' : formatVariationFr(variation)}
      />
      <StatCard
        label="Écart à la médiane"
        tone={ecartMediane === null ? 'muted' : 'neutral'}
        value={ecartMediane === null ? '—' : formatVariationAvecUniteFr(ecartMediane, unite)}
      />
      {hasTaux && (
        <StatCard
          label="Taux de progression"
          tone={dernierPoint.tauxProgression === null ? 'muted' : 'neutral'}
          value={
            dernierPoint.tauxProgression === null
              ? '—'
              : `${formatNumberFr(dernierPoint.tauxProgression)} %`
          }
          caption={`cible : ${formatNumberAvecUniteFr(dernierPoint.valeurCible, unite)} au ${formatDateFr(dernierPoint.dateCible)}`}
        />
      )}
    </StatGrid>
  )
}
