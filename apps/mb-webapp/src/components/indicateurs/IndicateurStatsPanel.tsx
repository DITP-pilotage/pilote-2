import { type UniteIndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { useSuspenseQuery } from '@tanstack/react-query'

import { StatCard } from '@/components/ui/StatCard'
import { StatGrid } from '@/components/ui/StatGrid'
import { formatNumberAvecUniteFr } from '@/lib/format'
import { indicateurValeursRemarquablesQueryOptions } from '@/queries/indicateurs'

type IndicateurStatsPanelProps = {
  indicateurId: string
  referentielId: string
  unite: UniteIndicateurApiModel | null
}

export function IndicateurStatsPanel({
  indicateurId,
  referentielId,
  unite,
}: IndicateurStatsPanelProps) {
  const { data } = useSuspenseQuery(
    indicateurValeursRemarquablesQueryOptions(indicateurId, referentielId),
  )
  const stats = data.items[0] ?? { min: null, max: null, mediane: null }
  const formatStat = (value: number | null): string =>
    value === null ? '—' : formatNumberAvecUniteFr(value, unite)

  return (
    <StatGrid columns={3}>
      <StatCard label="Minimum" value={formatStat(stats.min)} />
      <StatCard label="Maximum" value={formatStat(stats.max)} />
      <StatCard label="Médiane" value={formatStat(stats.mediane)} />
    </StatGrid>
  )
}
