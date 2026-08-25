import type { IndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { analyticsEvents, type AnalyticsSource } from '@pilote/kpilote-shared/analytics/events'
import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'

import {
  IndicateurAvancement,
  IndicateurAvancementSkeleton,
} from '@/components/indicateurs/IndicateurAvancement'
import { analytics } from '@/analytics/tracker'
import { EntityCard } from '@pilote/kpilote-ui/EntityCard'

export type IndicateurCardContext = {
  individu: string
  referentiel: string
}

export function IndicateurCard({
  indicateur,
  context,
  source,
  collectionId,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom' | 'unite'>
  context?: IndicateurCardContext | undefined
  source: AnalyticsSource
  collectionId?: string | undefined
}) {
  return (
    <EntityCard
      asChild
      title={indicateur.nom}
      body={
        context ? (
          <Suspense fallback={<IndicateurAvancementSkeleton />}>
            <IndicateurAvancement
              indicateurId={indicateur.id}
              individuId={context.individu}
              unite={indicateur.unite}
            />
          </Suspense>
        ) : undefined
      }
    >
      <Link
        to="/indicateurs/$id"
        params={{ id: indicateur.id }}
        search={context ?? {}}
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
