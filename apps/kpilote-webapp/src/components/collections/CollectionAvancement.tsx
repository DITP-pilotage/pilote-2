import { useSuspenseQuery } from '@tanstack/react-query'

import { ProgressBar } from '@pilote/kpilote-ui/ProgressBar'
import { Text } from '@pilote/kpilote-ui/Typography'
import { formatNumberFr } from '@/lib/format'
import { collectionTauxProgressionQueryOptions } from '@/queries/collectionTauxProgression'

export function CollectionAvancementSkeleton() {
  return (
    <span
      className="flex animate-pulse flex-col gap-1"
      role="status"
      aria-label="Chargement de la progression de la collection"
    >
      <span className="h-[18px] w-20 rounded bg-border" />
      <span className="h-2 w-full rounded bg-border" />
    </span>
  )
}

export function CollectionAvancement({
  collectionId,
  individus,
}: {
  collectionId: string
  individus: ReadonlyArray<string> | undefined
}) {
  const { data } = useSuspenseQuery(
    collectionTauxProgressionQueryOptions({ individus, collectionId }),
  )

  if (data == null) return null
  const taux = data.tauxProgression
  // Un manque de données masque le bloc ; un indicateur à la baisse n'est pas un
  // manque : on garde le bloc et on dit pourquoi il n'y a pas de taux.
  if (taux == null && data.raisonSansTaux !== 'INDICATEUR_A_LA_BAISSE') return null

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Text variant="kicker" tone="muted" as="p">
          Progression
        </Text>
        <span className="text-sm font-bold tabular-nums text-text-muted">
          {taux == null ? '-' : `${formatNumberFr(taux)} %`}
        </span>
      </div>
      {taux == null ? (
        <Text variant="body" tone="muted" className="mt-1 text-sm">
          Non calculable : la collection contient un indicateur à la baisse
        </Text>
      ) : (
        <ProgressBar
          value={taux}
          tone="neutral"
          label={`Progression de la collection : ${formatNumberFr(taux)} %`}
          className="mt-2"
        />
      )}
    </div>
  )
}
