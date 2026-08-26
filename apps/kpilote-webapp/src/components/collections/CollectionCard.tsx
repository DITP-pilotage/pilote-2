import type { CollectionApiModel } from '@pilote/kpilote-shared/collection'
import { analyticsEvents, type AnalyticsSource } from '@pilote/kpilote-shared/analytics/events'
import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'

import {
  CollectionAvancement,
  CollectionAvancementSkeleton,
} from '@/components/collections/CollectionAvancement'
import { analytics } from '@/analytics/tracker'
import { EntityCard } from '@pilote/kpilote-ui/EntityCard'

export type CollectionCardContext = {
  individu: string
  referentiel: string
}

export function CollectionCard({
  collection,
  context,
  source,
}: {
  collection: Pick<CollectionApiModel, 'id' | 'nom' | 'description' | 'indicateurs'>
  context?: CollectionCardContext | undefined
  source: AnalyticsSource
}) {
  const nb = collection.indicateurs.length
  return (
    <EntityCard
      asChild
      title={collection.nom}
      body={
        context ? (
          <Suspense fallback={<CollectionAvancementSkeleton />}>
            <CollectionAvancement collectionId={collection.id} individuId={context.individu} />
          </Suspense>
        ) : undefined
      }
      footer={
        <>
          {nb} indicateur{nb > 1 ? 's' : ''}
          {collection.description ? ` · ${collection.description}` : ''}
        </>
      }
    >
      <Link
        to="/collections/$id"
        params={{ id: collection.id }}
        search={context ?? {}}
        onClick={() =>
          analytics.trackEvent(
            analyticsEvents.collection.open({ entity_id: collection.id, source }),
          )
        }
      />
    </EntityCard>
  )
}
