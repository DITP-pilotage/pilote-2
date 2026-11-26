import type { IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { analyticsEvents, type AnalyticsSource } from '@pilote/kpilote-shared/analytics/events'
import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'

import {
  IndicateurAvancement,
  IndicateurAvancementSkeleton,
} from '@/components/indicateurs/IndicateurAvancement'
import { analytics } from '@/analytics/tracker'
import { clsxm } from '@/lib/clsxm'
import { type CardReading } from '@/lib/individus/selection'
import { EntityCard } from '@pilote/kpilote-ui/EntityCard'
import { Text } from '@pilote/kpilote-ui/Typography'

// Sans `lecture`, la carte n'affiche pas d'avancement.
export function IndicateurCard({
  indicateur,
  reading,
  source,
  collectionId,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom' | 'unite'>
  reading?: CardReading | undefined
  source: AnalyticsSource
  collectionId?: string | undefined
}) {
  return (
    <EntityCard
      asChild
      title={indicateur.nom}
      className={clsxm(reading?.isUnavailable && 'opacity-60')}
      body={reading ? <IndicateurCardBody indicateur={indicateur} reading={reading} /> : undefined}
    >
      <Link
        to="/indicateurs/$id"
        params={{ id: indicateur.id }}
        search={reading?.link ?? {}}
        onClick={() =>
          analytics.trackEvent(
            analyticsEvents.indicateur.open({
              entity_id: indicateur.id,
              source,
              ...(collectionId ? { collection_id: collectionId } : {}),
            }),
          )
        }
      />
    </EntityCard>
  )
}

function IndicateurCardBody({
  indicateur,
  reading,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'unite'>
  reading: CardReading
}) {
  if (reading.isUnavailable) {
    return (
      <Text variant="body" tone="muted" className="text-sm">
        Cet indicateur n’est pas disponible pour le périmètre sélectionné
      </Text>
    )
  }
  return (
    <Suspense fallback={<IndicateurAvancementSkeleton />}>
      <IndicateurAvancement
        indicateurId={indicateur.id}
        individus={reading.individus}
        unite={indicateur.unite}
      />
    </Suspense>
  )
}
