import { type WidgetApiModel } from '@pilote/kpilote-shared/widget'
import { useSuspenseQueries } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { startTransition, useMemo } from 'react'

import { CarteFrance } from '@/components/widgets/CarteFrance'
import { buildCarteFranceBindings } from '@/components/widgets/carteFranceData'
import { type franceDepartementsGeoJsonQueryOptions } from '@/queries/geoJson'
import { indicateurValeursRemarquablesQueryOptions } from '@/queries/indicateurs'
import { referentielIndividusQueryOptions } from '@/queries/referentiels'

type GeoJsonQueryOptions = ReturnType<typeof franceDepartementsGeoJsonQueryOptions>

export function CarteFranceWidget({
  indicateurId,
  referentielId,
  mapName,
  geoJsonQueryOptions,
  frontieresQueryOptions,
}: {
  widget: WidgetApiModel
  indicateurId: string
  referentielId: string
  mapName: string
  geoJsonQueryOptions: GeoJsonQueryOptions
  frontieresQueryOptions: GeoJsonQueryOptions
}) {
  const navigate = useNavigate()
  const [{ data: geoJson }, { data: frontieres }, { data: individus }, { data: remarquables }] =
    useSuspenseQueries({
      queries: [
        geoJsonQueryOptions,
        frontieresQueryOptions,
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
