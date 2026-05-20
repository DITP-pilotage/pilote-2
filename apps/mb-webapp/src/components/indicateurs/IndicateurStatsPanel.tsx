import { useSuspenseQuery } from '@tanstack/react-query'

import { StatCard } from '@/components/ui/StatCard'
import { StatGrid } from '@/components/ui/StatGrid'
import { indicateurValeursRemarquablesQueryOptions } from '@/queries/indicateurs'

const numberFormatter = new Intl.NumberFormat('fr-FR')

const formatStat = (value: number | null): string =>
  value === null ? '—' : numberFormatter.format(value)

type IndicateurStatsPanelProps = {
  indicateurId: string
  referentielId: string
}

export function IndicateurStatsPanel({ indicateurId, referentielId }: IndicateurStatsPanelProps) {
  const { data } = useSuspenseQuery(
    indicateurValeursRemarquablesQueryOptions(indicateurId, referentielId),
  )
  const stats = data.items[0] ?? { min: null, max: null, mediane: null }

  return (
    <StatGrid columns={3}>
      <StatCard label="Minimum" value={formatStat(stats.min)} />
      <StatCard label="Maximum" value={formatStat(stats.max)} />
      <StatCard label="Médiane" value={formatStat(stats.mediane)} />
    </StatGrid>
  )
}
