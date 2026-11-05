import { type WidgetApiModel } from '@pilote/kpilote-shared/widget'
import { useSuspenseQueries } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { startTransition, useMemo } from 'react'

import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'

import { analytics } from '@/analytics/tracker'
import { type FranceGeoJson } from '@/assets/maps/geoJson'
import { CarteFrance } from '@/components/widgets/CarteFrance'
import { buildCarteFranceBindings } from '@/components/widgets/carteFranceData'
import { indicateurValeursRemarquablesQueryOptions } from '@/queries/indicateurs'
import { referentielIndividusQueryOptions } from '@/queries/referentiels'

export function CarteFranceWidget({
  indicateurId,
  referentielId,
  mapName,
  geoJson,
  frontieres,
  interactive = true,
}: {
  widget: WidgetApiModel
  indicateurId: string
  referentielId: string
  mapName: string
  geoJson: FranceGeoJson
  frontieres: FranceGeoJson
  /** Hors de la page de l'indicateur (un dashboard de l'assistant), un clic ne navigue pas. */
  interactive?: boolean
}) {
  const navigate = useNavigate()
  const [{ data: individus }, { data: remarquables }] = useSuspenseQueries({
    queries: [
      referentielIndividusQueryOptions(referentielId),
      indicateurValeursRemarquablesQueryOptions(indicateurId, referentielId),
    ],
  })

  const contributions = useMemo(
    () => remarquables.items.find((r) => r.referentiel === referentielId)?.contributions ?? [],
    [remarquables, referentielId],
  )

  const { points, individuIdByJoinValue } = useMemo(
    () => buildCarteFranceBindings({ individus, contributions }),
    [individus, contributions],
  )

  const handleSelect = (joinValue: string): void => {
    const individuId = individuIdByJoinValue.get(joinValue)
    if (!individuId) return
    analytics.trackEvent(
      analyticsEvents.indicateur.individuChange({ referentiel_id: referentielId, source: 'map' }),
    )
    startTransition(() => {
      void navigate({
        to: '.',
        search: (prev) => ({ ...prev, individu: individuId, referentiel: referentielId }),
        resetScroll: false,
      })
    })
  }

  return (
    <CarteFrance
      mapName={mapName}
      geoJson={geoJson}
      frontieres={frontieres}
      points={points}
      {...(interactive ? { onSelect: handleSelect } : {})}
    />
  )
}
