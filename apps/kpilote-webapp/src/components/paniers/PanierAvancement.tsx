import { useSuspenseQuery } from '@tanstack/react-query'

import { ProgressBar } from '@pilote/kpilote-ui/ProgressBar'
import { Text } from '@pilote/kpilote-ui/Typography'
import { formatNumberFr } from '@/lib/format'
import { panierTauxProgressionIndividuQueryOptions } from '@/queries/panierTauxProgression'

export function PanierAvancementSkeleton() {
  return (
    <span
      className="flex animate-pulse flex-col gap-1"
      role="status"
      aria-label="Chargement de la progression du panier"
    >
      <span className="h-[18px] w-20 rounded bg-border" />
      <span className="h-2 w-full rounded bg-border" />
    </span>
  )
}

export function PanierAvancement({
  panierId,
  individuId,
}: {
  panierId: string
  individuId: string
}) {
  const { data } = useSuspenseQuery(panierTauxProgressionIndividuQueryOptions(individuId, panierId))

  if (data == null || data.tauxProgression == null) return null

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Text variant="kicker" tone="subtle" as="p">
          Progression
        </Text>
        <span className="text-sm font-bold tabular-nums text-text">
          {formatNumberFr(data.tauxProgression)} %
        </span>
      </div>
      <ProgressBar
        value={data.tauxProgression}
        label={`Progression du panier : ${formatNumberFr(data.tauxProgression)} %`}
        className="mt-2"
      />
    </div>
  )
}
