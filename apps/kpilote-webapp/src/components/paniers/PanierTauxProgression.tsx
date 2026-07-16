import { useSuspenseQuery } from '@tanstack/react-query'

import { StatCard } from '@pilote/kpilote-ui/StatCard'
import { panierTauxProgressionQueryOptions } from '@/queries/paniers'

const formatTaux = (taux: number | null): string => {
  if (taux === null) return '—'
  return `${taux} %`
}

const buildCaption = (
  taux: number | null,
  contributions: ReadonlyArray<{ tauxProgression: number | null }>,
): string => {
  if (taux !== null) return 'Moyenne pondérée des indicateurs'
  const nbBloquants = contributions.filter((c) => c.tauxProgression === null).length
  if (contributions.length === 0) return 'Panier sans indicateur'
  return `${nbBloquants}/${contributions.length} indicateur${nbBloquants > 1 ? 's' : ''} sans taux`
}

export function PanierTauxProgression({
  panierId,
  individu,
}: {
  panierId: string
  individu: string
}) {
  const { data } = useSuspenseQuery(panierTauxProgressionQueryOptions({ panierId, individu }))
  return (
    <StatCard
      label="Avancement du panier"
      value={formatTaux(data.tauxProgression)}
      caption={buildCaption(data.tauxProgression, data.contributions)}
      tone={data.tauxProgression === null ? 'muted' : 'primary'}
    />
  )
}
