import { type WidgetApiModel } from '@pilote/mb-shared/widget'
import { useSuspenseQueries } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { startTransition, useMemo } from 'react'

import { CarteFrance, type CartePoint } from '@/components/widgets/CarteFrance'
import { codeInseeMetadataSchema } from '@/components/widgets/metadata'
import { type franceDepartementsGeoJsonQueryOptions } from '@/queries/geoJson'
import { indicateurValeursRemarquablesQueryOptions } from '@/queries/indicateurs'
import { referentielIndividusQueryOptions } from '@/queries/referentiels'

type GeoJsonQueryOptions = ReturnType<typeof franceDepartementsGeoJsonQueryOptions>

export function CarteFranceWidget({
  widget,
  indicateurId,
  referentielId,
  mapName,
  geoJsonQueryOptions,
}: {
  widget: WidgetApiModel
  indicateurId: string
  referentielId: string
  mapName: string
  geoJsonQueryOptions: GeoJsonQueryOptions
}) {
  const navigate = useNavigate()
  const [{ data: geoJson }, { data: individus }, { data: remarquables }] = useSuspenseQueries({
    queries: [
      geoJsonQueryOptions,
      referentielIndividusQueryOptions(referentielId),
      indicateurValeursRemarquablesQueryOptions(indicateurId, referentielId),
    ],
  })

  const { points, individuIdParJoinValue } = useMemo(() => {
    const referentielRemarquables = remarquables.items.find(
      (item) => item.referentiel === referentielId,
    )
    const valeurParIndividu = new Map(
      (referentielRemarquables?.contributions ?? []).map((c) => [c.individu, c.valeur]),
    )

    const pts: CartePoint[] = []
    const reverse = new Map<string, string>()
    for (const individu of individus) {
      const parsed = codeInseeMetadataSchema.safeParse(individu.metadata)
      if (!parsed.success) continue
      const joinValue = (parsed.data as Record<string, unknown>)[widget.joinKey]
      if (typeof joinValue !== 'string') continue
      reverse.set(joinValue, individu.id)
      const valeur = valeurParIndividu.get(individu.id)
      if (valeur === undefined) continue
      pts.push({ joinValue, valeur, nom: individu.nom })
    }
    return { points: pts, individuIdParJoinValue: reverse }
  }, [individus, remarquables, referentielId, widget.joinKey])

  const handleSelect = (joinValue: string): void => {
    const individuId = individuIdParJoinValue.get(joinValue)
    if (!individuId) return
    startTransition(() => {
      void navigate({
        to: '.',
        search: (prev) => ({ ...prev, individu: individuId, referentiel: referentielId }),
        resetScroll: false,
      })
    })
  }

  return <CarteFrance mapName={mapName} geoJson={geoJson} points={points} onSelect={handleSelect} />
}
