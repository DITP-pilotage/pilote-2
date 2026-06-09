import type { IndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { Link } from '@tanstack/react-router'

import { EntityCard } from '@/components/ui/EntityCard'
import { formatMonthYearNumericFr } from '@/lib/format'

function formatMiseAJour(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return formatMonthYearNumericFr(date)
}

export function IndicateurCard({
  indicateur,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom' | 'updatedAt'>
}) {
  return (
    <EntityCard
      asChild
      title={indicateur.nom}
      footer={<>Mis à jour {formatMiseAJour(indicateur.updatedAt)}</>}
    >
      <Link to="/indicateurs/$id" params={{ id: indicateur.id }} />
    </EntityCard>
  )
}
