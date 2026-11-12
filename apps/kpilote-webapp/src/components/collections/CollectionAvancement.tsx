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
      aria-label="Chargement de la progression de la collection"
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

  if (data == null) return null

  // Sans taux (règle tout-ou-rien, ou collection vide : l'API ne les distingue pas),
  // on garde le bloc avec « — » et sans barre, comme pour un indicateur.
  const taux = data.tauxProgression

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Text variant="kicker" tone="muted" as="p">
          Progression
        </Text>
        {taux == null ? (
          <span className="text-sm font-bold tabular-nums text-text-muted">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Progression de la collection non disponible</span>
          </span>
        ) : (
          <span className="text-sm font-bold tabular-nums text-text-muted">
            {formatNumberFr(taux)} %
          </span>
        )}
      </div>
      {taux != null && (
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
