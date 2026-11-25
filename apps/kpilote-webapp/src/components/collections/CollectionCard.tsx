import type { CollectionApiModel } from '@pilote/kpilote-shared/collection'
import { analyticsEvents, type AnalyticsSource } from '@pilote/kpilote-shared/analytics/events'
import { Link } from '@tanstack/react-router'
import { Suspense } from 'react'

import {
  CollectionAvancement,
  CollectionAvancementSkeleton,
} from '@/components/collections/CollectionAvancement'
import { analytics } from '@/analytics/tracker'
import { type Lecture } from '@/lib/individus/selection'
import { EntityCard } from '@pilote/kpilote-ui/EntityCard'

export function CollectionCard({
  collection,
  lecture,
  source,
}: {
  collection: Pick<CollectionApiModel, 'id' | 'nom' | 'description' | 'indicateurs'>
  lecture: Lecture
  source: AnalyticsSource
}) {
  const nb = collection.indicateurs.length
  return (
    <EntityCard
      asChild
      title={collection.nom}
      body={
        <Suspense fallback={<CollectionAvancementSkeleton />}>
          <CollectionAvancement collectionId={collection.id} individus={lecture.individus} />
        </Suspense>
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
        search={lecture.lien}
        onClick={() =>
          analytics.trackEvent(
            analyticsEvents.collection.open({ entity_id: collection.id, source }),
          )
        }
      />
    </EntityCard>
  )
}
