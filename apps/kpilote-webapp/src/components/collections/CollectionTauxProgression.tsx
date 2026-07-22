import { useSuspenseQuery } from '@tanstack/react-query'

import { StatCard } from '@pilote/kpilote-ui/StatCard'
import { collectionTauxProgressionQueryOptions } from '@/queries/collections'

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
  if (contributions.length === 0) return 'Collection sans indicateur'
  return `${nbBloquants}/${contributions.length} indicateur${nbBloquants > 1 ? 's' : ''} sans taux`
}

export function CollectionTauxProgression({
  collectionId,
  individu,
}: {
  collectionId: string
  individu: string
}) {
  const { data } = useSuspenseQuery(
    collectionTauxProgressionQueryOptions({ collectionId, individu }),
  )
  return (
    <StatCard
      label="Avancement du collection"
      value={formatTaux(data.tauxProgression)}
      caption={buildCaption(data.tauxProgression, data.contributions)}
      tone={data.tauxProgression === null ? 'muted' : 'primary'}
    />
  )
}
