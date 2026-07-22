import { useSuspenseQuery } from '@tanstack/react-query'

import { ProgressBar } from '@pilote/kpilote-ui/ProgressBar'
import { Text } from '@pilote/kpilote-ui/Typography'
import { formatNumberFr } from '@/lib/format'
import { collectionTauxProgressionIndividuQueryOptions } from '@/queries/collectionTauxProgression'

export function CollectionAvancementSkeleton() {
  return (
    <span
      className="flex animate-pulse flex-col gap-1"
      role="status"
      aria-label="Chargement de la progression du collection"
    >
      <span className="h-[18px] w-20 rounded bg-border" />
      <span className="h-2 w-full rounded bg-border" />
    </span>
  )
}

export function CollectionAvancement({
  collectionId,
  individuId,
}: {
  collectionId: string
  individuId: string
}) {
  const { data } = useSuspenseQuery(
    collectionTauxProgressionIndividuQueryOptions(individuId, collectionId),
  )

  if (data == null || data.tauxProgression == null) return null

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Text variant="kicker" tone="muted" as="p">
          Progression
        </Text>
        <span className="text-sm font-bold tabular-nums text-text-muted">
          {formatNumberFr(data.tauxProgression)} %
        </span>
      </div>
      <ProgressBar
        value={data.tauxProgression}
        tone="neutral"
        label={`Progression du collection : ${formatNumberFr(data.tauxProgression)} %`}
        className="mt-2"
      />
    </div>
  )
}
