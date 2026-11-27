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
import { type ReferentielGroup } from '@/lib/individus/hierarchy'
import { type CardReading, findReadIndividu } from '@/lib/individus/selection'
import { EntityCard } from '@pilote/kpilote-ui/EntityCard'
import { Text } from '@pilote/kpilote-ui/Typography'

// Sans `lecture`, la carte n'affiche pas d'avancement.
export function IndicateurCard({
  indicateur,
  reading,
  groups,
  source,
  collectionId,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'nom' | 'unite' | 'sensSouhaite' | 'referentiels'>
  reading?: CardReading | undefined
  // Stacks de référentiels, pour nommer l'individu sur lequel la carte est lue.
  groups: ReadonlyArray<ReferentielGroup>
  source: AnalyticsSource
  collectionId?: string | undefined
}) {
  return (
    <EntityCard
      asChild
      title={indicateur.nom}
      className={clsxm(reading?.isUnavailable && 'opacity-60')}
      body={
        reading ? (
          <IndicateurCardBody indicateur={indicateur} reading={reading} groups={groups} />
        ) : undefined
      }
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
  groups,
}: {
  indicateur: Pick<IndicateurApiModel, 'id' | 'unite' | 'sensSouhaite' | 'referentiels'>
  reading: CardReading
  groups: ReadonlyArray<ReferentielGroup>
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
        sensSouhaite={indicateur.sensSouhaite}
        groups={groups}
        selectedIndividuId={findReadIndividu({
          reading,
          nodes: groups.flatMap((group) => group.nodes),
          referentielIds: indicateur.referentiels.map((referentiel) => referentiel.id),
        })}
      />
    </Suspense>
  )
}
