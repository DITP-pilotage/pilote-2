import type { IndicateurApiModel } from '@pilote/mb-shared/indicateur'
import { Link } from '@tanstack/react-router'

import { EntityCard } from '@/components/ui/EntityCard'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: '2-digit',
  year: 'numeric',
})

function formatMiseAJour(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
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
