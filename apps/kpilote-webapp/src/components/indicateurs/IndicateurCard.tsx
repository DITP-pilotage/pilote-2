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
import { type Lecture } from '@/lib/individus/selection'
import { EntityCard } from '@pilote/kpilote-ui/EntityCard'
import { Text } from '@pilote/kpilote-ui/Typography'

// Sans `lecture`, la carte n'affiche pas d'avancement.
export function IndicateurCard({
  indicateur,
  lecture,
  source,
  collectionId,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom' | 'unite'>
  lecture?: Lecture | undefined
  source: AnalyticsSource
  collectionId?: string | undefined
}) {
  return (
    <EntityCard
      asChild
      title={indicateur.nom}
      className={clsxm(lecture?.indisponible && 'opacity-60')}
      body={lecture ? <IndicateurCardBody indicateur={indicateur} lecture={lecture} /> : undefined}
    >
      <Link
        to="/indicateurs/$id"
        params={{ id: indicateur.id }}
        search={lecture?.lien ?? {}}
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
  lecture,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'unite'>
  lecture: Lecture
}) {
  if (lecture.indisponible) {
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
        individus={lecture.individus}
        unite={indicateur.unite}
      />
    </Suspense>
  )
}
