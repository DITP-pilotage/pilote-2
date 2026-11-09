import { useSuspenseQuery } from '@tanstack/react-query'

import { StatCard } from '@pilote/kpilote-ui/StatCard'
import { collectionTauxProgressionQueryOptions } from '@/queries/collections'

const formatTaux = (taux: number | null): string => {
  if (taux === null) return '—'
  return `${taux} %`
}

// Seules les contributions pondérées (> 0) comptent : le calcul ignore celles à
// pondération 0, la légende aussi.
const buildCaption = (
  taux: number | null,
  contributions: ReadonlyArray<{ tauxProgression: number | null; ponderation: number }>,
): string => {
  if (taux !== null) return 'Moyenne pondérée des indicateurs'
  if (contributions.length === 0) return 'Collection sans indicateur'
  const ponderees = contributions.filter((c) => c.ponderation > 0)
  if (ponderees.length === 0) return 'Aucun indicateur pondéré'
  const nbBloquants = ponderees.filter((c) => c.tauxProgression === null).length
  return `${nbBloquants}/${ponderees.length} indicateur${nbBloquants > 1 ? 's' : ''} sans taux`
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
      label="Avancement de la collection"
      value={formatTaux(data.tauxProgression)}
      caption={buildCaption(data.tauxProgression, data.contributions)}
      tone={data.tauxProgression === null ? 'muted' : 'primary'}
    />
  )
}
