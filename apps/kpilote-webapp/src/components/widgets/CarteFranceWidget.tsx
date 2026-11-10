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

// `fixe` / `onSelectIndividu` : indicateur multi-dimension — la carte montre la
// tranche (membres du référentiel × coordonnées fixées) et un clic ne change que
// la coordonnée de cette dimension. Absents : comportement historique.
export function CarteFranceWidget({
  widget,
  indicateurId,
  referentielId,
  fixe,
  onSelectIndividu,
  mapName,
  geoJson,
  frontieres,
}: {
  widget: WidgetApiModel
  indicateurId: string
  referentielId: string
  fixe?: string | undefined
  onSelectIndividu?: ((individuId: string) => void) | undefined
  mapName: string
  geoJson: FranceGeoJson
  frontieres: FranceGeoJson
}) {
  const navigate = useNavigate()
  const [{ data: individus }, { data: remarquables }] = useSuspenseQueries({
    queries: [
      referentielIndividusQueryOptions(referentielId),
      indicateurValeursRemarquablesQueryOptions(indicateurId, referentielId, fixe),
    ],
  })

  const contributions = useMemo(
    () => remarquables.items.find((r) => r.referentiel === referentielId)?.contributions ?? [],
    [remarquables, referentielId],
  )

  const { points, individuIdByJoinValue } = useMemo(
    () => buildCarteFranceBindings({ individus, contributions, joinKey: widget.joinKey }),
    [individus, contributions, widget.joinKey],
  )

  const handleSelect = (joinValue: string): void => {
    const individuId = individuIdByJoinValue.get(joinValue)
    if (!individuId) return
    analytics.trackEvent(
      analyticsEvents.indicateur.individuChange({ referentiel_id: referentielId, source: 'map' }),
    )
    if (onSelectIndividu) {
      onSelectIndividu(individuId)
      return
    }
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
      onSelect={handleSelect}
    />
  )
}
