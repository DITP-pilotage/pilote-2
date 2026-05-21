import type { IndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { Link } from '@tanstack/react-router'

import { EntityCard } from '@/components/ui/EntityCard'
import { formatMonthYearNumericFr } from '@/lib/format'

function formatMiseAJour(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return formatMonthYearNumericFr(date)
}

type IndicateurCardProps = {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom' | 'updatedAt'>
}

export function IndicateurCard({ indicateur }: IndicateurCardProps) {
  return (
    <EntityCard
      asChild
      kicker={indicateur.id}
      title={indicateur.nom}
      footer={<>Mise à jour : {formatMiseAJour(indicateur.updatedAt)}</>}
    >
      <Link to="/indicateurs/$id" params={{ id: indicateur.id }} />
    </EntityCard>
  )
}
