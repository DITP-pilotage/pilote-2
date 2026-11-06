import { useSuspenseQuery } from '@tanstack/react-query'

import { StatCard } from '@pilote/kpilote-ui/StatCard'
import { collectionTauxProgressionQueryOptions } from '@/queries/collections'

const formatTaux = (taux: number | null): string => {
  if (taux === null) return '—'
  return `${taux} %`
}

// Les indicateurs « non applicables » (aucune dimension de la cellule demandée,
// collection mixte) sont exclus de la moyenne : ni bloquants ni comptés.
const buildCaption = (
  taux: number | null,
  contributions: ReadonlyArray<{
    tauxProgression: number | null
    nonApplicable?: true | undefined
  }>,
): string => {
  const applicables = contributions.filter((c) => c.nonApplicable !== true)
  const nbNonApplicables = contributions.length - applicables.length
  const suffixe =
    nbNonApplicables > 0
      ? ` (${nbNonApplicables} non applicable${nbNonApplicables > 1 ? 's' : ''})`
      : ''
  if (taux !== null) return `Moyenne pondérée des indicateurs${suffixe}`
  const nbBloquants = applicables.filter((c) => c.tauxProgression === null).length
  if (contributions.length === 0) return 'Collection sans indicateur'
  return `${nbBloquants}/${applicables.length} indicateur${nbBloquants > 1 ? 's' : ''} sans taux${suffixe}`
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
