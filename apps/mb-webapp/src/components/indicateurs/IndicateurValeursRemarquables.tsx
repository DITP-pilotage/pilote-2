import { type ValeurDateApiModel } from '@pilote/mb-shared/valeurAvancement'
import { useSuspenseQuery } from '@tanstack/react-query'

import { StatCard } from '@/components/ui/StatCard'
import { StatGrid } from '@/components/ui/StatGrid'
import {
  indicateurSyntheseIndividuQueryOptions,
  indicateurValeursQueryOptions,
} from '@/queries/indicateurs'

const numberFormatter = new Intl.NumberFormat('fr-FR')
const variationFormatter = new Intl.NumberFormat('fr-FR', { signDisplay: 'exceptZero' })

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
}

export function IndicateurValeursRemarquables({
  indicateurId,
  individuId,
}: IndicateurValeursRemarquablesProps) {
  const { data: synthese } = useSuspenseQuery(
    indicateurSyntheseIndividuQueryOptions(indicateurId, individuId),
  )
  const { data: valeurs } = useSuspenseQuery(
    indicateurValeursQueryOptions(indicateurId, individuId),
  )

  const derniereValeur = derniereValeurFromItems(valeurs.items)
  const variation = synthese.items[0]?.variation ?? null

  return (
    <StatGrid columns={2}>
      <StatCard
        label="Valeur la plus récente"
        tone={derniereValeur ? 'neutral' : 'muted'}
        value={derniereValeur ? numberFormatter.format(derniereValeur.valeur) : '—'}
        caption={
          derniereValeur
            ? `au ${new Date(derniereValeur.date).toLocaleDateString('fr-FR')}`
            : undefined
        }
      />
      <StatCard
        label="Variation depuis la dernière MAJ"
        tone={variationTone(variation)}
        value={variation === null ? '—' : variationFormatter.format(variation)}
      />
    </StatGrid>
  )
}
