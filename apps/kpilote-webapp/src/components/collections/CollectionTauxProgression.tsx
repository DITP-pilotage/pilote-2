import { type CollectionTauxProgressionApiModel } from '@pilote/kpilote-shared/collectionTauxProgression'
import { useSuspenseQuery } from '@tanstack/react-query'

import { StatCard } from '@pilote/kpilote-ui/StatCard'
import { collectionTauxProgressionQueryOptions } from '@/queries/collections'

const formatTaux = (taux: number | null): string => {
  if (taux === null) return '—'
  return `${taux} %`
}

// Seules les contributions pondérées (> 0) comptent : le calcul ignore celles à
// pondération 0, la légende aussi.
const buildCaption = ({
  tauxProgression,
  raisonSansTaux,
  contributions,
}: CollectionTauxProgressionApiModel): string => {
  if (tauxProgression !== null) return 'Moyenne pondérée des indicateurs'
  if (raisonSansTaux === 'COLLECTION_VIDE') return 'Collection sans indicateur'
  if (raisonSansTaux === 'AUCUN_INDICATEUR_PONDERE') return 'Aucun indicateur pondéré'
  if (raisonSansTaux === 'INDICATEUR_A_LA_BAISSE') {
    return 'Non calculable : la collection contient un indicateur à la baisse'
  }
  const ponderees = contributions.filter((c) => c.ponderation > 0)
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
      caption={buildCaption(data)}
      tone={data.tauxProgression === null ? 'muted' : 'primary'}
    />
  )
}
